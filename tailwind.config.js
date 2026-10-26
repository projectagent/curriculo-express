/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          500: '#334E68',
          700: '#1E3A8A', // Deep Blue of authority/trust
          800: '#102A43',
          900: '#0F172A', // Primary Navy slate
          950: '#0A0F1D',
        },
        whatsapp: {
          DEFAULT: '#25D366', // Primary conversion green
          hover: '#20BA5C',
          dark: '#128C7E',
          surface: '#E8FBF0',
        },
        status: {
          novo: {
            bg: '#E0F2FE',
            text: '#0369A1',
            border: '#BAE6FD',
          },
          pagamento: {
            bg: '#FEF3C7',
            text: '#B45309',
            border: '#FDE68A',
          },
          revisando: {
            bg: '#EDE9FE',
            text: '#6D28D9',
            border: '#DDD6FE',
          },
          entregue: {
            bg: '#D1FAE5',
            text: '#047857',
            border: '#A7F3D0',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        highlight: '0 10px 25px -5px rgba(37, 211, 102, 0.3)',
      },
    },
  },
  plugins: [],
};
