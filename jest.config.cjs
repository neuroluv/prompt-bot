module.exports = {
	moduleFileExtensions: ['js', 'json', 'ts'],
	rootDir: 'src',
	testRegex: '.*\\.spec\\.ts$',
	transform: {
		'^.+\\.(t|j)s$': [
			'ts-jest',
			{
				tsconfig: {
					...require('./tsconfig.json').compilerOptions,
					module: 'CommonJS',
					moduleResolution: 'Node10',
					ignoreDeprecations: '6.0',
				},
			},
		],
	},
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/$1',
		'^@lib(/.*)?$': '<rootDir>/lib$1',
		'^@config(/.*)?$': '<rootDir>/config$1',
		'^@utils(/.*)?$': '<rootDir>/lib/utils$1',
		'^bot(/.*)?$': '<rootDir>/bot$1',
		'^crud(/.*)?$': '<rootDir>/crud$1',
		'^config(/.*)?$': '<rootDir>/config$1',
		'^lib(/.*)?$': '<rootDir>/lib$1',
	},
	collectCoverageFrom: ['**/*.(t|j)s'],
	coverageDirectory: '../coverage',
	testEnvironment: 'node',
};
