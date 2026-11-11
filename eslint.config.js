import globals from 'globals';
import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';

/** @type {import("eslint").FlatConfig[]} */
export default [
    {
        files: ['**/*.{js,ts,tsx}'],
        ...js.configs.recommended,
    },

    {
        files: ['**/*.{js,ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            '@next/next': nextPlugin,
            prettier: prettierPlugin,
        },
        rules: {
            '@next/next/no-html-link-for-pages': 'off',
            '@next/next/no-img-element': 'warn',

            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],

            'no-console':
                process.env.NODE_ENV === 'production' ? 'warn' : 'off',

            'prettier/prettier': 'error',
        },
    },

    {
        ignores: [
            '.next/**/*',
            'node_modules/**/*',
            'dist/**/*',
            'out/**/*',
        ],
    },
];
