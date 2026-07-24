/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        miis: {
          navy: '#0A192F',
          darkBlue: '#0F2537',
          deepSea: '#1B3B5F',
          cyan: '#00B4D8',
          seaGreen: '#2A9D8F',
          coral: '#E76F51',
          sand: '#F4F1DE',
          alert: '#E63946',
          warning: '#F4A261'
        }
      }
    },
  },
  plugins: [],
}
