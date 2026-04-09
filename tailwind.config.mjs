/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        netflix: {
          red: '#e50914',
          black: '#141414',
          dark: '#181818',
          gray: '#808080',
        },
      },
      backgroundImage: {
        'banner-gradient': 'linear-gradient(to top, rgba(20,20,20,1) 0%, rgba(20,20,20,0) 100%)',
      },
    },
  },
  plugins: [],
}
