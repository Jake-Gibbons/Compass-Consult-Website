/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html',
    './pages/**/*.html',
    './js/**/*.js',
  ],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'sans-serif'] },
      colors: {
        compass: {
          purple: '#483086',
          lightPurple: '#6a4eb8',
          teal: '#2da8b4',
          lightTeal: '#4fd3e0',
          dark: '#1e1b2e',
          light: '#f8f9fc',
        },
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #483086 0%, #2da8b4 100%)',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        blob: 'blob 7s infinite',
        'infinite-scroll': 'infinite-scroll 40s linear infinite',
        ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
        bounce: 'bounce 1s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        'infinite-scroll': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  safelist: [
    // animation-delay utilities used via inline style or class names
    'animation-delay-2000',
    'animation-delay-4000',
  ],
};
