/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx}',
        './src/components/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                beige: '#E9E1DA',
                blueGrey: '#556976',
                gold: '#EFAD5F',
            },
            fontFamily: {
                'work-sans': ['Work Sans', 'sans-serif'],
                'roboto-light-300': ['Roboto', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
