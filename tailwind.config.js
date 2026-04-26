/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        clip: {
          red: "#ef4444",
          blue: "#3b82f6",
          green: "#22c55e",
          yellow: "#eab308",
          purple: "#a855f7",
          orange: "#f97316",
          gold: "#fbbf24",
        },
        area: {
          fitness: "#22c55e",
          career: "#3b82f6",
          music: "#a855f7",
        },
      },
      keyframes: {
        "clip-fly": {
          "0%": { transform: "translate(0, 0) scale(1)", opacity: "1" },
          "100%": { transform: "translate(var(--fly-x, 200px), var(--fly-y, 200px)) scale(0.4)", opacity: "0" },
        },
        "sparkle": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(1.15)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "clip-fly": "clip-fly 480ms ease-out forwards",
        "sparkle": "sparkle 1.6s ease-in-out infinite",
        "slide-up": "slide-up 220ms ease-out",
      },
    },
  },
  plugins: [],
};
