/**
 * Local Search Engine - Cache-based search and filtering
 * 
 * This module handles all local search operations on cached cheat sheet data.
 * It replaces the old TMDB API-based search with fast, local filtering and
 * matching algorithms that work entirely on cached entity data.
 */

import { stringSimilarity } from './stringUtils';
import { getItemTitle } from './entityUtils';
import { SIMILARITY_THRESHOLDS } from './constants';

// Common words to ignore in search processing
const COMMON_WORDS = ['the', 'and', 'movie', 'show', 'actor', 'star', 'film', 'tv', 'series'];

/**
 * Primary local search function - searches through cached cheat sheet data
 */
export const searchLocal = (searchTerm, cachedEntities, options = {}) => {
  const {
    maxResults = 50,
    includePartialMatches = true,
    includeSimilarityMatches = true,
    filterByType = null, // 'movie', 'tv', 'person' or null for all
    filterByStudio = null,
    filterByGenre = null
  } = options;

  if (!searchTerm || !cachedEntities || cachedEntities.length === 0) {
    return { results: [], exactMatch: null, suggestions: [] };
  }
  
  const normalizedTerm = searchTerm.toLowerCase().trim();
  
  // Skip very short terms or common words
  if (normalizedTerm.length < 2 || COMMON_WORDS.includes(normalizedTerm)) {
    return { results: [], exactMatch: null, suggestions: [] };
  }
  
  // Apply filters first to reduce search space
  let filteredEntities = applyFilters(cachedEntities, {
    filterByType,
    filterByStudio,
    filterByGenre
  });

  // Find matches using Levenshtein-based approach
  const exactMatches = findExactMatches(normalizedTerm, filteredEntities);
  const levenshteinMatches = includePartialMatches ? findLevenshteinMatches(normalizedTerm, filteredEntities) : [];
  const wordMatches = includeSimilarityMatches ? findWordMatches(normalizedTerm, filteredEntities) : [];
  
  // Combine and rank results
  const allMatches = combineAndRankMatches(exactMatches, levenshteinMatches, wordMatches);
  
  // Limit results
  const results = allMatches.slice(0, maxResults);
  
  // Find best exact match
  const exactMatch = exactMatches.length > 0 ? exactMatches[0].entity : null;
  
  // Generate suggestions for typos/similar terms
  const suggestions = generateSuggestions(normalizedTerm, filteredEntities, exactMatch);
  
  return {
    results: results.map(match => match.entity),
    exactMatch,
    suggestions
  };
};

/**
 * Apply filters to reduce search space
 */
const applyFilters = (entities, filters) => {
  let filtered = entities;
  
  if (filters.filterByType) {
    filtered = filtered.filter(entity => entity.media_type === filters.filterByType);
  }
  
  if (filters.filterByStudio) {
    filtered = filtered.filter(entity => 
      entity.studios && entity.studios.some(studio => 
        studio.toLowerCase().includes(filters.filterByStudio.toLowerCase())
      )
    );
  }
  
  if (filters.filterByGenre) {
    filtered = filtered.filter(entity => 
      entity.genres && entity.genres.some(genre => 
        genre.toLowerCase().includes(filters.filterByGenre.toLowerCase())
      )
    );
  }
  
  return filtered;
};

/**
 * Find exact matches (case-insensitive) with normalization
 */
const findExactMatches = (searchTerm, entities) => {
  const matches = [];
  
  // Normalize search term - remove punctuation and extra spaces
  const normalizedSearchTerm = searchTerm.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

  entities.forEach(entity => {
    const title = getItemTitle(entity).toLowerCase().trim();
    const normalizedTitle = title.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

    // Perfect match (original)
    if (title === searchTerm) {
      matches.push({
        entity,
        score: 1.0,
        type: 'exact'
      });
      return;
    }
    
    // Perfect match (normalized) - this handles punctuation differences
    if (normalizedTitle === normalizedSearchTerm) {
      matches.push({
        entity,
        score: 1.0,
        type: 'exact-normalized'
      });
      return;
    }

    // Check alternative names/titles with normalization
    const alternativeNames = [
      entity.name,
      entity.title,
      entity.original_name,
      entity.original_title
    ].filter(Boolean);
    
    for (const altName of alternativeNames) {
      const normalizedAltName = altName.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
      
      if (altName.toLowerCase().trim() === searchTerm || normalizedAltName === normalizedSearchTerm) {
        matches.push({
          entity,
          score: 0.95,
          type: 'exact-alt'
        });
        break;
      }
    }
  });
  
  return matches.sort((a, b) => b.score - a.score);
};

/**
 * Find matches using Levenshtein distance for better accuracy
 */
const findLevenshteinMatches = (searchTerm, entities) => {
  const matches = [];
  
  // Normalize search term - remove punctuation and extra spaces
  const normalizedSearchTerm = searchTerm.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  
  entities.forEach(entity => {
    const title = getItemTitle(entity).toLowerCase().trim();
    
    // Skip if already found as exact match
    if (title === searchTerm) return;
    
    // Normalize title - remove punctuation and extra spaces
    const normalizedTitle = title.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
    
    // Calculate Levenshtein similarity
    const similarity = stringSimilarity(normalizedSearchTerm, normalizedTitle);
    
    // Only include matches with good similarity (increased threshold to avoid false positives)
    if (similarity >= 0.7) { // Increased from 0.5 to 0.7 for better precision
      matches.push({
        entity,
        score: similarity * 0.9, // High score for Levenshtein matches
        type: 'levenshtein'
      });
    }
    
    // Also check if search term is contained in title (with normalization)
    if (normalizedTitle.includes(normalizedSearchTerm) && normalizedSearchTerm.length >= 4) {
      const containmentScore = Math.min(normalizedSearchTerm.length / normalizedTitle.length, 0.8);
      matches.push({
        entity,
        score: containmentScore * 0.8,
        type: 'contains'
      });
    }
  });
  
  return matches.sort((a, b) => b.score - a.score);
};

/**
 * Find matches based on word-level matching (for multi-word searches)
 */
const findWordMatches = (searchTerm, entities) => {
  const matches = [];
  
  // Only do word matching for multi-word searches
  const searchWords = searchTerm.split(' ').filter(word => word.length >= 3);
  if (searchWords.length < 2) return matches;
  
  entities.forEach(entity => {
    const title = getItemTitle(entity).toLowerCase().trim();
    const titleWords = title.split(' ').filter(word => word.length >= 3);
    
    if (titleWords.length === 0) return;
    
    // Count words that have good similarity
    const matchingWords = searchWords.filter(searchWord =>
      titleWords.some(titleWord => {
        const wordSimilarity = stringSimilarity(searchWord, titleWord);
        return wordSimilarity >= 0.7; // High threshold for word similarity
      })
    );
    
    const wordMatchRatio = matchingWords.length / searchWords.length;
    
    // Require at least 50% of words to match well
    if (wordMatchRatio >= 0.5) {
      matches.push({
        entity,
        score: wordMatchRatio * 0.6, // Lower than Levenshtein matches
        type: 'word-match'
      });
    }
  });
  
  return matches.sort((a, b) => b.score - a.score);
};

/**
 * Combine and rank all matches, removing duplicates
 */
const combineAndRankMatches = (exactMatches, partialMatches, similarityMatches) => {
  const allMatches = [...exactMatches, ...partialMatches, ...similarityMatches];
  const seenEntities = new Set();
  const uniqueMatches = [];
  
  // Remove duplicates, keeping highest-scored match for each entity
  allMatches.forEach(match => {
    const entityKey = `${match.entity.media_type}-${match.entity.id}`;
    
    if (!seenEntities.has(entityKey)) {
      seenEntities.add(entityKey);
      uniqueMatches.push(match);
    }
  });
  
  // Sort by score (highest first)
  return uniqueMatches.sort((a, b) => b.score - a.score);
};

/**
 * Generate suggestions for possible typos or similar terms
 */
const generateSuggestions = (searchTerm, entities, exactMatch) => {
  if (exactMatch) return []; // No suggestions needed if we found exact match
  
  const suggestions = [];
  const suggestionSet = new Set();
  
  // Find similar titles that might be what the user meant
  entities.forEach(entity => {
    const title = getItemTitle(entity).toLowerCase().trim();
    
    // Skip very short titles
    if (title.length < 3) return;
    
    const similarity = stringSimilarity(searchTerm, title);
    
    // Higher threshold for suggestions
    if (similarity >= SIMILARITY_THRESHOLDS.SUGGESTION + 0.1 && !suggestionSet.has(title)) {
      suggestionSet.add(title);
      suggestions.push({
        suggestion: entity.displayName || getItemTitle(entity),
        entity,
        similarity
      });
    }
  });
  
  // Sort by similarity and limit to top 3
  return suggestions
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);
};

/**
 * Filter cached entities by media type
 */
export const filterByMediaType = (entities, mediaType) => {
  if (!mediaType || !entities) return entities;
  return entities.filter(entity => entity.media_type === mediaType);
};

/**
 * Filter cached entities by studio/production company
 */
export const filterByStudio = (entities, studioName) => {
  if (!studioName || !entities) return entities;
  
  const normalizedStudio = studioName.toLowerCase();
  return entities.filter(entity => 
    entity.studios && entity.studios.some(studio => 
      studio.toLowerCase().includes(normalizedStudio)
    )
  );
};

/**
 * Filter cached entities by genre
 */
export const filterByGenre = (entities, genreName) => {
  if (!genreName || !entities) return entities;
  
  const normalizedGenre = genreName.toLowerCase();
  return entities.filter(entity => 
    entity.genres && entity.genres.some(genre => 
      genre.toLowerCase().includes(normalizedGenre)
    )
  );
};

/**
 * Get all unique studios from cached entities
 */
export const getAvailableStudios = (entities) => {
  if (!entities) return [];
  
  const studios = new Set();
  entities.forEach(entity => {
    if (entity.studios) {
      entity.studios.forEach(studio => studios.add(studio));
    }
  });
  
  return Array.from(studios).sort();
};

/**
 * Get all unique genres from cached entities
 */
export const getAvailableGenres = (entities) => {
  if (!entities) return [];
  
  const genres = new Set();
  entities.forEach(entity => {
    if (entity.genres) {
      entity.genres.forEach(genre => genres.add(genre));
    }
  });
  
  return Array.from(genres).sort();
};

/**
 * Quick search for autocomplete/typeahead functionality
 */
export const quickSearch = (searchTerm, entities, maxResults = 10) => {
  if (!searchTerm || searchTerm.length < 2) return [];
  
  const normalizedTerm = searchTerm.toLowerCase();
  const results = [];
  
  entities.forEach(entity => {
    const title = getItemTitle(entity).toLowerCase();
    
    // Prioritize titles that start with the search term
    if (title.startsWith(normalizedTerm)) {
      results.push({ entity, priority: 1 });
    }
    // Then titles that contain the search term
    else if (title.includes(normalizedTerm)) {
      results.push({ entity, priority: 2 });
    }
  });
  
  // Sort by priority and title, then limit results
  return results
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return getItemTitle(a.entity).localeCompare(getItemTitle(b.entity));
    })
    .slice(0, maxResults)
    .map(result => result.entity);
};
