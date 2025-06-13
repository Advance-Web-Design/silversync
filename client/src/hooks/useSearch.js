import { useState } from 'react';
import { searchPeople } from '../services/tmdbService';
import { searchLocal, quickSearch } from '../utils/localSearch';
import { getCachedCheatSheet,
         addToSearchHistory } from '../utils/cheatSheetCache';
import { logger } from '../utils/loggerUtils';

/**
 * Custom hook for search functionality
 * @returns {Object} - Search methods and state
 */
export const useSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [noMatchFound, setNoMatchFound] = useState(false);
  const [didYouMean, setDidYouMean] = useState(null);
  const [exactMatch, setExactMatch] = useState(null);
  const [originalSearchTerm, setOriginalSearchTerm] = useState('');  const [connectableItems, setConnectableItems] = useState({});
  
  /**
   * Search using local cache data
   * @param {string} term - Search term
   * @param {Array} boardNodes - Current board state for cache context
   * @param {Object} options - Search options
   * @returns {Object} - Search results with exact match and suggestions
   */
  const performLocalSearch = (term, boardNodes = [], options = {}) => {
    // Get cached cheat sheet data
    const cachedEntities = getCachedCheatSheet(boardNodes) || [];
    
    if (cachedEntities.length === 0) {
      logger.warn('No cached entities available for local search');
      return { results: [], exactMatch: null, suggestions: [] };
    }
    
    logger.info(`🔍 Performing local search for "${term}" in ${cachedEntities.length} cached entities`);
    
    return searchLocal(term, cachedEntities, {
      maxResults: 50,
      includePartialMatches: true,
      includeSimilarityMatches: true,
      ...options
    });
  };

  /**
   * Quick search for autocomplete/typeahead functionality
   * @param {string} term - Search term
   * @param {Array} boardNodes - Current board state for cache context
   * @returns {Array} - Quick search results
   */
  const performQuickSearch = (term, boardNodes = []) => {
    const cachedEntities = getCachedCheatSheet(boardNodes) || [];
    return quickSearch(term, cachedEntities, 10);
  };

  /**
   * Check for possible misspellings/suggestions using local cache
   * @param {string} term - Term to check for misspellings
   * @param {Array} boardNodes - Current board state for cache context
   * @returns {Object|null} - Suggested entity or null
   */
  const checkForMisspelling = (term, boardNodes = []) => {
    const searchResult = performLocalSearch(term, boardNodes, {
      maxResults: 1,
      minSimilarity: 0.6 // Lower threshold for suggestions
    });
    
    return searchResult.suggestions.length > 0 ? searchResult.suggestions[0].entity : null;
  };

  /**
   * Find exact match from search results
   * @param {Array} results - Search results array
   * @param {string} term - Search term
   * @returns {Object|null} - Exact match object or null
   */
  const findExactMatch = (results, term) => {
    if (!results || results.length === 0 || !term) return null;
    
    const normalizedTerm = term.toLowerCase().trim();
    
    // Perfect match (case insensitive)
    for (const item of results) {
      const itemTitle = (item.name || item.title || '').toLowerCase().trim();
      if (itemTitle === normalizedTerm) {
        return item;
      }
    }
    
    return null;
  };  /**
   * Learn from successful searches to improve future searches
   * @param {string} term - Search term
   * @param {Array} results - Search results
   */
  const learnFromSuccessfulSearch = (term, results) => {
    // The cache now handles search history internally
    addToSearchHistory(term, results);
  };
    // "Did you mean" functionality has been removed while keeping fuzzy search capabilities

  /**
   * Search for actors for the starting positions
   * @param {string} query - Search query
   * @param {number} actorIndex - Actor position index (0 or 1)
   * @param {number} page - Page number for pagination
   * @param {function} setActorSearchResults - Function to set search results
   * @param {function} setActorSearchPages - Function to set current page
   * @param {function} setActorSearchTotalPages - Function to set total pages
   * @param {function} setIsLoading - Function to set loading state
   */
  const searchStartActors = async (
    query, 
    actorIndex, 
    page = 1,
    setActorSearchResults,
    setActorSearchPages,
    setActorSearchTotalPages,
    setIsLoading
  ) => {
    try {
      if (!query.trim()) {
        setActorSearchResults(prev => {
          const newResults = [...prev];
          newResults[actorIndex] = [];
          return newResults;
        });
        return;
      }
      
      setIsLoading(true);
      const response = await searchPeople(query, page);
      
      // Filter out results without ID or profile images
      const filteredResults = response.results.filter(actor => {
        return actor.id && actor.profile_path;
      });
      
      // Update actor search results
      setActorSearchResults(prev => {
        const newResults = [...prev];
        newResults[actorIndex] = filteredResults;
        return newResults;
      });

      // Update page information
      setActorSearchPages(prev => {
        const newPages = [...prev];
        newPages[actorIndex] = response.page;
        return newPages;
      });

      setActorSearchTotalPages(prev => {
        const newTotalPages = [...prev];
        newTotalPages[actorIndex] = response.total_pages;
        return newTotalPages;
      });
      
      // Learn from the search
      if (filteredResults && filteredResults.length > 0) {
        learnFromSuccessfulSearch(query, filteredResults.map(result => ({ ...result, media_type: 'person' })));
      }
    } catch (error) {
      logger.error('Error searching for actors:', error);
    } finally {
      setIsLoading(false);
    }
  };  /**
   * Reset all search state to initial values
   */
  const resetSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setNoMatchFound(false);
    setDidYouMean(null);
    setExactMatch(null);
    setOriginalSearchTerm('');
    setConnectableItems({});
  };

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    setSearchResults,
    noMatchFound,
    setNoMatchFound,
    didYouMean,
    setDidYouMean,
    exactMatch,
    setExactMatch,
    originalSearchTerm,
    setOriginalSearchTerm,
    connectableItems,
    setConnectableItems,
    performLocalSearch,
    performQuickSearch,
    checkForMisspelling,
    findExactMatch,
    learnFromSuccessfulSearch,
    searchStartActors,
    resetSearch
  };
};