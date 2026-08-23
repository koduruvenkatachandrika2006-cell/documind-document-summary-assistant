import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const posixRootSrc = path.resolve(__dirname, 'client/src/**/*.{js,ts,jsx,tsx}').replace(/\\/g, '/');
const posixRootIndex = path.resolve(__dirname, 'client/index.html').replace(/\\/g, '/');

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    posixRootIndex,
    posixRootSrc,
    './client/index.html',
    './client/src/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}'
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
