/**
 * ChallengeScreen Component
 * 
 * This component displays various game challenges that players can select from.
 * Each challenge has specific rules or restrictions (e.g., without Marvel, without DC, etc.)
 */
import React, { useState } from 'react';
import { useGameContext } from '../contexts/gameContext';
import Menu from './Menu';
import About from './About';
import Leaderboard from './Leaderboard';
import './ChallengeScreen.css';

const ChallengeScreen = () => {
    const { setChallengeMode, setCurrentScreen, showLeaderboard, setShowLeaderboard } = useGameContext();
    const [showAbout, setShowAbout] = useState(false);

    // Available challenges
    const challenges = [
        {
            id: 'classic',
            title: 'Classic Mode',
            description: 'No restrictions - connect actors any way you can',
            icon: '⭐',
            difficulty: 'Easy',
            color: 'bg-gray-500',
            remove: []
        },
        {
            id: 'no-marvel',
            title: 'Without Marvel',
            description: 'Connect actors without using any Marvel movies or TV shows',
            icon: '🦸‍♂️',
            difficulty: 'Medium',
            color: 'bg-red-500',
            remove: ['Marvel Studios', 'Marvel Entertainment', 'Marvel Enterprises', 'Marvel Comics', 'Marvel Television']
        },
        {
            id: 'no-dc',
            title: 'Without DC',
            description: 'Connect actors without using any DC movies or TV shows',
            icon: '🦇',
            difficulty: 'Medium',
            color: 'bg-blue-500',
            remove: ['Dc Entertainment', 'DC Comics', 'DC Films', 'DC Universe', 'DC Entertainment Television']
        },
        {
            id: 'movies-only WIP',
            title: 'Movies Only (WIP)',
            description: 'Connect actors using only movies, no TV shows allowed',
            icon: '🎬',
            difficulty: 'Hard',
            color: 'bg-purple-500',
            remove: []
        },
        {
            id: 'tv-only WIP',
            title: 'TV Shows Only (WIP)',
            description: 'Connect actors using only TV shows, no movies allowed',
            icon: '📺',
            difficulty: 'Hard',
            color: 'bg-green-500',
            remove: []
        },
        {
            id: 'no-sequels WIP',
            title: 'No Sequels (WIP)',
            description: 'Connect actors without using any sequel movies',
            icon: '🎭',
            difficulty: 'Expert',
            color: 'bg-orange-500',
            remove: []
        },
        {
            id: 'indie-only WIP',
            title: 'Indie Films Only (WIP)',
            description: 'Connect actors using only independent films',
            icon: '🎪',
            difficulty: 'Expert',
            color: 'bg-pink-500',
            remove: []
        },
        {
            id: 'before-2000 WIP',
            title: 'Pre-2000 Only (WIP)',
            description: 'Connect actors using only movies/shows from before year 2000',
            icon: '📼',
            difficulty: 'Expert',
            color: 'bg-yellow-500',
            remove: []
        },

    ];

    const handleChallengeSelect = (challenge) => {
        setChallengeMode(challenge);
        if (!challenge.id.includes('WIP')) {
            setCurrentScreen('actor-selection');
        }
    }; 
    const handleShowAbout = () => {
        setShowAbout(true);
    };
    const handleShowLeaderboard = () => {
        setShowLeaderboard(true);
    };

    const handleCloseAbout = () => {
        setShowAbout(false);
    };
    const handleCloseLeaderboard = () => {
        setShowLeaderboard(false);
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Easy': return 'text-green-400';
            case 'Medium': return 'text-yellow-400';
            case 'Hard': return 'text-orange-400';
            case 'Expert': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="relative min-h-screen bg-[url('/bg2.png')] bg-cover bg-center bg-fixed text-black">
            {/* Header */}
            <div className="flex justify-between items-center p-4 w-full">
                <Menu parentName="ChallengeScreen" />
                <h1 className="font-serif font-bold text-[2.75rem] text-[#ffd700] [text-shadow:0_0_8px_#ff4500]">
                    Choose Your Challenge
                </h1>
            </div>

            {/* Main Content */}
            <div className="flex flex-col items-center justify-center p-8 mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mb-8">
                    {challenges.map((challenge) => (
                        <div
                            key={challenge.id}
                            onClick={() => handleChallengeSelect(challenge)}
                            className="challenge-card bg-black/80 backdrop-blur-sm rounded-xl p-6 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:bg-black/90 border border-gray-600 hover:border-[#ffd700]"
                        >
                            <div className="flex flex-col items-center text-center h-full">
                                <div className={`w-16 h-16 rounded-full ${challenge.color} flex items-center justify-center text-2xl mb-4`}>
                                    {challenge.icon}
                                </div>

                                <h3 className="text-xl font-bold text-[#ffd700] mb-2">
                                    {challenge.title}
                                </h3>

                                <p className="text-gray-300 text-sm mb-4 flex-grow">
                                    {challenge.description}
                                </p>

                                <div className="flex items-center justify-between w-full">
                                    <span className={`text-sm font-semibold ${getDifficultyColor(challenge.difficulty)}`}>
                                        {challenge.difficulty}
                                    </span>
                                    <span className="text-[#4bbee3] text-sm font-medium">
                                        Select →
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}        </div>

                {/* Menu Buttons */}
                <div className="flex flex-col gap-4 w-full max-w-[400px] mb-6">
                    <div className="flex gap-4">
                        <button
                            onClick={handleShowLeaderboard}
                            className="flex-1 cursor-pointer rounded-lg bg-[#4bbee3] py-[0.8rem] px-6 text-[1.1rem] font-bold text-white shadow-md transition-colors duration-300 hover:bg-cyan-700"
                        >
                            🏆 Leaderboard
                        </button>

                        <button
                            onClick={handleShowAbout}
                            className="flex-1 cursor-pointer rounded-lg bg-[#10b981] py-[0.8rem] px-6 text-[1.1rem] font-bold text-white shadow-md transition-colors duration-300 hover:bg-emerald-700"
                        >
                            ℹ️ About
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Overlays */}
            {showAbout && (
                <div className="fixed inset-0 z-50">
                    <About onClose={handleCloseAbout} />
                </div>
            )}

            {showLeaderboard && (
                <div className="fixed inset-0 z-50">
                    <Leaderboard onClose={handleCloseLeaderboard} />
                </div>
            )}
        </div>
    );
};

export default ChallengeScreen;
