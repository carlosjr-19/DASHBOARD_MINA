/** @type {import('tailwindcss').Config} */
import defaultColors from 'tailwindcss/colors'
import plugin from 'tailwindcss/plugin'

// ==========================================================================
// SISTEMA DE TEMAS (oscuro / claro)
// Las paletas de grises y acentos se exponen como variables CSS.
//  - Tema oscuro (por defecto): valores originales de Tailwind.
//  - Tema claro (<html class="light">): grises invertidos y acentos ajustados
//    para mantener el contraste sobre fondo claro.
// Los fondos personalizados (bg-th-XXXXXX) también cambian según el tema.
// La clase "theme-fixed" fuerza los colores originales (vista de impresión).
// ==========================================================================
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const ACCENTS = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']

const GRAY_LIGHT = { 50: 950, 100: 900, 200: 800, 300: 700, 400: 600, 500: 500, 600: 400, 700: 300, 800: 200, 900: 100, 950: 50 }
const ACCENT_LIGHT = { 50: 900, 100: 800, 200: 800, 300: 700, 400: 600, 500: 500, 600: 600, 700: 700, 800: 200, 900: 100, 950: 50 }

// Fondos personalizados: [oscuro, claro]
const SURFACES = {
  '101112': ['#101112', '#eceef1'], '111213': ['#111213', '#eceef1'],
  '121314': ['#121314', '#f1f3f5'], '121315': ['#121315', '#f1f3f5'], '131416': ['#131416', '#f1f3f5'],
  '141517': ['#141517', '#f8f9fa'], '141518': ['#141518', '#f8f9fa'], '151617': ['#151617', '#f8f9fa'],
  '151618': ['#151618', '#f8f9fa'], '161719': ['#161719', '#f8f9fa'], '17181a': ['#17181a', '#f8f9fa'],
  '17181b': ['#17181b', '#f8f9fa'],
  '18191b': ['#18191b', '#ffffff'], '18191c': ['#18191c', '#ffffff'], '191b1e': ['#191b1e', '#ffffff'],
  '1a1b1e': ['#1a1b1e', '#ffffff'], '1a1b1f': ['#1a1b1f', '#ffffff'], '1b1c1e': ['#1b1c1e', '#ffffff'],
  '1b1c20': ['#1b1c20', '#ffffff'], '1c1d1f': ['#1c1d1f', '#ffffff'], '1c1d20': ['#1c1d20', '#ffffff'],
  '1c1d21': ['#1c1d21', '#ffffff'],
  '1e2022': ['#1e2022', '#eef0f2'], '1f2022': ['#1f2022', '#e9ecef'], '1f2024': ['#1f2024', '#e9ecef'],
  '17253a': ['#17253a', '#dbeafe'], '122238': ['#122238', '#e0ecff'], '0d1624': ['#0d1624', '#eff6ff'],
  '181613': ['#181613', '#fff7ed'],
}

const rgb = (hex) => {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' ')
}
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`

const themedScale = (name) => Object.fromEntries(SHADES.map((s) => [s, v(`c-${name}-${s}`)]))

const varsFor = (mode) => {
  const out = {}
  for (const s of SHADES) out[`--c-gray-${s}`] = rgb(defaultColors.gray[mode === 'light' ? GRAY_LIGHT[s] : s])
  for (const a of ACCENTS)
    for (const s of SHADES) out[`--c-${a}-${s}`] = rgb(defaultColors[a][mode === 'light' ? ACCENT_LIGHT[s] : s])
  for (const [k, [dark, light]] of Object.entries(SURFACES)) out[`--th-${k}`] = rgb(mode === 'light' ? light : dark)
  return out
}

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Comfortaa', 'cursive', 'sans-serif'],
        mono: ['Comfortaa', 'cursive', 'sans-serif'],
      },
      colors: {
        gray: themedScale('gray'),
        ...Object.fromEntries(ACCENTS.map((a) => [a, themedScale(a)])),
        th: Object.fromEntries(Object.keys(SURFACES).map((k) => [k, v(`th-${k}`)])),
        mina: {
          dark: '#1e2022',
          card: '#292b2d',
          accent: '#e65c00'
        }
      }
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root, .theme-fixed': { ...varsFor('dark'), colorScheme: 'dark' },
        'html.light': { ...varsFor('light'), colorScheme: 'light' },
      })
    }),
  ],
}
