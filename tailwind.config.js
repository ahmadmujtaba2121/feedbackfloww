/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#080C14",
                foreground: "#0A1628",
                border: "#1B2B44",
                primary: "#2DD4BF",
                "primary-foreground": "#080C14",
                secondary: "#1B2B44",
                "secondary-foreground": "#FFFFFF",
                muted: "#0A1628",
                "muted-foreground": "#94A3B8",
                accent: "#2DD4BF",
                "accent-foreground": "#080C14",
            },
        },
    },
    plugins: [],
} 