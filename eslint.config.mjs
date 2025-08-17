import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'

export default defineConfig([globalIgnores(['test/swagger-ui/', '**/node_modules/']), {
    plugins: {},

    languageOptions: {
        globals: {
            ...globals.node,
            ...globals.mocha,
        },
    },

    rules: {
        'no-restricted-syntax': 0,
        'guard-for-in': 0,
        'dot-notation': 0,
        camelcase: 0,
        'no-underscore-dangle': 0,
        'no-extra-parens': 0,
        'no-param-reassign': 0,
        radix: 0,
        'class-methods-use-this': 0,
        'new-cap': 0,
        'global-require': 0,
        'max-len': 0,
        'no-new': 0,
        'no-continue': 0,
        'no-return-await': 0,
        'arrow-body-style': 0,
        quotes: [2, 'single'],
        'linebreak-style': [2, 'unix'],

        'no-unused-vars': [2, {
            vars: 'all',
            args: 'after-used',
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
        }],

        semi: ['error', 'never'],
        'no-console': 0,
    },
}])
