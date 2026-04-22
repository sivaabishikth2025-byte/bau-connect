/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1C2D5A",      // BAU Navy Blue
        secondary: "#DBA631",    // BAU Gold
        accent: "#F15B47",       // BAU Coral/Red
        lime: "#CBDB2A",         // BAU Lime
        sky: "#28AAE2",          // BAU Sky Blue
        mist: "#BBD3EE",         // BAU Light Blue
        dark: "#0F1A35",
        light: "#F4F7FF"
      },
      fontFamily: {
        sans: ["Futura PT", "Futura", "Century Gothic", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
