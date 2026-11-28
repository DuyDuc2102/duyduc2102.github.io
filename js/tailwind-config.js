// Cấu hình dùng để biên dịch sẵn css/tailwind.min.css:
// npx tailwindcss@3.4.17 -c js/tailwind-config.js -i css/styles.css -o css/tailwind.min.css --minify
const tailwindConfig = {
  content: ['./index.html', './js/**/*.js'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#525252',
          600: '#171717',
          700: '#0a0a0a',
          800: '#262626',
          900: '#171717',
        }
      }
    }
  }
};
if (typeof module !== 'undefined') module.exports = tailwindConfig;
