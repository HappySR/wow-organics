/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdfff0',
          100: '#f9ffe0',
          200: '#f0ffc2',
          300: '#e3ff94',
          400: '#d4fe6f',
          500: '#b5fd59',
          600: '#9de03d',
          700: '#7bb82f',
          800: '#629328',
          900: '#4d7522'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
};
