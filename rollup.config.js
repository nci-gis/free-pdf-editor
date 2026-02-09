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
import url from '@rollup/plugin-url';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

    // Import fonts as base64 data URLs (embeds in bundle, avoids CORS/fetch issues)
    url({
      include: ['**/*.ttf', '**/*.TTF'],
      limit: Infinity, // Always inline (no size limit)
      emitFiles: false, // Don't emit separate files, inline in bundle
    }),

    resolve({
      browser: true,
      dedupe: ['svelte'],
      exportConditions: ['svelte'],
    }),
    commonjs(),

    // Copy static assets from src/ to public/assets/
    // Note: Fonts are embedded in bundle, no need to copy
    copy({
      targets: [{ src: 'src/vendor/*', dest: 'public/assets/vendor' }],
      hook: 'writeBundle',
      copyOnce: true, // Only copy once in watch mode to prevent rebuild loops
    }),

    !production && serve(),
    !production && livereload('public/build'),
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

        import('node:child_process').then(({ spawn }) => {
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
