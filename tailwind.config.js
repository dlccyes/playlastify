/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['Consolas', 'Hack', 'monospace']
      },
      colors: {
        'spotify-green': '#1db955',
        'lastfm-red': '#ab0000'
      }
    },
  },
  plugins: [],
} 