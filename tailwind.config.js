/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#e8f7ef",
          100: "#c9edda",
          200: "#a3dfc3",
          300: "#6cc9a3",
          400: "#3daf80",
          500: "#35ae74",
          600: "#2D9966",
          700: "#247a51",
          800: "#1a5b3c",
          900: "#103c28",
        },
      },
    },
  },
  plugins: [],
}

