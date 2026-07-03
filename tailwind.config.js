/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Violet "chaîne" — couleur principale de la marque
        chain: {
          50: '#f2f1fe',
          100: '#e5e3fd',
          200: '#c9c5fb',
          300: '#a29afa',
          400: '#7a6cf5',
          500: '#5b47ec',
          600: '#4832d6',
          700: '#3a27ad',
          800: '#302189',
          900: '#281d6d',
        },
        // Ambre "étincelle" — accent créatif
        spark: {
          50: '#fffaeb',
          100: '#fff0c2',
          200: '#ffe089',
          300: '#ffc94d',
          400: '#ffb020',
          500: '#f79608',
          600: '#d97706',
          700: '#b45a09',
          800: '#92460f',
          900: '#78390f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 10px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
        cardHover: '0 10px 28px rgba(15,23,42,0.12)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: {
        fadeIn: 'fadeIn 0.35s ease-out both',
      },
    },
  },
  plugins: [],
}
