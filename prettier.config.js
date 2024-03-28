/** @type {import("prettier").Config} */
export default {
  semi: false,
  printWidth: 180,
  singleQuote: true,
  plugins: ['prettier-plugin-astro'],
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
  ],
}
