import StylisticPlugin from '@stylistic/eslint-plugin';
import unusedImports from 'eslint-plugin-unused-imports';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import ImportPlugin from 'eslint-plugin-import';

export default defineConfig({
    files: ['**/*.{js,ts}'],
    extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            StylisticPlugin.configs['recommended-flat', 'disable-legacy'],
            {
                plugins: {
                    stylistic: StylisticPlugin,
                    import: ImportPlugin,
                },
                files: ['**/*.js', '**/*.mjs', '**/*.cjs', '**/*.ts', '**/*.mts', '**/*.cts', '**/*.d.ts', '**/*.vue'],
                rules: {
                    'stylistic/semi': [
                        'warn',
                        'always',
                    ],
                    curly: [
                        'error',
                        'multi-line',
                    ],
                    'stylistic/template-curly-spacing': [
                        'warn',
                        'always',
                    ],
                    'stylistic/object-curly-spacing': [
                        'warn',
                        'always',
                    ],
                    'no-console': 'off',
                    'no-void': ['error', { allowAsStatement: true }],
                    'no-debugger': 'off',
                    'stylistic/quotes': [
                        'error',
                        'single',
                        {
                            allowTemplateLiterals: 'always',
                            avoidEscape: true,
                        },
                    ],
                    'stylistic/brace-style': [
                        'error',
                        'stroustrup',
                    ],
                    'stylistic/no-multi-spaces': [
                        'error',
                    ],
                    'no-new': 'off',
                    'stylistic/comma-dangle': [
                        'error',
                        'always-multiline',
                    ],
                    'stylistic/max-len': 'off',
                    'stylistic/indent': [
                        'error',
                        4,
                        {
                            SwitchCase: 1,
                        },
                    ],
                    'stylistic/indent-binary-ops': ['error', 4],
                    'import/named': 'off',
                    'import/no-mutable-exports': 'off',
                    'prefer-const': ['error', { destructuring: 'all' }],
                    camelcase: ['off'],
                    'stylistic/function-call-spacing': 'error',
                    'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
                    'import/exports-last': 'off',
                    'import/first': 'error',
                    'import/newline-after-import': 'error',
                    'import/order': 'off',
                    'stylistic/array-bracket-newline': ['error', 'consistent'],
                    'stylistic/array-bracket-spacing': 'error',
                    'stylistic/array-element-newline': ['error', 'consistent'],
                    'stylistic/arrow-parens': ['error', 'as-needed'],
                    'stylistic/arrow-spacing': 'error',
                    'stylistic/block-spacing': 'error',
                    'stylistic/comma-spacing': 'error',
                    'stylistic/comma-style': 'error',
                    'stylistic/computed-property-spacing': 'error',
                    'stylistic/dot-location': ['error', 'property'],
                    'stylistic/eol-last': 'error',
                    'stylistic/function-call-argument-newline': ['error', 'consistent'],
                    'stylistic/function-paren-newline': ['error', 'consistent'],
                    'stylistic/implicit-arrow-linebreak': 'error',
                    'stylistic/key-spacing': 'error',
                    'stylistic/keyword-spacing': 'error',
                    'stylistic/linebreak-style': 'error',
                    'stylistic/lines-between-class-members': 'error',
                    'stylistic/multiline-ternary': ['error', 'always-multiline'],
                    'stylistic/no-extra-semi': 'error',
                    'stylistic/no-mixed-operators': 'error',
                    'stylistic/no-mixed-spaces-and-tabs': 'error',
                    'stylistic/no-multiple-empty-lines': 'error',
                    'stylistic/no-trailing-spaces': 'error',
                    'stylistic/no-whitespace-before-property': 'error',
                    'stylistic/object-curly-newline': [
                        'error', {
                            multiline: true,
                            consistent: true,
                        },
                    ],
                    'stylistic/object-property-newline': [
                        'error', {
                            allowAllPropertiesOnSameLine: true,
                        },
                    ],
                    'stylistic/one-var-declaration-per-line': 'error',
                    'stylistic/operator-linebreak': ['error', 'after', {
                        overrides: { '|': 'before', '?': 'before', ':': 'before' },
                    }],
                    'stylistic/padded-blocks': ['error', 'never'],
                    'stylistic/quote-props': ['error', 'as-needed'],
                    'stylistic/rest-spread-spacing': 'error',
                    'stylistic/semi-spacing': 'error',
                    'stylistic/semi-style': 'error',
                    'stylistic/space-before-blocks': 'error',
                    'stylistic/space-before-function-paren': ['error', {
                        anonymous: 'never',
                        named: 'never',
                        asyncArrow: 'always',
                    }],
                    'stylistic/space-in-parens': 'error',
                    'stylistic/space-infix-ops': 'error',
                    'stylistic/space-unary-ops': 'error',
                    'stylistic/spaced-comment': 'error',
                    'stylistic/switch-colon-spacing': 'error',
                    'stylistic/type-annotation-spacing': 'error',
                    'stylistic/type-generic-spacing': 'error',
                    'stylistic/type-named-tuple-spacing': 'error',
                    'stylistic/wrap-iife': 'error',
                    'stylistic/member-delimiter-style': 'error',
                    'stylistic/curly-newline': 'error',
                    '@typescript-eslint/no-require-import': 'off',
                },
            },
            {
                plugins: {
                    stylistic: StylisticPlugin,
                    'unused-imports': unusedImports,
                },
                files: ['**/*.ts', '**/*.mts', '**/*.cts', '**/*.d.ts', '**/*.vue'],
                rules: {
                    'no-unused-vars': 'off',
                    '@typescript-eslint/no-unused-vars': 'off',
                    'unused-imports/no-unused-imports': 'error',
                    'unused-imports/no-unused-vars': [
                        'error',
                        {
                            args: 'none',
                            caughtErrorsIgnorePattern: '^ignore',
                            vars: 'local',
                        },
                    ],
                    '@typescript-eslint/unified-signatures': 'off',
                    '@typescript-eslint/no-var-requires': 'error',
                    '@typescript-eslint/no-explicit-any': 'off',
                    'no-useless-constructor': 'off',
                    'no-use-before-define': 'off',
                    '@typescript-eslint/no-use-before-define': 'off',
                    '@typescript-eslint/no-useless-constructor': [
                        'error',
                    ],
                    '@typescript-eslint/naming-convention': [
                        'error',
                        {
                            selector: 'variableLike',
                            format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
                            leadingUnderscore: 'allow',
                            trailingUnderscore: 'allow',
                        },
                        {
                            selector: 'variable',
                            modifiers: ['destructured'],
                            format: null,
                        },
                        {
                            selector: 'parameter',
                            modifiers: ['destructured'],
                            format: null,
                        },
                        { selector: 'class', format: ['PascalCase'] },
                        { selector: 'variable', modifiers: ['destructured'], format: null },
                        { selector: 'typeParameter', format: null },
                        { selector: 'enumMember', format: null },
                        { selector: 'interface', format: null },
                        { selector: 'property', format: null },
                    ],
                    'no-redeclare': 'off',
                    '@typescript-eslint/no-redeclare': ['error'],
                    'no-dupe-class-members': 'off',
                    '@typescript-eslint/no-dupe-class-members': ['error'],
                    'no-cond-assign': 'off',
                    '@typescript-eslint/no-import-type-side-effects': 'error',
                    '@typescript-eslint/consistent-type-imports': 'error',
                    '@typescript-eslint/no-empty-object-type': 'off',
                    '@typescript-eslint/no-dynamic-delete': 'off',
                    '@typescript-eslint/no-namespace': 'off',
                    '@typescript-eslint/ban-ts-comment': [
                        'error', {
                            'ts-nocheck': false,
                        },
                    ],
                    '@typescript-eslint/no-invalid-void-type': 'off',
                    '@typescript-eslint/no-unused-expressions': ['error', {
                        allowTernary: true,
                    }],
                },
            },
            {
                files: [
                    '**/sonar-project.properties.js',
                ],
                rules: {
                    '@typescript-eslint/no-var-requires': 'off',
                },
            },
            {
                files: [
                    '**/*.vue',
                ],
                rules: {
                    'stylistic/indent-binary-ops': 'off',
                },
            },
    ]
});
