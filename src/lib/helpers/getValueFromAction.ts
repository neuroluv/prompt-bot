import type { Context } from 'telegraf';
import type { CallbackQuery } from 'telegraf/types';

export const getValueFromAction = (
	ctx: Context,
	{ separator = '-', index = 1 } = {},
): string | undefined => {
	// 1) inline callback data: "pay-start1"
	if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
		const data = (ctx.callbackQuery as CallbackQuery.DataQuery).data;
		return data.split(separator)[index];
	}

	// 2) start payload: /start value
	const startPayload = (ctx as any).startPayload as string | undefined;
	if (startPayload) return startPayload;

	// 3) message text fallback
	const text =
		ctx.message && 'text' in ctx.message ? ctx.message.text : undefined;
	if (!text) return undefined;

	const parts = text.trim().split(/\s+/);
	// "/start value" -> parts[1]
	return parts.length > 1 ? parts[1] : undefined;
};
