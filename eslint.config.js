const pluginJs = require('@eslint/js');
const globals = require('globals');
const prettierPlugin = require('eslint-plugin-prettier');
const eslintConfigPrettier = require('eslint-config-prettier');

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  pluginJs.configs.recommended,
  {
    plugins: {
      prettier: prettierPlugin,
    },
  },
  {
    files: ['**/*.js'],
    rules: {
      ...prettierPlugin.configs.recommended.rules,
      ...eslintConfigPrettier.rules,
      'max-lines': 'warn',
      'max-params': ['error', 3],
      'no-unused-vars': 'off',
      "no-unused-private-class-members":'off',
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
        },
      ],
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2015,
      },
    },
  },
  {
    ignores: [
      'node_modules',
      'test',
      'eslint.config.js',
      'commitlint.config.js',
    ],
  },
];
