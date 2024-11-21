// @ts-check

import eslint from '@eslint/js'
// @ts-ignore
import eslintImport from 'eslint-plugin-import'
import tseslint from 'typescript-eslint'
import stylisticJs from '@stylistic/eslint-plugin-js'
import stylisticTs from '@stylistic/eslint-plugin-ts'
import stylisticPlus from '@stylistic/eslint-plugin-plus'

/**
 * @template T
 * @param {T} config
 * @returns {[ 'error', T ]}
 */
const error = (config) => [ 'error', config ]

export default tseslint.config({
    files: [ 'src/**/*.ts' ],
    ignores: [ 'src/vite-env.d.ts' ],
    plugins: {
        '@stylistic/js': stylisticJs,
        '@stylistic/ts': stylisticTs,
        '@stylistic/plus': stylisticPlus,
        '@eslint-import': eslintImport,
    },
    extends: [
        eslint.configs.recommended,
        ...tseslint.configs.recommended,
    ],
    rules: {
        // Basic style
        '@stylistic/js/max-len': error(120),
        '@stylistic/js/semi': error('never'),
        '@stylistic/js/quotes': error('single'),
        '@stylistic/ts/indent': error(4),

        // Style
        '@stylistic/js/array-bracket-spacing': error('always'),
        '@stylistic/js/arrow-parens': error('as-needed'),
        '@stylistic/js/arrow-spacing': error({ before: true, after: true }),
        '@stylistic/js/block-spacing': error('always'),
        '@stylistic/js/brace-style': error('stroustrup'),
        '@stylistic/js/comma-dangle': error({
            arrays: 'always-multiline',
            objects: 'always-multiline',
            functions: 'only-multiline',
        }),
        '@stylistic/js/comma-spacing': error({ before: false, after: true }),
        '@stylistic/js/comma-style': error('last'),
        '@stylistic/js/computed-property-spacing': error('never'),
        '@stylistic/js/dot-location': error('property'),
        '@stylistic/js/eol-last': error('always'),
        '@stylistic/js/func-call-spacing': error('never'),
        '@stylistic/js/generator-star-spacing': error({ before: true, after: true }),
        '@stylistic/js/key-spacing': error({ beforeColon: false, afterColon: true }),
        '@stylistic/js/keyword-spacing': error({ before: true, after: true }),
        '@stylistic/js/linebreak-style': error('unix'),
        '@stylistic/js/multiline-comment-style': error('separate-lines'),
        '@stylistic/js/newline-per-chained-call': error({ ignoreChainWithDepth: 2 }),
        '@stylistic/js/no-multi-spaces': error({ ignoreEOLComments: true }),
        '@stylistic/js/no-multiple-empty-lines': error({ max: 1 }),
        '@stylistic/js/no-tabs': 'error',
        '@stylistic/js/no-trailing-spaces': 'error',
        '@stylistic/js/no-whitespace-before-property': 'error',
        '@stylistic/js/object-curly-spacing': error('always'),
        '@stylistic/js/quote-props': error('consistent-as-needed'),
        '@stylistic/js/rest-spread-spacing': error('never'),
        '@stylistic/js/space-before-blocks': error('always'),
        '@stylistic/js/space-in-parens': error('never'),
        '@stylistic/js/space-infix-ops': error({}),
        '@stylistic/js/space-unary-ops': error({ words: true, nonwords: true }),
        '@stylistic/js/spaced-comment': error('always'),
        '@stylistic/js/switch-colon-spacing': error({ after: true, before: false }),
        '@stylistic/js/template-curly-spacing': error('always'),
        '@stylistic/js/template-tag-spacing': error('never'),

        // TypeScript Style
        '@stylistic/ts/member-delimiter-style': error({
            multiline: { delimiter: 'none' },
            singleline: { delimiter: 'comma' }
        }),
        '@stylistic/ts/space-before-function-paren': error({
            named: 'never',
            anonymous: 'never',
            asyncArrow: 'always'
        }),
        '@stylistic/ts/type-annotation-spacing': 'error',
        '@stylistic/plus/type-generic-spacing': 'error',

        // Import
        '@eslint-import/extensions': error('never'),

        // JavaScript
        'eqeqeq': 'error',
        'no-empty': 'off',
        'prefer-const': error({
            destructuring: 'all'
        }),

        // TypeScript
        '@typescript-eslint/no-unused-expressions': error({}),
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-empty-object-type': 'off',
        '@typescript-eslint/no-unsafe-declaration-merging': 'off',
        '@typescript-eslint/array-type': error({ default: 'array' }),
        '@typescript-eslint/no-unsafe-function-type': 'off',
    }
})
