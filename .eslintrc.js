module.exports = {
  root: true,
  extends: ['@react-native-community', 'prettier'],
  env: {
    node: true,
    jest: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    // Make prettier warnings instead of errors
    'prettier/prettier': [
      'warn',
      {
        quoteProps: 'consistent',
        singleQuote: true,
        tabWidth: 2,
        trailingComma: 'es5',
        useTabs: false,
      },
    ],
    // Relax common strict rules
    'react-hooks/exhaustive-deps': 'warn',
    'react-native/no-unused-styles': 'warn',
    'react-native/split-platform-components': 'warn',
    'react-native/no-inline-styles': 'off',
    'react-native/no-color-literals': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    'no-console': 'warn',
    'no-unused-vars': 'off', // Let TypeScript handle this
    'prefer-const': 'warn',
    'no-var': 'warn',
  },
  overrides: [
    {
      // Special rules for test files
      files: [
        '**/__tests__/**/*',
        '**/*.test.*',
        '**/*.spec.*',
        'jest.setup.js',
        'jest-environment.js',
      ],
      env: {
        jest: true,
        node: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'lib/',
    '*.d.ts',
    'coverage/',
    'android/',
    'ios/',
  ],
};
