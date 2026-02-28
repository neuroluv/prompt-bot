/** @type {import("prettier").Config} */
const fallbackConfig = {
	trailingComma: 'all',
	tabWidth: 2,
	useTabs: true,
	semi: true,
	singleQuote: true,
	jsxSingleQuote: true,
	arrowParens: 'always',
	importOrderSeparation: false,
	importOrderSortSpecifiers: true,
	importOrderParserPlugins: ['classProperties', 'decorators-legacy', 'typescript'],
	bracketSpacing: true,
	bracketSameLine: false,
	importOrder: ['<THIRD_PARTY_MODULES>', '^@/(.*)$', '^../(.*)', '^./(.*)'],
	plugins: ['@trivago/prettier-plugin-sort-imports']
};

let config = fallbackConfig;

try {
	const { default: sharedConfig } = await import('@kireevdev/core/prettier');
	if (sharedConfig && typeof sharedConfig === 'object') {
		config = sharedConfig;
	}
} catch {}

export default config;
