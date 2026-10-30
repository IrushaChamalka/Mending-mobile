const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const reactNative = require('eslint-plugin-react-native');

// Features may import `@/features/<name>` (its index.ts) but never a file inside another feature.
const FEATURE_INTERNALS = String.raw`^@/features/[^/]+/(?!index$).+`;
// Tests may also use another feature's fixtures.
const FEATURE_INTERNALS_EXCEPT_FIXTURES = String.raw`^@/features/[^/]+/(?!index$)(?!__fixtures__/).+`;
// Route files are the one exception: they re-export a screen from `@/features/<name>/screens/<Screen>`.
const FEATURE_INTERNALS_EXCEPT_SCREENS = String.raw`^@/features/[^/]+/(?!index$)(?!screens/[^/]+$).+`;

const readOnlyReferenceFolders = {
  group: [
    '**/backend/**',
    '**/figma-ui/**',
    '**/employee-figma-ui/**',
    '../../backend/*',
    '../../figma-ui/*',
    '../../UI/*',
  ],
  message:
    'App code must never import from backend/, UI/ or figma-ui/. They are read-only references.',
};

module.exports = defineConfig([
  globalIgnores([
    'node_modules/**',
    '.expo/**',
    'dist/**',
    'android/**',
    'ios/**',
    'coverage/**',
    'expo-env.d.ts',
  ]),
  expoConfig,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-native': reactNative,
    },
    rules: {
      // Styling rules from the brief: theme tokens only, StyleSheet.create only.
      'react-native/no-color-literals': 'error',
      'react-native/no-inline-styles': 'error',
      'react-native/no-unused-styles': 'error',
      // Logging goes through shared/lib/logger.
      'no-console': 'error',
      // Type-safety rules from the brief.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            readOnlyReferenceFolders,
            {
              regex: FEATURE_INTERNALS,
              message: 'Import other features only through their index.ts (e.g. @/features/tasks).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            readOnlyReferenceFolders,
            {
              regex: FEATURE_INTERNALS_EXCEPT_SCREENS,
              message: 'Route files may only re-export a screen from a feature.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/shared/lib/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}', 'jest.setup.ts'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            readOnlyReferenceFolders,
            {
              regex: FEATURE_INTERNALS_EXCEPT_FIXTURES,
              message: 'Tests import other features through their index.ts or __fixtures__.',
            },
          ],
        },
      ],
    },
  },
]);
