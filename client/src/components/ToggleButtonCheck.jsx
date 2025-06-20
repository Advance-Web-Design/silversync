import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function ToggleSwitch() {
  const { isLightMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 
                  ${isLightMode ? 'bg-yellow-400' : 'bg-gray-400'}`}
      aria-pressed={isLightMode}
    >
      <div
        className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 
                    flex items-center justify-center text-lg
                    ${isLightMode ? 'translate-x-4' : 'translate-x-0'}`}
      >
        {isLightMode ? '🌞' : '🌙'}
      </div>
    </button>
  );
}