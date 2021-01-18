module.exports = {
  env: {
    node: true,
    browser: true,
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
  },
  plugins: [
    '@typescript-eslint',
    'prettier',
    'import',
    'simple-import-sort',
    'vue',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/recommended',
    'prettier',
    'prettier/@typescript-eslint',
    'prettier/vue',
  ],
  rules: {
    ////////////////
    // Core Rules //
    ////////////////

    // Only include brackets for arrow functions when needed, e.g. replace
    // x => { return x + x; } with x => x + x.
    'arrow-body-style': ['error', 'as-needed'],
    // Enforce camelCase variable names; allow properties for request parameters.
    camelcase: ['error', { properties: 'never' }],
    // Enforce curly braces for if/else/for/etc blocks.
    curly: 'error',
    // Convert foo['bar'] to foo.bar.
    'dot-notation': 'error',
    // Catch probably incorrect uses of == and !=.
    eqeqeq: ['error', 'smart'],
    // Enforce classes being PascalCase, e.g. new Foo(...) not new foo(...).
    'new-cap': ['error', { capIsNew: false }],
    // Disallow new Array(...) in favor of arrray literals.
    'no-array-constructor': 'error',
    // Awaiting in a loop can usually be done in parallel with Promise.all().
    'no-await-in-loop': 'error',
    // Disallow some deprecated function properties.
    'no-caller': 'error',
    // Disallow console.log and debug to prevent debug statements from being merged.
    //'no-console': ['error', { allow: ['warn', 'error'] }],
    // Constructors shouldn't return things.
    'no-constructor-return': 'error',
    // Don't use eval!
    'no-eval': 'error',
    // Catches a case where else if can be used for clener code.
    'no-lonely-if': 'error',
    // Prevents e.g. x = y = 1; please use multiple statements instead for clarity.
    'no-multi-assign': 'error',
    // Disallow new Object() in favor of object literals.
    'no-new-object': 'error',
    // Catches an an error in Promise executor functions.
    'no-promise-executor-return': 'error',
    // Catches a probable error: return x = 1;
    'no-return-assign': 'error',
    // Only allow return await promise; inside try blocks.
    'no-return-await': 'error',
    // No comma-separated statements.
    'no-sequences': 'error',
    // Catches a probable error: 'a${b}' should probably be `a${b}`
    'no-template-curly-in-string': 'error',
    // Convert x ? x : y to x || y.
    'no-unneeded-ternary': 'error',
    // Catches loops that always hit a break; their first iteration.
    'no-unreachable-loop': 'error',
    // Catches an error in regexes.
    'no-useless-backreference': 'error',
    // Disallow unnecessary uses of .call() and .apply().
    'no-useless-call': 'error',
    // Convert const { foo: foo } = bar; to const { foo } = bar;.
    'no-useless-rename': 'error',
    // Disallow the use of var in favor of let or const.
    'no-var': 'error',
    // Convert { foo: foo } to { foo }.
    'object-shorthand': 'error',
    // Combine consecutive uninitialized variables but never combine
    // initialized variables:
    //   let a, b;
    //   let c = 1;
    //   let d = 2;
    'one-var': [
      'error',
      {
        initialized: 'never',
        uninitialized: 'consecutive',
      },
    ],
    // Convert x = x + 1 to x += 1.
    'operator-assignment': 'error',
    // Prefer arrow functions as function arguments if possible.
    'prefer-arrow-callback': 'error',
    // Use const over let if the variable is never reassigned.
    'prefer-const': 'error',
    // Prefer const { x } = y; to const x = y.x;.
    'prefer-destructuring': [
      'error',
      { array: false },
      { enforceForRenamedProperties: false },
    ],
    // Convert Math.pow(x, y) to x ** y.
    'prefer-exponentiation-operator': 'error',
    // Disallow Object.assign({}, x) in favor of { ...x }.
    'prefer-object-spread': 'error',
    // Disallow the arguments keyword.
    'prefer-rest-params': 'error',
    // Use fn(...ls) instead of fn.apply(null, ls).
    'prefer-spread': 'error',
    // Converts 'a' + b + 'c' to `a${b}c`.
    'prefer-template': 'error',
    // Converts e.g. if (1 === x) {...} to if (x === 1) {...}.
    yoda: 'error',

    ///////////////
    // Vue Rules //
    ///////////////

    // This uses PascalCase and registeredComponentsOnly by default. Ideally
    // it would be for all components but there are some edge cases with Vue
    // built-ins like <transition> so this is safest for now.
    'vue/component-name-in-template-casing': 'error',
    // Self close tags in templates where possible, e.g. <Foo /> and <span />
    'vue/html-self-closing': [
      'error',
      {
        // html.void must be set to 'any' for compatibility with Prettier.
        html: { void: 'any' },
      },
    ],
    // This is easy to mess up without a rule.
    'vue/match-component-file-name': [
      'error',
      {
        extensions: ['vue'],
        shouldMatchCase: true,
      },
    ],
    // Using v-html can lead to XSS vulnerabilities.
    'vue/no-v-html': 'error',
    // Enforce consistent order of blocks inside a component:
    // components, props, data, computed, watch, lifecycle hooks, methods.
    'vue/order-in-components': 'error',
    // All props should be required or have a default set.
    'vue/require-default-prop': 'error',
    // The name property makes debugging easier.
    'vue/require-name-property': 'error',

    // These are recommended rules that are warnings by default.
    'vue/attribute-hyphenation': ['error', 'never'],
    'vue/attributes-order': 'error',
    'vue/component-definition-name-casing': 'error',
    'vue/component-tags-order': 'error',
    'vue/no-lone-template': 'error',
    'vue/no-multiple-slot-args': 'error',
    'vue/no-template-shadow': 'error',
    'vue/one-component-per-file': 'error',
    'vue/prop-name-casing': 'error',
    'vue/require-prop-types': 'error',
    'vue/this-in-template': 'error',
    'vue/v-bind-style': 'error',
    'vue/v-on-style': 'error',
    'vue/v-slot-style': 'error',

    ////////////////////////
    // Other Plugin Rules //
    ////////////////////////

    'import/extensions': [
      'error',
      {
        js: 'never',
        vue: 'always',
        scss: 'always',
      },
    ],
    'import/no-extraneous-dependencies': [
      'error',
      {
        optionalDependencies: ['test/unit/index.js'],
      },
    ],

    'prettier/prettier': [
      'error',
      {
        arrowParens: 'avoid',
        tabWidth: 2,
        semi: true,
        singleQuote: true,
      },
    ],

    // Sort import lines by file path.
    'simple-import-sort/imports': 'error',

    '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
    '@typescript-eslint/class-literal-property-style': 'error',
    '@typescript-eslint/consistent-type-assertions': 'error',
    '@typescript-eslint/consistent-type-definitions': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-member-accessibility': [
      'error',
      { accessibility: 'no-public' },
    ],
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/method-signature-style': 'error',
    '@typescript-eslint/no-confusing-non-null-assertion': 'error',
    '@typescript-eslint/default-param-last': 'error',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-implicit-any-catch': 'error',
    '@typescript-eslint/no-invalid-void-type': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/no-parameter-properties': 'error',
    '@typescript-eslint/no-shadow': 'error',
    '@typescript-eslint/no-unnecessary-type-constraint': 'error',
    '@typescript-eslint/prefer-enum-initializers': 'error',
    '@typescript-eslint/prefer-for-of': 'error',
    '@typescript-eslint/prefer-function-type': 'error',
    '@typescript-eslint/prefer-literal-enum-member': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/prefer-ts-expect-error': 'error',
    '@typescript-eslint/unified-signatures': 'error',

    // Extension rules that enhance JS rules.
    'no-dupe-class-members': 'off',
    '@typescript-eslint/no-dupe-class-members': 'error',
    // It's easy to accidentally import from the same file multiple times.
    '@typescript-eslint/no-duplicate-imports': 'error',
    '@typescript-eslint/no-empty-function': 'off',
    // Prevent using number literals that are more precise than JS supports.
    '@typescript-eslint/no-loss-of-precision': 'error',
    'no-redeclare': 'off',
    '@typescript-eslint/no-redeclare': ['error'],
    'no-unused-expressions': 'off',
    '@typescript-eslint/no-unused-expressions': 'error',
    // Upgrade to error.
    '@typescript-eslint/no-unused-vars': 'error',
    // Disallow using variables before they're declared.
    '@typescript-eslint/no-use-before-define': [
      'error',
      { classes: false, functions: false },
    ],
    // Disallow constructors that don't do anything.
    '@typescript-eslint/no-useless-constructor': 'error',
  },
};
