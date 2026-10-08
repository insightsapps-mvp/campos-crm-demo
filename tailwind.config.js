/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface-2)',
        line: 'var(--border)',
        fg: 'var(--text)',
        fg2: 'var(--text-2)',
        muted: 'var(--muted)',
        accent: { DEFAULT: '#3b82f6', strong: '#2563eb', soft: 'rgba(59,130,246,.12)' },
        ok: '#34d399',
        warn: '#f59e0b',
        bad: '#f87171',
        violet: '#a78bfa',
        cyan: '#22d3ee',
      },
      borderRadius: { card: '12px' },
      boxShadow: { glow: '0 0 24px rgba(59,130,246,.35)', card: 'var(--shadow)' },
      keyframes: {
        halo: { '0%': { scale: '1', opacity: '.55' }, '100%': { scale: '1.28', opacity: '0' } },
        blob: { '0%,100%': { translate: '0 0' }, '50%': { translate: '40px -30px' } },
      },
      animation: { halo: 'halo 1.9s ease-out infinite', blob: 'blob 18s ease-in-out infinite' },
    },
  },
  plugins: [],
}
