/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: false, // This disables Tailwind's base styles to avoid conflicts with MUI
  },
  important: '#root', // This ensures Tailwind styles take precedence
}