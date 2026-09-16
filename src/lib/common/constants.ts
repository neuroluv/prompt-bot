export const SUPPORT_USERNAME = 'neuroluv_support';

export interface RequiredChannel {
	label: string;
	chatId: string;
	url: string;
}

export const CHANNELS_LINKS: RequiredChannel[] = [
	{
		label: `Нейролюб | Нейросети`,
		chatId: '@NeuroLuv',
		url: 'https://t.me/NeuroLuv',
	},
	{
		label: 'ПРОМПТзона',
		chatId: '-1003771722409',
		url: 'https://t.me/+rnXVz8bpiKxhNzEy',
	},
	{
		label: 'ИИшная ложа',
		chatId: '-1003585311693',
		url: 'https://t.me/+Grg2MYLyMko2NjEy',
	},
];
export const GOOD_MEMBER_STATUSES = ['creator', 'administrator', 'member'];

export const ENV_NAMES = {
	DB_URL: 'DB_URL',
	TELEGRAM_BOT_TOKEN: 'TELEGRAM_BOT_TOKEN',
	TELEGRAM_BOT_USERNAME: 'TELEGRAM_BOT_USERNAME',
	TELEGRAM_ADMIN_IDS: 'TELEGRAM_ADMIN_IDS',
	PROMPT_BOT_INTERNAL_TOKEN: 'PROMPT_BOT_INTERNAL_TOKEN',
	NEUROLUV_API_URL: 'NEUROLUV_API_URL',
	TELEGRAM_CHANNEL_USERNAME: 'TELEGRAM_CHANNEL_USERNAME',
	TELEGRAM_CHANNEL_LINK: 'TELEGRAM_CHANNEL_LINK',
	TELEGRAM_CHANNEL_CHAT_LINK: 'TELEGRAM_CHANNEL_CHAT_LINK',
	ADMIN_USERNAME: 'ADMIN_USERNAME',
	DEVELOPER_USERNAME: 'DEVELOPER_USERNAME',
	TELEGRAM_BOT_CURRENCY: 'TELEGRAM_BOT_CURRENCY',
	REWARD_FOR_A_FRIEND: 'REWARD_FOR_A_FRIEND',
	MIN_WITHDRAWAL_AMOUNT: 'MIN_WITHDRAWAL_AMOUNT',
	MAX_WARNING_COUNT: 'MAX_WARNING_COUNT',
	MINING_SIZE_PER_SECOND: 'MINING_SIZE_PER_SECOND',
	MINING_SIZE_PER_SECOND_NUMBERS_OF_DIGITS:
		'MINING_SIZE_PER_SECOND_NUMBERS_OF_DIGITS',
	DAILY_REWARD_AMOUNT: 'DAILY_REWARD_AMOUNT',
	NODE_ENV: 'NODE_ENV',
	ENV_PATH: (mode?: 'development' | 'production' | 'test' | string) => {
		if (!mode) return '.env';
		return `.env.${mode}`;
	},
	PORT: 'PORT',
	SECRET_KEY: 'SECRET_KEY',
	JWT_EXPIRES: 'JWT_EXPIRES',
	JWT_ACCESS_KEY: 'JWT_ACCESS_KEY',
	JWT_REFRESH_KEY: 'JWT_REFRESH_KEY',
	SMTP_HOST: 'SMTP_HOST',
	SMTP_PORT: 'SMTP_PORT',
	SMTP_USER: 'SMTP_USER',
	SMTP_PASS: 'SMTP_PASS',
	ADMIN_ID: 'ADMIN_ID',
	SERVER_URL: 'SERVER_URL',
	CLIENT_URL: 'CLIENT_URL',
};

export function parseTelegramAdminIds(value: string | undefined): number[] {
	if (!value?.trim()) return [];
	const ids = value
		.split(',')
		.map((entry) => entry.trim())
		.filter(Boolean);
	if (
		ids.some(
			(entry) =>
				!/^\d{1,20}$/.test(entry) ||
				!Number.isSafeInteger(Number(entry)) ||
				Number(entry) <= 0,
		)
	) {
		throw new Error(
			'TELEGRAM_ADMIN_IDS must contain comma-separated numeric Telegram IDs',
		);
	}
	return [...new Set(ids)].map(Number);
}

// Default values
export const DEFAULT_CURRENCY = process.env[ENV_NAMES.TELEGRAM_BOT_CURRENCY];
export const DEFAULT_REWARD_FOR_A_FRIEND =
	+process.env[ENV_NAMES.REWARD_FOR_A_FRIEND];
export const DEFAULT_MIN_WITHDRAWAL_AMOUNT =
	+process.env[ENV_NAMES.MIN_WITHDRAWAL_AMOUNT];
export const DEFAULT_MINING_SIZE_PER_SECOND_NUMBERS_OF_DIGITS =
	+process.env[ENV_NAMES.MINING_SIZE_PER_SECOND_NUMBERS_OF_DIGITS];

// Default usernames
export const DEFAULT_ADMIN_USERNAME = process.env[ENV_NAMES.ADMIN_USERNAME];
export const DEFAULT_TELEGRAM_DEVELOPER_USERNAME =
	process.env[ENV_NAMES.DEVELOPER_USERNAME];
export const TELEGRAM_CHANNEL_USERNAME =
	process.env[ENV_NAMES.TELEGRAM_CHANNEL_USERNAME];
export const DEFAULT_TELEGRAM_BOT_USERNAME =
	process.env[ENV_NAMES.TELEGRAM_BOT_USERNAME];

// Default links
export const DEFAULT_TELEGRAM_CHANNEL_LINK =
	process.env[ENV_NAMES.TELEGRAM_CHANNEL_LINK];
export const DEFAULT_TELEGRAM_CHANNEL_CHAT_LINK =
	process.env[ENV_NAMES.TELEGRAM_CHANNEL_CHAT_LINK];
