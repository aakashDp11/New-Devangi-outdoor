import daisyui from 'daisyui';
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
      {
        mytheme: {
          "primary": "#6b7280",        // Gray instead of blue
          "primary-content": "#ffffff",
          "secondary": "#f000b8",      
          "accent": "#1dcdbc",         
          "neutral": "#2b3440",        
          "base-100": "#ffffff",       
          "base-200": "#f2f2f2",       
          "base-300": "#e5e6e6",       
          "base-content": "#1f2937",   
        },
      },
    ],
  },
}