import type { Config } from 'jest';

const config: Config = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testEnvironment: 'node',
    testRegex: '.e2e-spec.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    moduleNameMapper: {
        '^@dbc/auth(|/.*)$': '<rootDir>/libs/auth/src/$1',
        '^@dbc/core(|/.*)$': '<rootDir>/libs/core/src/$1',
    },
};

export default config;

