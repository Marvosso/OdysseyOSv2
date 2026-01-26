/**
 * Jest Configuration for OdysseyOS Tests
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
    '**/?(*.)+(spec|test).ts',
    '**/?(*.)+(spec|test).tsx',
  ],
  
  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../src/$1',
  },
  
  // Coverage
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Higher thresholds for critical modules
    'src/lib/storage/**': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    'src/lib/import/**': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    'src/lib/validation/**': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  
  // Transform
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
