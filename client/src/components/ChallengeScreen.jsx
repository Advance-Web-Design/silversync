/**
 * ChallengeScreen Component
 * 
 * This component displays various game challenges that players can select from.
 * Each challenge has specific rules or restrictions (e.g., without Marvel, without DC, etc.)
 */
import React, { useState, useEffect, useRef } from 'react';
import { useGameContext } from '../contexts/gameContext';
import { fetchTwoRandomActorsWithPhotos} from '../services/tmdbService';
import { logger } from '../utils/loggerUtils';
import Menu from './Menu';
import About from './About';
import Leaderboard from './Leaderboard';
//import './ChallengeScreen.css';
import { useTheme } from '../contexts/ThemeContext'; // Import the ThemeContext
import * as ChallengeScreenStyles from '../styles/ChallangeStyle.js'; // Import styles for ChallengeScreen

const ChallengeScreen = () => {
    const { 
        setChallengeMode, 
        setCurrentScreen, 
        showLeaderboard, 
        setShowLeaderboard, 
        setStartActors,
        startActors,
        setIsLoading,
        startGame
    } = useGameContext();
    const [showAbout, setShowAbout] = useState(false);
    const [pendingGameStart, setPendingGameStart] = useState(false);
    const pendingActorsRef = useRef(null);

    // Effect to start game when actors are set for auto-start challenges
    useEffect(() => {
        if (pendingGameStart && startActors[0] && startActors[1] && pendingActorsRef.current) {
            const startGameAsync = async () => {
                try {
                    logger.info('🎮 Starting game with updated actors...');
                    await startGame();
                    logger.info('✅ Game started successfully');
                    setPendingGameStart(false);
                    pendingActorsRef.current = null;
                } catch (error) {
                    logger.error('Error starting game:', error);
                    setCurrentScreen('actor-selection');
                    setPendingGameStart(false);
                    pendingActorsRef.current = null;
                } finally {
                    setIsLoading(false);
                }
            };
            startGameAsync();
        }
    }, [startActors, pendingGameStart, startGame, setCurrentScreen, setIsLoading]);    // Efficient function to get two random actors with photos quickly
   

    // Available challenges
    const challenges = [
        {
            id: 'for-fun',
            title: 'For Fun',
            description: 'No restrictions - pick any two actors and connect them',
            icon: '⭐',
            difficulty: 'Easy',
            color: 'bg-gray-500',
            filter: false,
            remove: []
        },
                {
            id: 'classic',
            title: 'classic',
            description: 'No restrictions - start with two random actors and connect them',
            icon: '⭐',
            difficulty: 'Easy',
            color: 'bg-gray-500',
            filter: false,
            remove: []
        },
        {
            id: 'no-marvel',
            title: 'Without Marvel',
            description: 'Connect actors without using any Marvel movies or TV shows',
            icon: '🦸‍♂️',
            difficulty: 'Medium',
            color: 'bg-red-500',
            type: 'no-production-companie',
            filter: true,
            remove: ['Marvel Studios', 'Marvel Entertainment', 'Marvel Enterprises', 'Marvel Comics', 'Marvel Television']
        },
        {
            id: 'no-dc',
            title: 'Without DC',
            description: 'Connect actors without using any DC movies or TV shows',
            icon: '🦇',
            difficulty: 'Medium',
            color: 'bg-blue-500',
            type: 'no-production-companie',
            filter: true,
            remove: ['DC Entertainment', 'DC Comics', 'DC Films', 'DC Universe', 'DC Entertainment Television']
        },
        {
            id: 'movies-only',
            title: 'Movies Only',
            description: 'Connect actors using only movies, no TV shows allowed',
            icon: '🎬',
            difficulty: 'Hard',
            color: 'bg-purple-500',
            type: 'movies-only',
            filter: true,
            remove: []
        },
        {
            id: 'tv-only',
            title: 'TV Shows Only',
            description: 'Connect actors using only TV shows, no movies allowed',
            icon: '📺',
            difficulty: 'Hard',
            color: 'bg-green-500',
            type: 'tv-only',
            filter: true,
            remove: []
        },        {
            id: 'no-disney',
            title: 'No Disney',
            description: 'Connect actors without using any Disney or sub companies like Pixar, Marvel, etc.',
            icon: '🎭',
            difficulty: 'Expert',
            color: 'bg-orange-500',
            type: 'no-production-companie',
            filter: true,
            remove: [
                // Disney Core
                'Walt Disney Pictures',
                'Walt Disney Animation Studios',
                'Disney Television Animation',
                'Disney Channel',
                'Disney Junior',
                'Disney XD',
                'Disney+',
                'The Walt Disney Company',
                'Walt Disney Studios',
                
                // Pixar
                'Pixar',
                'Pixar Animation Studios',
                
                // Marvel
                'Marvel Studios',
                'Marvel Entertainment',
                'Marvel Enterprises',
                'Marvel Comics',
                'Marvel Television',
                
                // Lucasfilm
                'Lucasfilm',
                'Lucasfilm Ltd.',
                'LucasArts',
                
                // 20th Century
                '20th Century Studios',
                '20th Century Fox',
                '20th Television',
                '20th Century Fox Television',
                
                // Touchstone/Hollywood Pictures
                'Touchstone Pictures',
                'Hollywood Pictures',
                
                // ABC/ESPN (Disney-owned networks)
                'ABC',
                'ABC Studios',
                'ABC Family',
                'ESPN',
                'Freeform',
                
                // Other Disney subsidiaries
                'Blue Sky Studios',
                'National Geographic',
                'FX Networks',
                'Hulu'
            ]
        },
        {
            id: 'Nathan',
            title: 'Developer Challenge',
            description: 'movie only, no DC ,no Disney or it\'s sub companies like Pixar, Marvel, etc',
            icon: '🎪',
            difficulty: 'Expert',
            color: 'bg-pink-500',
            type: 'no-production-companie-movies-only',
            filter: true,
            remove: [
                // Disney Core
                'Walt Disney Pictures',
                'Walt Disney Animation Studios',
                'Disney Television Animation',
                'Disney Channel',
                'Disney Junior',
                'Disney XD',
                'Disney+',
                'The Walt Disney Company',
                'Walt Disney Studios',
                
                // Pixar
                'Pixar',
                'Pixar Animation Studios',
                
                // Marvel
                'Marvel Studios',
                'Marvel Entertainment',
                'Marvel Enterprises',
                'Marvel Comics',
                'Marvel Television',

                // Lucasfilm
                'Lucasfilm',
                'Lucasfilm Ltd.',
                'LucasArts',

                // 20th Century
                '20th Century Studios',
                '20th Century Fox',
                '20th Television',
                '20th Century Fox Television',

                // Touchstone/Hollywood Pictures
                'Touchstone Pictures',
                'Hollywood Pictures',

                // ABC/ESPN (Disney-owned networks)
                'ABC',
                'ABC Studios',
                'ABC Family',
                'ESPN',
                'Freeform',

                // Other Disney subsidiaries
                'Blue Sky Studios',
                'National Geographic',
                'FX Networks',
                'Hulu',

                // DC
                'DC Entertainment',
                'DC Comics',
                'DC Films',
                'DC Universe',
                'DC Entertainment Television'
            ]
        },    ];

    const handleChallengeSelect = async (challenge) => {
        setChallengeMode(challenge);
        
        // If challenge is 'for-fun', go to actor selection screen
        if (challenge.id === 'for-fun') {
            setCurrentScreen('actor-selection');
            return;
        }
        
        // For all other challenges, automatically get 2 random actors and start the game
        try {
            logger.info(`🎯 Auto-starting challenge: ${challenge.title}`);
            
            // Get actors efficiently
            const actors = await fetchTwoRandomActorsWithPhotos();
            const [actor1, actor2] = actors;
            
            // Set both actors and mark for pending game start
            setStartActors([actor1, actor2]);
            pendingActorsRef.current = [actor1, actor2];
            setPendingGameStart(true);
            logger.info(`✅ Random actors selected: ${actor1.name} & ${actor2.name}`);
            
        } catch (error) {
            logger.error('Error auto-starting challenge:', error);
            logger.error('Error details:', {
                message: error.message,
                stack: error.stack,
                challengeId: challenge?.id,
                challengeTitle: challenge?.title
            });
            // Fallback to actor selection screen if random actors fail
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

    const getDifficultyColor = (difficulty, isLightMode) => {
        switch (difficulty) {
            case 'Easy':
                return isLightMode ? 'text-green-600' : 'text-green-400';
            case 'Medium':
                return isLightMode ? 'text-yellow-600' : 'text-yellow-400';
            case 'Hard':
                return isLightMode ? 'text-orange-500' : 'text-orange-300';
            case 'Expert':
                return isLightMode ? 'text-red-800' : 'text-red-400';
            default:
                return isLightMode ? 'text-gray-600' : 'text-gray-400';
        }
    };
    
    const { isLightMode } = useTheme(); // Get the current theme mode
    return (
        <div className={ChallengeScreenStyles.challengeScreenBaseStyle + " " + (isLightMode ? ChallengeScreenStyles.challengeScreenLightStyle : ChallengeScreenStyles.challengeScreenDarkStyle)}>
            {/* Header */}
            <div className={ChallengeScreenStyles.challengeScreenHeaderStyle}>
                <Menu parentName="ChallengeScreen" />
                <h1 className={ChallengeScreenStyles.challangeScreenTitleBaseStyle + " " + (isLightMode ? ChallengeScreenStyles.challengeScreenTitleLightStyle : ChallengeScreenStyles.challengeScreenTitleDarkStyle)}>
                    Choose Your Challenge
                </h1>
            </div>

            {/* Main Content */}
            <div className={ChallengeScreenStyles.challengeScreenMainContentStyle}>
                <div className={ChallengeScreenStyles.challengeScreenGridStyle}>
                    {challenges.map((challenge) => (
                        <div
                            key={challenge.id}
                            onClick={() => handleChallengeSelect(challenge)}
                            className={ChallengeScreenStyles.challangeCardBaseStyle + " " + (isLightMode ? ChallengeScreenStyles.challengeCardLightStyle : ChallengeScreenStyles.challengeCardDarkStyle)}
                        >
                            <div className="flex flex-col items-center text-center h-full">
                                <div className={ChallengeScreenStyles.challengeCardIconStyle + " " + challenge.color}>
                                    {challenge.icon}
                                </div>

                                <h3 className={ChallengeScreenStyles.challengeCardTitleBaseStyle + " " + (isLightMode ? ChallengeScreenStyles.challengeCardTitleLightStyle : ChallengeScreenStyles.challengeCardTitleDarkStyle)}>
                                    {challenge.title}
                                </h3>

                                <p className={ChallengeScreenStyles.challangeCardDescBaseStyle + " " + (isLightMode ? ChallengeScreenStyles.challangeCardDescLightStyle : ChallengeScreenStyles.challangeCardDescDarkStyle)}>
                                    {challenge.description}
                                </p>

                                <div className={ChallengeScreenStyles.challengeCardFooterStyle}>
                                    <span className={`text-sm font-semibold ${getDifficultyColor(challenge.difficulty, isLightMode)}`}>
                                        {challenge.difficulty}
                                    </span>
                                    <span className={ChallengeScreenStyles.challengeCardSelectBaseStyle + " " + (isLightMode ? ChallengeScreenStyles.challengeCardSelectLightStyle : ChallengeScreenStyles.challengeCardSelectDarkStyle)}>
                                        Select →
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}        </div>

                {/* Menu Buttons */}
                <div className={ChallengeScreenStyles.challengeScreenMenuButtonsWrapper}>
                    <div className="flex gap-4">
                        <button
                            onClick={handleShowLeaderboard}
                            className={ChallengeScreenStyles.challengeScreenLeaderboardButtonBaseStyle + " " + (isLightMode ? ChallengeScreenStyles.challengeScreenLeaderboardButtonLightStyle : ChallengeScreenStyles.challengeScreenLeaderboardButtonDarkStyle)}
                        >
                            🏆 Leaderboard
                        </button>

                        <button
                            onClick={handleShowAbout}
                            className={ChallengeScreenStyles.challengeScreenAboutButtonBaseStyle + " " + (isLightMode ? ChallengeScreenStyles.challengeScreenAboutButtonLightStyle : ChallengeScreenStyles.challengeScreenAboutButtonDarkStyle)}
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
