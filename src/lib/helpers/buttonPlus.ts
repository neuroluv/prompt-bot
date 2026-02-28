import { Markup } from 'telegraf';

type BtnStyle = 'primary' | 'success' | 'danger';

export const callbackPlus = (
	text: string,
	data: string,
	opts?: { style?: BtnStyle; icon_custom_emoji_id?: string },
) => {
	const btn = Markup.button.callback(text, data) as any;

	if (opts?.style) btn.style = opts.style;
	if (opts?.icon_custom_emoji_id)
		btn.icon_custom_emoji_id = opts.icon_custom_emoji_id;

	return btn;
};

export const urlPlus = (
	text: string,
	url: string,
	opts?: { style?: BtnStyle; icon_custom_emoji_id?: string },
) => {
	const btn = Markup.button.url(text, url) as any;
	if (opts?.style) btn.style = opts.style;
	if (opts?.icon_custom_emoji_id)
		btn.icon_custom_emoji_id = opts.icon_custom_emoji_id;
	return btn;
};

export const webAppPlus = (
	text: string,
	url: string,
	opts?: { style?: BtnStyle; icon_custom_emoji_id?: string },
) => {
	const btn = Markup.button.webApp(text, url) as any;
	if (opts?.style) btn.style = opts.style;
	if (opts?.icon_custom_emoji_id)
		btn.icon_custom_emoji_id = opts.icon_custom_emoji_id;
	return btn;
};
