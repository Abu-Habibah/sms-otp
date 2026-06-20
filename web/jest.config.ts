import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@sms-monitor/shared-types$': '<rootDir>/../packages/shared-types/src/index.ts',
    '^.+/version\\.json$': '<rootDir>/version.json',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/src-backup/',
    '<rootDir>/app/api/__tests__/',  // API routes use separate config
  ],
  collectCoverageFrom: [
    'app/**/*.tsx',
    'lib/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  transform: {
    '^.+\\.tsx?$': ['@swc/jest', {
      jsc: {
        parser: { syntax: 'typescript', tsx: true },
        transform: { react: { runtime: 'automatic' } },
      },
    }],
  },
};

export default config;
