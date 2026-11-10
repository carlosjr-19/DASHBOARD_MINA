import { useEffect, useState } from 'react';

const STORAGE_KEY = 'mina-theme';

const readTheme = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

// Tema global de la app: estilo Jobie (claro por defecto con barra morada).
// Se guarda en el navegador para recordar la elección de cada usuario.
export function useTheme() {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* almacenamiento no disponible */
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return { theme, toggleTheme };
}
