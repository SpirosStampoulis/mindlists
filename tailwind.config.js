/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        supermarket: '#4caf50',
        subscriptions: '#2196f3',
        passcodes: '#9c27b0',
        travel: '#ff9800',
        meetings: '#00bcd4',
        reminders: '#f44336',
        games: '#e91e63',
      },
    },
  },
  plugins: [],
}


