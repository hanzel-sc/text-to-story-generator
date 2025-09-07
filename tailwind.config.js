/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { /* your existing colors */ },
        secondary: { /* your existing colors */ },
        accent: { /* your existing colors */ },

        // 👇 Add these shadcn-style tokens
        border: "#e5e7eb",         // gray-200
        input: "#d1d5db",          // gray-300
        ring: "#93c5fd",           // blue-300
        background: "#ffffff",     // white
        foreground: "#111827",     // gray-900
        muted: {
          DEFAULT: "#f3f4f6",      // gray-100
          foreground: "#6b7280",   // gray-500
        },
      },
      fontFamily: {
        'display': ['Inter', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: { /* your animations */ },
      keyframes: { /* your keyframes */ },
      backgroundImage: { /* your gradients */ },
    },
  },
  plugins: [],
}
