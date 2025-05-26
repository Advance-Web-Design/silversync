import { useState, useEffect } from 'react';
import { searchPeople, fetchPopularEntities } from '../services/tmdbService';
import { SIMILARITY_THRESHOLDS } from '../utils/constants';
import { 
  checkForMisspelling as checkForMisspellingUtil,
  findExactMatch as findExactMatchUtil
} from '../utils/searchUtils';
import { 
  loadPreviousSearches,
  loadKnownEntities,
  savePreviousSearches,
  saveKnownEntities,
  addToSearchHistory 
} from '../utils/storageUtils';
import { 
  updateConnectableEntitiesForNode as updateNodeConnections,
  extractActorTvShows
} from '../utils/connectableEntityUtils';

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
  const [originalSearchTerm, setOriginalSearchTerm] = useState('');const [previousSearches, setPreviousSearches] = useState(() => loadPreviousSearches());  const [knownEntities, setKnownEntities] = useState(() => loadKnownEntities());
  const [connectableItems, setConnectableItems] = useState({});
  
  // New state for tracking all possible connectable entities
  const [connectableEntities, setConnectableEntities] = useState([]);
  
  // Fetch popular entities on mount to enhance the search experience
  useEffect(() => {
    const loadPopularEntities = async () => {
      try {
        // Load popular entities but don't store in state since we're not displaying them directly
        // Instead, we add them to the connectable entities list
        const entities = await fetchPopularEntities();
        if (entities && entities.length > 0) {
          setConnectableEntities(prev => [...prev, ...entities]);
        }
      } catch (error) {
        console.error('Error loading popular entities:', error);
      }
    };
    
    loadPopularEntities();
  }, []);
    // Update session storage when previousSearches changes
  useEffect(() => {
    savePreviousSearches(previousSearches);
  }, [previousSearches]);
  
  // Update session storage when knownEntities changes
  useEffect(() => {
    saveKnownEntities(knownEntities);
  }, [knownEntities]);
    /**
   * Check for possible misspellings based on known terms using simple string comparison
   * Prioritizes connectable entities that might match the user's input
   * @param {string} term - Term to check for misspellings
   * @returns {Object|null} - Suggested entity or null
   */
  const checkForMisspelling = (term) => {
    return checkForMisspellingUtil(
      term,
      connectableEntities,
      knownEntities,
      previousSearches,
      connectableItems
    );
  };
    /**
   * Find exact match from search results
   * @param {Array} results - Search results array
   * @param {string} term - Search term
   * @returns {Object|null} - Exact match object or null
   */
  const findExactMatch = (results, term) => {
    return findExactMatchUtil(results, term);
  };
    /**
   * Learn from successful searches to improve future searches
   * @param {string} term - Search term
   * @param {Array} results - Search results
   */
  const learnFromSuccessfulSearch = (term, results) => {
    addToSearchHistory(term, results, setPreviousSearches, setKnownEntities);
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
      console.error('Error searching for actors:', error);
    } finally {
      setIsLoading(false);
    }
  };
  /**
   * Update the list of connectable entities based on a node's connections
   * @param {Object} node - The node to analyze for connectable entities
   * @param {Function} fetchNodeConnectionsCallback - Function that fetches possible connections for a node
   */
  const updateConnectableEntitiesForNode = async (node, fetchNodeConnectionsCallback) => {
    await updateNodeConnections(node, fetchNodeConnectionsCallback, setConnectableEntities);
  };  // Function removed as it was unused

  /**
   * Process an actor's data to extract all TV shows they've appeared in (including guest appearances)
   * and add them to the connectable entities list
   * @param {Object} actorData - Actor data object
   * @returns {Array} - Array of TV shows the actor has appeared in
   */
  const addActorTvShowsToConnectableEntities = (actorData) => {
    return extractActorTvShows(actorData);
  };  return {
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
    previousSearches,
    setPreviousSearches,
    knownEntities,
    setKnownEntities,
    connectableItems,
    setConnectableItems,
    connectableEntities,
    setConnectableEntities,
    checkForMisspelling,
    findExactMatch,
    learnFromSuccessfulSearch,
    searchStartActors,
    updateConnectableEntitiesForNode,
    addActorTvShowsToConnectableEntities
  };
};