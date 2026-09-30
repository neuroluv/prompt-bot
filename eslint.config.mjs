import typescript from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier/recommended';

export default [
	{ ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },
	{
		files: ['src/**/*.ts'],
		languageOptions: {
			parser,
			parserOptions: {
				project: './tsconfig.json',
				tsconfigRootDir: import.meta.dirname,
				sourceType: 'module',
			},
		},
		plugins: { '@typescript-eslint': typescript },
		rules: {
			...typescript.configs.recommended.rules,
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},
	{ ...prettier, files: ['src/**/*.ts'] },
];
