const autoprefixer = require('autoprefixer');

// Tailwind v4 handles purging automatically via its built-in engine
// No need for separate purgecss plugin
module.exports = {
  plugins: [
    require('@tailwindcss/postcss'),
    autoprefixer,
  ],
};
