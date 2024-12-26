import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';

const ThemeSwitcher = () => {
    const { currentTheme, changeTheme, themes } = useTheme();

    return (
        <div className="relative">
            <select
                value={currentTheme}
                onChange={(e) => changeTheme(e.target.value)}
                className="bg-muted text-secondary-foreground border border-border rounded-lg px-3 py-2 pr-8 appearance-none cursor-pointer"
            >
                {Object.entries(themes).map(([key, theme]) => (
                    <option key={key} value={key}>
                        {theme.name}
                    </option>
                ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                {currentTheme.includes('light') ? (
                    <FiSun className="w-4 h-4 text-secondary-foreground" />
                ) : (
                    <FiMoon className="w-4 h-4 text-secondary-foreground" />
                )}
            </div>
        </div>
    );
};

export default ThemeSwitcher; 