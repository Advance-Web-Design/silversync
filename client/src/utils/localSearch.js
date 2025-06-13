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
import { logger } from './loggerUtils';

// Common words to ignore in search processing
const COMMON_WORDS = ['the', 'and', 'movie', 'show', 'actor', 'star', 'film', 'tv', 'series'];

/**
 * Primary local search function - searches through cached cheat sheet data
 */
export const searchLocal = (searchTerm, cachedEntities, options = {}) => {
  const startTime = Date.now();
  logger.time('local-search');
    const {
    maxResults = 50,
    includePartialMatches = true,
    includeSimilarityMatches = true,
    minSimilarity = SIMILARITY_THRESHOLDS.SUGGESTION,
    filterByType = null, // 'movie', 'tv', 'person' or null for all
    filterByStudio = null,
    filterByGenre = null
  } = options;
    if (!searchTerm || !cachedEntities || cachedEntities.length === 0) {
    logger.warn(`🔍 Local search failed: searchTerm="${searchTerm}", cachedEntities=${cachedEntities?.length || 0}`);
    return { results: [], exactMatch: null, suggestions: [] };
  }
  
  const normalizedTerm = searchTerm.toLowerCase().trim();
  
  // Skip very short terms or common words
  if (normalizedTerm.length < 2 || COMMON_WORDS.includes(normalizedTerm)) {
    logger.warn(`🔍 Local search skipped: term too short or common word: "${normalizedTerm}"`);
    return { results: [], exactMatch: null, suggestions: [] };
  }
  
  logger.debug(`🔍 Local search starting: "${normalizedTerm}" in ${cachedEntities.length} entities`);
  
  // Apply filters first to reduce search space
  let filteredEntities = applyFilters(cachedEntities, {
    filterByType,
    filterByStudio,
    filterByGenre
  });
  
  // Find matches
  const exactMatches = findExactMatches(normalizedTerm, filteredEntities);
  const partialMatches = includePartialMatches ? findPartialMatches(normalizedTerm, filteredEntities) : [];
  const similarityMatches = includeSimilarityMatches ? findSimilarityMatches(normalizedTerm, filteredEntities, minSimilarity) : [];
  
  // Combine and rank results
  const allMatches = combineAndRankMatches(exactMatches, partialMatches, similarityMatches);
  
  // Limit results
  const results = allMatches.slice(0, maxResults);
  
  // Find best exact match
  const exactMatch = exactMatches.length > 0 ? exactMatches[0].entity : null;
  
  // Generate suggestions for typos/similar terms
  const suggestions = generateSuggestions(normalizedTerm, filteredEntities, exactMatch);
  
  const duration = Date.now() - startTime;
  logger.info(`🔍 Local search: "${searchTerm}" → ${results.length} results in ${duration}ms`);
  logger.timeEnd('local-search');
  
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
 * Find exact matches (case-insensitive)
 */
const findExactMatches = (searchTerm, entities) => {
  const matches = [];
  
  entities.forEach(entity => {
    const title = getItemTitle(entity).toLowerCase().trim();
    
    // Debug: Log some titles being checked
    if (title.includes('thor') || searchTerm.includes('thor')) {
      logger.debug(`🔍 Checking entity for "thor": "${title}" vs "${searchTerm}"`);
    }
    
    // Perfect match
    if (title === searchTerm) {
      matches.push({
        entity,
        score: 1.0,
        type: 'exact'
      });
      return;
    }
    
    // Check alternative names/titles
    const alternativeNames = [
      entity.name,
      entity.title,
      entity.original_name,
      entity.original_title
    ].filter(Boolean);
    
    for (const altName of alternativeNames) {
      if (altName.toLowerCase().trim() === searchTerm) {
        matches.push({
          entity,
          score: 0.95,
          type: 'exact-alt'
        });
        break;
      }
    }
  });
  
  logger.debug(`🔍 Exact matches found: ${matches.length} for "${searchTerm}"`);
  return matches.sort((a, b) => b.score - a.score);
};

/**
 * Find partial matches (substring matches)
 */
const findPartialMatches = (searchTerm, entities) => {
  const matches = [];
  
  entities.forEach(entity => {
    const title = getItemTitle(entity).toLowerCase().trim();
    
    // Skip if already found as exact match
    if (title === searchTerm) return;
    
    // Substring matching
    if (title.includes(searchTerm) || searchTerm.includes(title)) {
      // Calculate match quality
      const matchPercentage = Math.min(
        searchTerm.length / title.length,
        title.length / searchTerm.length
      );
      
      if (matchPercentage > 0.3) { // Minimum 30% overlap
        matches.push({
          entity,
          score: matchPercentage * 0.8, // Lower than exact matches
          type: 'partial'
        });
      }
    }
    
    // Word-level matching
    const searchWords = searchTerm.split(' ').filter(word => word.length > 2);
    const titleWords = title.split(' ').filter(word => word.length > 2);
    
    if (searchWords.length > 0 && titleWords.length > 0) {
      const matchingWords = searchWords.filter(searchWord =>
        titleWords.some(titleWord => 
          titleWord.includes(searchWord) || searchWord.includes(titleWord)
        )
      );
      
      const wordMatchRatio = matchingWords.length / searchWords.length;
      
      if (wordMatchRatio > 0.5) { // At least 50% of words match
        matches.push({
          entity,
          score: wordMatchRatio * 0.7,
          type: 'word-match'
        });
      }
    }
  });
  
  return matches.sort((a, b) => b.score - a.score);
};

/**
 * Find similarity-based matches using fuzzy matching
 */
const findSimilarityMatches = (searchTerm, entities, minSimilarity) => {
  const matches = [];
  
  entities.forEach(entity => {
    const title = getItemTitle(entity).toLowerCase().trim();
    
    // Skip very short titles or common words
    if (title.length < 3 || COMMON_WORDS.includes(title)) return;
    
    const similarity = stringSimilarity(searchTerm, title);
    
    if (similarity >= minSimilarity) {
      matches.push({
        entity,
        score: similarity * 0.6, // Lower than partial matches
        type: 'similarity'
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
