/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12181C',
        surface: '#F5F4EF',
        card: '#FFFFFF',
        route: {
          DEFAULT: '#1FAE86',
          light: '#E4F5EF',
          dark: '#0E7A5C',
        },
        signal: {
          DEFAULT: '#F5A623',
          light: '#FDF0DA',
        },
        coral: '#E85D50',
        muted: '#5B6672',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        soft: '0 8px 30px -12px rgba(18,24,28,0.15)',
        card: '0 2px 12px rgba(18,24,28,0.06)',
      },
      backgroundImage: {
        'route-dash': 'repeating-linear-gradient(90deg, #1FAE86 0 8px, transparent 8px 16px)',
      },
      keyframes: {
        dash: { to: { strokeDashoffset: -32 } },
        pulseRing: {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
      animation: {
        dash: 'dash 1.2s linear infinite',
        pulseRing: 'pulseRing 1.8s ease-out infinite',
      },
    },
  },
  plugins: [],
};
