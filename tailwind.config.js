/**@type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx}",
        "./index.html"
    ],
    theme: {
        extend: {
            colors: {
                tanjiro: {
                    light: "#a8e6c596",
                    DEFAULT: "#56c596",
                    dark: "#379683"
                },
                nezuko: "#ffb6b9",
                zenitsu: "#fff176",
                inosuke: "#0860b8ff"
            }
        },
        fontFamily: {
            sans: ["'Poppins'", "sans-serif"]
        },
        borderRadius: {
            xl: "1rem",
            "2xl": "1.5rem"
        },
        animation: {
            fade: "fadeIn 0.5s ease-in-out",
            slide: "slideIn 0.4s ease-out"
        },
        keyframes: {
            fadeIn: {
                "0%": { opacity: 0 },
                "100%": { opacity: 1 }
            },
            slideIn: {
                "0%": { transform: "translateY(20px)", opacity: 0},
                "100%": { transform: "translateY(0)", opacity: 1 }
            }
        }
    }
}
