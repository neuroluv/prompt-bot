export class Normalize {
	static html(html: string) {
		if (!html) return '';

		let string = String(html).replace(/\r\n?/g, '\n');

		string = this.decodeEscapedTelegramTags(string);

		// Directus обычно хранит rich text в <p>, поэтому собираем контент по абзацам:
		// между абзацами — 1 перенос, пустые <p><br></p> дают дополнительные пустые строки.
		const paragraphs = this.extractParagraphs(string);
		if (paragraphs.length) {
			string = paragraphs.join('\n');
		}

		string = this.normalizeChunk(string);

		// нормализация пробелов вокруг переносов
		string = string.replace(/[ \t]+\n/g, '\n');
		string = string.replace(/\n[ \t]+/g, '\n');

		// ограничиваем "шум" до 2 пустых строк подряд, но сохраняем 1 и 2 отступа как есть
		string = string.replace(/\n{4,}/g, '\n\n\n').trim();

		return string;
	}

	static markdownV2(text: string): string {
		return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
	}

	private static extractParagraphs(source: string): string[] {
		const paragraphRegex = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
		const parts: string[] = [];
		let match: RegExpExecArray | null;

		while ((match = paragraphRegex.exec(source)) !== null) {
			const paragraph = this.normalizeChunk(match[1]);
			const isBlankParagraph = paragraph.replace(/\s+/g, '') === '';
			parts.push(isBlankParagraph ? '' : paragraph);
		}

		if (!parts.length) return [];

		const outsideParagraphs = source
			.replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, '')
			.replace(/\s+/g, '');
		if (outsideParagraphs) return [];

		return parts;
	}

	private static normalizeChunk(source: string): string {
		let string = source;

		// <br> -> \n
		string = string.replace(/<br\s*\/?>/gi, '\n');

		// удалить <p>, если остались после parse
		string = string.replace(/<\/?p\b[^>]*>/gi, '');

		// оставить только поддерживаемые Telegram HTML-теги
		string = string.replace(
			/<\/?([a-z0-9-]+)\b([^>]*)>/gi,
			(full, rawName: string, rawAttrs: string) =>
				this.sanitizeHtmlTag(full, rawName, rawAttrs),
		);

		return string;
	}

	private static sanitizeHtmlTag(
		fullTag: string,
		rawName: string,
		rawAttrs: string,
	): string {
		const name = rawName.toLowerCase();
		const isClosing = /^<\//.test(fullTag);

		if (isClosing) {
			if (this.ALLOWED_HTML_TAGS.has(name)) return `</${name}>`;
			return '';
		}

		if (!this.ALLOWED_HTML_TAGS.has(name)) return '';

		if (name === 'a') {
			const hrefMatch = rawAttrs.match(
				/\bhref\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s"'=<>`]+))/i,
			);
			const href = hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3];
			return href ? `<a href="${href}">` : '';
		}

		if (name === 'tg-emoji') {
			const emojiIdMatch = rawAttrs.match(
				/\bemoji-id\s*=\s*(?:"(\d+)"|'(\d+)'|(\d+))/i,
			);
			const emojiId =
				emojiIdMatch?.[1] ?? emojiIdMatch?.[2] ?? emojiIdMatch?.[3];
			return emojiId ? `<tg-emoji emoji-id="${emojiId}">` : '';
		}

		if (name === 'blockquote') {
			return /\bexpandable\b/i.test(rawAttrs)
				? '<blockquote expandable>'
				: '<blockquote>';
		}

		return `<${name}>`;
	}

	private static decodeEscapedTelegramTags(source: string): string {
		let string = source;

		// Directus часто экранирует tg-emoji как текст (&lt;tg-emoji ...&gt;...&lt;/tg-emoji&gt;)
		string = string.replace(
			/&lt;(\/?)tg-emoji\b([\s\S]*?)&gt;/gi,
			(_, slash: string, attrs: string) => `<${slash}tg-emoji${attrs}>`,
		);

		return string.replace(/&lt;\/tg-emoji&gt;/gi, '</tg-emoji>');
	}

	private static readonly ALLOWED_HTML_TAGS = new Set([
		'b',
		'strong',
		'i',
		'em',
		'u',
		's',
		'strike',
		'del',
		'code',
		'pre',
		'a',
		'tg-spoiler',
		'blockquote',
		'tg-emoji',
	]);
}
