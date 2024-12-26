/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                primary: 'var(--primary)',
                secondary: 'var(--secondary)',
                accent: 'var(--accent)',
                muted: 'var(--muted)',
                border: 'var(--border)',
                'primary-foreground': 'var(--primary-foreground)',
                'secondary-foreground': 'var(--secondary-foreground)',
                'muted-foreground': 'var(--muted-foreground)',
            },
        },
    },
    plugins: [],
} 