/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Device safe-area insets (notch, Dynamic Island, camera cut-out, home indicator), see --safe-* in index.css.
      // Gives pt-safe-top, pb-safe-bottom, pl-safe-left, pr-safe-right, and so on.
      spacing: {
        'safe-top': 'var(--safe-top)',
        'safe-right': 'var(--safe-right)',
        'safe-bottom': 'var(--safe-bottom)',
        'safe-left': 'var(--safe-left)',
      },
      // Dialog height caps: the usual 90% / 92% of the screen, minus the notch and home-indicator areas, so a tall
      // dialog never reaches under the Dynamic Island or camera cut-out (identical to 90vh / 92vh without them).
      maxHeight: {
        'safe-90vh': 'calc(90vh - var(--safe-top) - var(--safe-bottom))',
        'safe-92vh': 'calc(92vh - var(--safe-top) - var(--safe-bottom))',
      },
      colors: {
        accent: {
          50: 'var(--accent-50)',
          100: 'var(--accent-100)',
          200: 'var(--accent-200)',
          500: 'var(--accent-500)',
          600: 'var(--accent-600)',
          700: 'var(--accent-700)',
        },
        brand: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      }
    },
  },
  plugins: [],
}
