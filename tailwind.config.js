import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'src/**/*.{js,ts,jsx,tsx}'),
  ],
  theme: {
    extend: {
      colors: {
        ui: {
          primary: 'var(--ui-primary)',
          secondary: 'var(--ui-secondary)',
          muted: 'var(--ui-muted)',
          accent: 'var(--ui-accent)',
          selected: 'var(--ui-accent-soft)',
          inset: 'var(--ui-inset)',
          hover: 'var(--ui-hover)',
          line: 'var(--ui-line)',
          warning: 'var(--ui-warning)',
          success: 'var(--ui-success)',
          purple: 'var(--ui-purple)',
        },
        space: {
          950: '#030712',
          900: '#0b0f19',
          850: '#111827',
          800: '#1f2937',
          700: '#374151',
          accent: '#38bdf8',
          gold: '#fbbf24',
          mars: '#f87171',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px rgba(56, 189, 248, 0.4)',
        'glow-gold': '0 0 30px rgba(251, 191, 36, 0.5)',
      },
    },
  },
  plugins: [],
};
