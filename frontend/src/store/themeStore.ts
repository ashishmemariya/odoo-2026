import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
}

const savedTheme = localStorage.getItem('stocksense_theme');
const initialDark = savedTheme ? savedTheme === 'dark' : true; // Default to sleek dark mode

// Apply initially
if (initialDark) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: initialDark,
  toggleTheme: () => {
    set((state) => {
      const next = !state.isDark;
      localStorage.setItem('stocksense_theme', next ? 'dark' : 'light');
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { isDark: next };
    });
  },
  setTheme: (dark) => {
    localStorage.setItem('stocksense_theme', dark ? 'dark' : 'light');
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ isDark: dark });
  },
}));
