export class Normalize {
  static html(html: string) {
    if (!html) return '';

    let string = html;

    // <p>...</p> -> ...\n\n
    string = string.replace(/<\/p>\s*<p>/gi, '\n\n');
    string = string.replace(/<p[^>]*>/gi, '');
    string = string.replace(/<\/p>/gi, '');

    // <br> -> \n
    string = string.replace(/<br\s*\/?>/gi, '\n');

    // убрать не-нужные теги, оставить базовые телеграм-теги
    // Telegram поддерживает: b/strong, i/em, u, s/strike/del, code, pre, a[href]
    string = string.replace(
      /<(?!\/?(b|strong|i|em|u|s|strike|del|code|pre|a)(\s|>|\/)).*?>/gi,
      '',
    );

    // убрать лишние пробелы/переносы
    string = string.replace(/[ \t]+\n/g, '\n');
    string = string.replace(/\n{3,}/g, '\n\n').trim();

    return string;
  }

  static markdownV2(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
  }
}
