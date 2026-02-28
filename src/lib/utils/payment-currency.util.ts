import { emojis } from './emojis';

const BEAUTY_CURRENCIES = {
	RUB: '₽',
	USD: '$',
	EUR: '€',
};

export const PAY_NEUROLUV_CLUB_CURRENCY_REGEX =
	/^pay-neuroluv_club-([a-z0-9][a-z0-9._-]*)$/i;

const FIAT_CURRENCIES = new Set(['USD', 'RUB', 'EUR']);

export function isFiatCurrency(currency: string | null | undefined): boolean {
	if (typeof currency !== 'string') return false;

	return FIAT_CURRENCIES.has(currency.trim().toUpperCase());
}

export const beautyCurrency = (
	currency: string | null | undefined,
	canEmoji = true,
): string => {
	if (typeof currency !== 'string') return '';

	const normalizedCurrency = currency.trim().toUpperCase();
	if (!normalizedCurrency) return '';

	const fiatCurrency =
		BEAUTY_CURRENCIES[normalizedCurrency as keyof typeof BEAUTY_CURRENCIES];
	if (fiatCurrency) return fiatCurrency;

	if (!canEmoji) return normalizedCurrency;

	const premiumEmojis = emojis.premium.forButtons as Record<string, unknown>;
	const cryptoCurrencyEmoji =
		premiumEmojis[normalizedCurrency] ??
		premiumEmojis[normalizedCurrency.toLowerCase()];

	if (typeof cryptoCurrencyEmoji === 'string') {
		return cryptoCurrencyEmoji;
	}

	return normalizedCurrency;
};
