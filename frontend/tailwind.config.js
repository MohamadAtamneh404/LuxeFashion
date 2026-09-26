/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink    : '#000000',
        muted  : '#6F6F6F',
        surface: '#F5F3F0',
        border : '#E5E5E5',
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        body   : ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-rise': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to  : { opacity: '1', transform: 'translateY(0)'    },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      animation: {
        'fade-rise'        : 'fade-rise 0.8s ease-out both',
        'fade-rise-delay'  : 'fade-rise 0.8s ease-out 0.2s both',
        'fade-rise-delay-2': 'fade-rise 0.8s ease-out 0.4s both',
        'marquee'          : 'marquee 25s linear infinite',
      },
    },
  },
  plugins: [],
}
