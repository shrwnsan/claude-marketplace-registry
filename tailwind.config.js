/** @type {import('tailwindcss').Config} */

// "Terminal catalog" identity:
// - ember: Claude-terracotta accent family (primary interactive color)
// - gray:  warm charcoal ramp — dark surfaces step 900 → 800 → 700 so cards
//          read as elevated panels, not faint tints
// - success/warning/cyan: syntax-highlight categorical accents
const ember = {
  50: '#faf5f2',
  100: '#f7e8e1',
  200: '#f0cdbc',
  300: '#e6ab93',
  400: '#d97757',
  500: '#c96442',
  600: '#ad5233',
  700: '#8a4229',
  800: '#6b3522',
  900: '#4f281a',
  950: '#2b150c',
};

const warmGray = {
  50: '#faf9f7',
  100: '#f3f1ec',
  150: '#e8e5de',
  200: '#e4e0d8',
  250: '#d3cec4',
  300: '#c2bcb0',
  400: '#a49c8f',
  500: '#7f776a',
  600: '#5f584d',
  650: '#494339',
  700: '#3b362e',
  750: '#2d2922',
  800: '#221e19',
  850: '#1a1613',
  900: '#161310',
  950: '#0e0c0a',
};

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ember,
        // `primary` aliases ember so the existing class surface re-skins
        primary: ember,
        secondary: warmGray,
        gray: warmGray,
        success: {
          50: '#f4faf5',
          100: '#e3f4e6',
          200: '#c4e8ca',
          300: '#95d6a0',
          400: '#57c064',
          500: '#2da44e',
          600: '#238636',
          700: '#196c2e',
          800: '#14562a',
          900: '#0e401f',
        },
        warning: {
          50: '#fdf9ee',
          100: '#f9efcf',
          200: '#f2dd9e',
          300: '#e8c564',
          400: '#dcaa3f',
          500: '#c69334',
          600: '#a3762a',
          700: '#7c5920',
          800: '#5e4419',
          900: '#423114',
        },
        error: {
          50: '#fdf3f2',
          100: '#fbe6e4',
          200: '#f6cbc7',
          300: '#efa49d',
          400: '#e8756c',
          500: '#d64f45',
          600: '#b94038',
          700: '#96342e',
          800: '#742925',
          900: '#521e1b',
        },
        cyan: {
          50: '#f0fafb',
          100: '#d8f2f4',
          200: '#ade5ea',
          300: '#74d3db',
          400: '#3ec0ca',
          500: '#2b9faa',
          600: '#23818c',
          700: '#1f6873',
          800: '#1c515c',
          900: '#173d47',
        },
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        display: ['"Bricolage Grotesque"', '"Instrument Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'cursor-blink': 'cursorBlink 1.1s steps(1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
          '70%': { transform: 'scale(0.9)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        cursorBlink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(28, 20, 12, 0.07), 0 10px 20px -2px rgba(28, 20, 12, 0.04)',
        'medium': '0 4px 25px -5px rgba(28, 20, 12, 0.12), 0 10px 10px -5px rgba(28, 20, 12, 0.05)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
