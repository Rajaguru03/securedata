/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'term-base': '#0d1117',
        'term-surface': '#161b22',
        'term-border': '#30363d',
        'term-muted': '#6e7681',
        'term-subtle': '#8b949e',
        'term-default': '#c9d1d9',
        'term-bright': '#e6edf3',
        primary: {
          DEFAULT: '#3fb950',
          dim: '#238636',
          muted: '#0d2119',
        },
        accent: {
          DEFAULT: '#58a6ff',
          dim: '#1f6feb',
          muted: '#0d1f42',
        },
        warn: {
          DEFAULT: '#d29922',
          dim: '#9e6a03',
          muted: '#2a1e00',
        },
        danger: {
          DEFAULT: '#f85149',
          dim: '#b62324',
          muted: '#3b1114',
        },
        ai: {
          DEFAULT: '#bc8cff',
          dim: '#8957e5',
          muted: '#271052',
        },
      },
      fontFamily: {
        sans: ['"JetBrains Mono"', 'monospace'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
