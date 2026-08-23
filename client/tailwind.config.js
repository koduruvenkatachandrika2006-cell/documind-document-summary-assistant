import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const posixClientSrc = path.resolve(__dirname, 'src/**/*.{js,ts,jsx,tsx}').replace(/\\/g, '/');
const posixClientIndex = path.resolve(__dirname, 'index.html').replace(/\\/g, '/');

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    posixClientIndex,
    posixClientSrc,
    './src/**/*.{js,ts,jsx,tsx}',
    './src/**/*.tsx',
    './client/src/**/*.{js,ts,jsx,tsx}',
    '../client/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
