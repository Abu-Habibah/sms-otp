import type { Config } from 'jest';

// Separate config for API route tests (Node environment, no JSX)
const config: Config = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@sms-monitor/shared-types$': '<rootDir>/../packages/shared-types/src/index.ts',
  },
  testMatch: ['<rootDir>/app/api/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
};

export default config;
