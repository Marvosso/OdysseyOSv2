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
      fontFamily: {
        editor: ['var(--font-editor)', 'Georgia', 'serif'],
        sans: ['var(--font-ui)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      lineHeight: {
        editor: 'var(--leading-editor)',
        relaxed: '1.625',
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
