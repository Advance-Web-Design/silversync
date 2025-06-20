import { useState } from 'react';
import {useTheme} from '../contexts/ThemeContext';


export default function ToggleSwitch({ enabled, onClick }) {
  return (
    <button
      onClick={onClick} // Use the passed onClick handler
      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 
                  ${enabled ? 'bg-green-500' : 'bg-gray-400'}`}
      
    >
    remove
      <div
        className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 
                    flex items-center justify-center text-lg
                    ${enabled ? 'translate-x-6' : 'translate-x-0'}`}
      >
        {enabled ? '🌞' : '🌙'}
      </div>
    </button>
  );
}
