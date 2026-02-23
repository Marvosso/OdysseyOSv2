/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: '#fdfcfa',
          100: '#faf8f5',
          200: '#f5f2ec',
          300: '#ebe6de',
          400: '#d9d2c7',
        },
      },
      fontFamily: {
        editor: ['var(--font-editor)', 'Georgia', 'serif'],
        sans: ['var(--font-ui)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      lineHeight: {
        editor: 'var(--leading-editor)',
        relaxed: '1.625',
        literary: '1.75',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-md': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
      },
      animation: {
        'glow-pulse': 'odyssey-glow-pulse 1.5s ease-in-out 2',
      },
      keyframes: {
        'odyssey-glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(var(--accent-glow), 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(var(--accent-glow), 0.6)' },
        },
      },
    },
  },
  plugins: [],
};
