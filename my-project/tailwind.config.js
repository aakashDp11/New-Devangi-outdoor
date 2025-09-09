import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      "light",        // default
      "dark",         // dark
      "cupcake",      // optional extras
      "corporate",
      "forest",
      "dracula",
      "autumn",
      "lofi",
      "pastel",
      "fantasy"
    ],
  },
};
