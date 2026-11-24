/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        tbo: {
          orange: "#FF5E14",
          "orange-dark": "#E04803",
          navy: "#0A192F",
          slate: "#0F172A",
          card: "#1E293B",
          border: "#334155",
          accent: "#38BDF8",
        },
      },
    },
  },
  plugins: [],
};
