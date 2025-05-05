/**
 * Constants used throughout the game
 * This file contains configuration values, thresholds, and default settings
 * that are referenced across multiple components and services.
 */

/**
 * Initial set of well-known entities used as search suggestions
 * and to improve search accuracy through string similarity matching
 */
export const INITIAL_KNOWN_ENTITIES = [
  'brad pitt', 'jennifer aniston', 'scarlett johansson', 'robert downey jr',
  'johnny depp', 'leonardo dicaprio', 'jennifer lawrence', 'tom hanks',
  'angelina jolie', 'will smith', 'morgan freeman', 'samuel l jackson',
  'meryl streep', 'denzel washington', 'charlize theron', 'julia roberts',
  'game of thrones', 'breaking bad', 'stranger things', 'the walking dead',
  'the sopranos', 'friends', 'the office', 'star wars', 'lord of the rings',
  'harry potter', 'the matrix', 'jurassic park', 'the godfather', 'marvel',
  'avengers', 'batman', 'spiderman', 'titanic', 'the dark knight'
];

/**
 * Thresholds for string similarity comparisons
 * Used in search functionality for spelling suggestions and exact matches
 */
export const SIMILARITY_THRESHOLDS = {
  SUGGESTION: 0.7,  // Threshold for spelling suggestions
  EXACT_MATCH: 0.9, // Threshold for considering exact matches
};

/**
 * Default positioning configuration for game nodes
 * Controls initial positions and randomization ranges
 */
export const DEFAULT_NODE_POSITION = { x: 300, y: 300 };
export const RANDOM_POSITION_RANGE = {
  X: { MIN: 100, MAX: 600 },
  Y: { MIN: 100, MAX: 400 },
};

/**
 * Default dimensions for the game board
 * Used as fallback when dynamic sizing is not available
 */
export const DEFAULT_BOARD_DIMENSIONS = {
  WIDTH: 800,
  HEIGHT: 600
};