/** @type {import('tailwindcss').Config} */
export const content = ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"];
export const theme = {
  screens: {
    sm: '480px',
    md: '768px',
    lg: '976px',
    xl: '1440px',
  },
  colors: {
    'blue': '#1fb6ff',
    'pink': '#ff49db',
    'orange': '#ff7849',
    'green': '#13ce66',
    'gray-dark': '#273444',
    'gray': '#8492a6',
    'gray-light': '#999090',
    'white': '#ffffff',
    'black': '#000000',
    'red': '#900603',
  },
  fontFamily: {
    sans: ['Graphik', 'sans-serif'],
    serif: ['Merriweather', 'serif'],
  },
  extend: {
    spacing: {
      '128': '32rem',
      '144': '36rem',
    },
    borderRadius: {
      '4xl': '2rem',
    }
  },
};
export const plugins = [];

