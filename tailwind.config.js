/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: v('base'),
        surface: v('surface'),
        ink: v('ink'),
        muted: v('muted'),
        rule: v('rule'),
        steel: v('steel'),
        gold: v('gold'),
        broken: v('broken'),
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      letterSpacing: { crush: '-0.06em' },
    },
  },
  plugins: [],
};
