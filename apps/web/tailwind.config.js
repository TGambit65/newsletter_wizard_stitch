/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          50:  'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-primary-500) / <alpha-value>)',
          foreground: '#FFFFFF',
        },
        neutral: {
          50:  '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          500: '#A3A3A3',
          700: '#404040',
          900: '#171717',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error:   '#EF4444',
        info:    '#3B82F6',
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Stitch semantic color tokens
        'background-dark':  '#131022',
        'background-light': '#f6f5f8',
        'surface-dark':     '#1e1b2e',
        'surface-lighter':  '#21213E',
        'primary-light':    '#5c3dff',
        'primary-glow':     '#7c3aed',
      },
      fontFamily: {
        sans:    ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Space Grotesk', '-apple-system', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '1rem',
        sm:  '0.5rem',
        md:  '0.75rem',
        lg:  '1.5rem',
        xl:  '2rem',
        '2xl': '3rem',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        md: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        lg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
        xl: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
        // Stitch glow shadows
        'glow':    '0 0 40px -10px rgba(51,13,242,0.5)',
        'glow-sm': '0 0 20px -5px rgba(51,13,242,0.4)',
        'glow-lg': '0 0 80px -20px rgba(51,13,242,0.3)',
        'card-dark': '0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -1px rgba(0,0,0,0.15)',
        'fab':     '0 10px 25px -5px rgba(51,13,242,0.5), 0 8px 10px -6px rgba(51,13,242,0.1)',
      },
      backgroundImage: {
        'glass-gradient':  'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
        'button-gradient': 'linear-gradient(135deg, #7c3aed 0%, #330df2 100%)',
        'hero-glow':       'radial-gradient(circle at center, rgba(51,13,242,0.25) 0%, rgba(19,16,34,0) 70%)',
        'gradient-bg':     'radial-gradient(circle at top right, #1e1b4b 0%, #0c0e16 40%)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: 0 },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: 1 },
          '50%':      { opacity: 0.5 },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%':   { boxShadow: '0 0 20px #330df2, 0 0 40px #330df2' },
          '100%': { boxShadow: '0 0 40px #330df2, 0 0 80px #6d28d9' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 15px 2px rgba(51,13,242,0.3)', transform: 'scale(1)' },
          '50%':      { boxShadow: '0 0 25px 8px rgba(51,13,242,0.6)', transform: 'scale(1.05)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'pulse-slow':     'pulse-slow 2s ease-in-out infinite',
        'float':          'float 6s ease-in-out infinite',
        'glow':           'glow 3s ease-in-out infinite alternate',
        'pulse-glow':     'pulse-glow 3s infinite ease-in-out',
        'spin-slow':      'spin-slow 8s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
