/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#070912",
        secondary: "#0B0F1A",
        panel: "#0F1420",
        elevated: "#131927",
        border: "#20283A",
        primaryText: "#E8ECF5",
        secondaryText: "#8B94A8",
        mutedText: "#5D6678",
        accentPrimary: "#89A8E0", // soft silver-blue
        accentSecondary: "#A894C2", // muted violet
        success: "#84B98E",
        warning: "#E0AF79",
        error: "#C27474"
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
