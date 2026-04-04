// @ts-check
import eslint from '@eslint/js'
import furystack from '@furystack/eslint-plugin'
import prettierConfig from 'eslint-config-prettier'
import jsdoc from 'eslint-plugin-jsdoc'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'

export default defineConfig(
  {
    ignores: ['dist/*', 'node_modules/*', '.yarn/*', 'eslint.config.js'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettierConfig,
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      parserOptions: {
        project: ['tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      jsdoc,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off', // Use Typescript own check for this
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'explicit',
          overrides: {
            accessors: 'explicit',
            constructors: 'no-public',
            methods: 'explicit',
            properties: 'off',
            parameterProperties: 'explicit',
          },
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/array-type': ['error', { default: 'array-simple', readonly: 'array-simple' }],
      '@typescript-eslint/no-useless-constructor': 'error',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      'jsdoc/require-param-type': 'off',
      'jsdoc/require-returns-type': 'off',
      'object-shorthand': 'error',
      'dot-notation': 'error',
      'no-caller': 'error',
      'no-useless-concat': 'error',
      radix: 'error',
      yoda: 'error',
      'prefer-arrow-callback': 'error',
      'prefer-rest-params': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-spread': 'error',
      'no-shadow': 'error',
      'prefer-template': 'error',
      'prefer-destructuring': ['error', { array: false, object: true }],
      'default-case': 'error',
    },
  },
  {
    plugins: {
      furystack,
    },
    ...furystack.configs.recommendedStrict,
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    plugins: {
      furystack,
    },
    ...furystack.configs.shadesStrict,
  },
)
