module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@deployx/database$': '<rootDir>/../../../packages/database/src',
    '^@deployx/shared$': '<rootDir>/../../../packages/shared/src',
    '^@deployx/auth$': '<rootDir>/../../../packages/auth/src',
  },
};
