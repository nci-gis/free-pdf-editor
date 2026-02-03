const autoprefixer = require('autoprefixer');
const purgecss = require('@fullhuman/postcss-purgecss').default;

const production = !process.env.ROLLUP_WATCH;

module.exports = {
  plugins: [
    require('tailwindcss'),
    autoprefixer,
    ...(production ? [purgecss({
      content: ['./src/**/*.svelte'],
      safelist: {
        standard: [/svelte-/],
      },
      defaultExtractor: (content) => {
        const standard = content.match(/[\w-/:]+/g) || [];
        const svelteClass = content.match(/(?<=class:)[\w-/:]+/g) || [];
        return standard.concat(svelteClass);
      },
    })] : []),
  ],
};
