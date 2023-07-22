const nextJest = require('next/jest')

const createJestConfig = nextJest({
    dir: './',
})

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
    moduleDirectories: ['node_modules', '<rootDir>/'],
    testEnvironment: 'jest-environment-jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest/setup.ts'],
}

module.exports = createJestConfig(customJestConfig)
