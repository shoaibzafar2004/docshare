import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1f2328',
        paper: '#fafaf8',
      },
    },
  },
  plugins: [],
};

export default config;
