import React from 'react';
import { useGameContext } from '../contexts/gameContext';
import PremadeChallenges from './PremadeChallenges';
import { COUNTRIES } from '../utils/countries';
import { PLATFORMS } from '../utils/constants';

export default function ChallengeMode({ onBack }) {
  const { startGame } = useGameContext();

  const handleStart = (settings) => {
    // settings = { gender, country, platform, timer } is and object
    // ** TUDO: Save challenge settings obj to user's "Challenge History" in DB
    // ** TUDO: Allow user to delete challenges from history
    startGame(settings);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8 relative">
        <button
          onClick={onBack}
          aria-label="Close"
          className="
            absolute top-4 right-4 
            text-black font-bold 
            text-2xl 
            bg-transparent 
            hover:text-gray-600 
            focus:outline-none
          "
        >
          &times;
        </button>

        <h2 className="text-2xl font-semibold text-center mb-6 mt-2">
          Premade Challenge
        </h2>

        <PremadeChallenges
          countries={COUNTRIES}
          platforms={PLATFORMS}
          onStart={handleStart}
        />
      </div>
    </div>
  );
}