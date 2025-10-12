module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Vazirmatn", "ui-sans-serif", "system-ui"] },
      colors: { brand: { DEFAULT: "#4f46e5", dark: "#4338ca" } },
    },
  },
  plugins: [],
}
