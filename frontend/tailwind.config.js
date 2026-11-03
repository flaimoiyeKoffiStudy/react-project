/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F1F3F6',   // fond de l'application
        ink: '#16232B',     // texte principal
        muted: '#5B6B75',   // texte secondaire (contraste AA sur blanc et paper)
        line: '#D9E0E5',    // bordures
        cobalt: { DEFAULT: '#1F4FD8', dark: '#173DA6', soft: '#E6ECFC' }, // action + "non lu"
        gold: '#B7790A',    // favoris
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['"Public Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
