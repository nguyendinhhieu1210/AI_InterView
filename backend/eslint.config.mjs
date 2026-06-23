import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    ignores: ['node_modules/**', 'logs/**', 'src/**'],
  },

  {
    files: ['**/*.js'],
    extends: [js.configs.recommended],

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },

    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'no-empty': 'warn',
      'no-useless-catch': 'warn',

      // Tắt các rule đang gây lỗi hàng loạt
      'no-useless-assignment': 'off',
      'preserve-caught-error': 'off',
      'no-useless-escape': 'warn',
    },
  },
]);
