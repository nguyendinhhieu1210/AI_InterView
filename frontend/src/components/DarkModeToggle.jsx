import { useTheme } from '../contexts/ThemeContext'; // đường dẫn đúng tới file ThemeContext.jsx
import { Sun, Moon } from 'lucide-react';

export const DarkModeToggle = () => {
    const { darkMode, toggleDarkMode } = useTheme();
    return (
        <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
            aria-label="Toggle dark mode"
        >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
    );
};