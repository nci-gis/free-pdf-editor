import svelte from 'rollup-plugin-svelte';
import open from 'open';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import livereload from 'rollup-plugin-livereload';
import terser from '@rollup/plugin-terser';
import { sveltePreprocess } from 'svelte-preprocess';
import css from 'rollup-plugin-css-only';
import copy from 'rollup-plugin-copy';
import { string } from 'rollup-plugin-string';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const require = createRequire(import.meta.url);
const production = !process.env.ROLLUP_WATCH;

// Load PostCSS config
const postcssConfig = require('./postcss.config.cjs');

export default {
  input: 'src/main.js',
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: 'public/build/bundle.js',
  },
  plugins: [
    alias({
      entries: [
        { find: '@src', replacement: path.resolve(__dirname, 'src') },
      ],
    }),
    svelte({
      preprocess: sveltePreprocess({ postcss: postcssConfig }),
      compilerOptions: {
        // enable run-time checks when not in production
        dev: !production,
      },
      emitCss: true,
    }),

    // Extract CSS into a separate file for better performance
    css({ output: 'bundle.css' }),

    // Import pdf.js worker as raw string for inline blob
    string({
      include: '**/pdf.worker*.mjs',
    }),

    resolve({
      browser: true,
      dedupe: ['svelte'],
      exportConditions: ['svelte'],
    }),
    commonjs(),

    // Copy static assets from src/ to public/assets/
    copy({
      targets: [
        { src: 'src/vendor/*', dest: 'public/assets/vendor' },
        { src: 'src/assets/fonts/*', dest: 'public/assets/fonts' },
      ],
      hook: 'writeBundle',
    }),

    !production && serve(),
    !production && livereload('public'),
    production && terser(),
  ],
  watch: {
    clearScreen: false,
  },
};

function serve() {
  let started = false;

  return {
    writeBundle() {
      if (!started) {
        started = true;

        import('child_process').then(({ spawn }) => {
          spawn('pnpm', ['start', '--', '--dev'], {
            stdio: ['ignore', 'inherit', 'inherit'],
            shell: true,
          });
        });
        open('http://localhost:8080');
      }
    },
  };
}
