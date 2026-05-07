/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          blue: '#007AFF',
          'blue-hover': '#0056CC',
          'blue-light': '#E8F2FF',
          green: '#34C759',
          orange: '#FF9500',
          red: '#FF3B30',
          purple: '#AF52DE',
          gray: {
            50: '#FAFAFA',
            100: '#F5F5F7',
            200: '#E5E5EA',
            300: '#D1D1D6',
            400: '#C7C7CC',
            500: '#8E8E93',
            600: '#636366',
            700: '#48484A',
            800: '#3A3A3C',
            900: '#1D1D1F',
          },
        },
      },
      borderRadius: {
        'apple': '16px',
        'apple-lg': '20px',
      },
      boxShadow: {
        'apple': '0 1px 3px rgba(0, 0, 0, 0.04)',
        'apple-md': '0 4px 12px rgba(0, 0, 0, 0.06)',
        'apple-lg': '0 8px 24px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}
