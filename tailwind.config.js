/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crt: {
          green: "#22c55e",
          "green-dim": "#15803d",
          "green-glow": "#4ade80",
          amber: "#f59e0b",
          "amber-dim": "#b45309",
          "amber-glow": "#fbbf24",
          red: "#ef4444",
          "red-glow": "#f87171",
          screen: "#031408",
          "screen-amber": "#1a0f02",
        },
        nixie: {
          orange: "#ff7700",
          glow: "#ffaa33",
          bg: "#1a0800",
        },
        aluminum: {
          light: "#71717a",
          DEFAULT: "#3f3f46",
          dark: "#27272a",
          darker: "#18181b",
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Share Tech Mono"', 'monospace'],
        display: ['"VT323"', 'monospace'],
        tech: ['"Share Tech Mono"', 'monospace'],
        sans: ['"Space Grotesk"', 'sans-serif'],
      },
      boxShadow: {
        'crt-green': '0 0 15px rgba(34, 197, 94, 0.45), inset 0 0 20px rgba(34, 197, 94, 0.2)',
        'crt-amber': '0 0 15px rgba(245, 158, 11, 0.45), inset 0 0 20px rgba(245, 158, 11, 0.2)',
        'crt-red': '0 0 18px rgba(239, 68, 68, 0.6), inset 0 0 20px rgba(239, 68, 68, 0.3)',
        'nixie': '0 0 10px #ff7700, 0 0 20px rgba(255, 119, 0, 0.5), inset 0 0 8px rgba(255, 119, 0, 0.3)',
        'metal-bevel': 'inset 1px 1px 0 rgba(255,255,255,0.1), inset -1px -1px 0 rgba(0,0,0,0.5)',
      },
      animation: {
        'flicker': 'flicker 0.15s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'alarm-flash': 'alarmFlash 0.8s ease-in-out infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.88' },
        },
        alarmFlash: {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.4', filter: 'brightness(1.5)' },
        }
      }
    },
  },
  plugins: [],
}
