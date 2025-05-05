import { useState, useEffect } from 'react';
import { searchMulti, searchPeople, fetchPopularEntities } from '../services/tmdbService';
import { stringSimilarity, getItemTitle } from '../utils/stringUtils';
import { SIMILARITY_THRESHOLDS } from '../utils/constants';

/**
 * Custom hook for search functionality
 * @returns {Object} - Search methods and state
 */
export const useSearch = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [noMatchFound, setNoMatchFound] = useState(false);
  const [didYouMean, setDidYouMean] = useState(null);
  const [exactMatch, setExactMatch] = useState(null);
  const [originalSearchTerm, setOriginalSearchTerm] = useState('');
  const [previousSearches, setPreviousSearches] = useState(() => {
    // Try to load previous searches from session storage on init
    const storedSearches = sessionStorage.getItem('previousSearches');
    return storedSearches ? JSON.parse(storedSearches) : [];
  });
  const [knownEntities, setKnownEntities] = useState(() => {
    // Try to load known entities from session storage on init
    const storedEntities = sessionStorage.getItem('knownEntities');
    return storedEntities ? JSON.parse(storedEntities) : [];
  });
  const [popularEntities, setPopularEntities] = useState([]);
  const [connectableItems, setConnectableItems] = useState({});
  
  // New state for tracking all possible connectable entities
  const [connectableEntities, setConnectableEntities] = useState([]);
  
  // Fetch popular entities on mount
  useEffect(() => {
    const loadPopularEntities = async () => {
      try {
        const entities = await fetchPopularEntities();
        setPopularEntities(entities);
      } catch (error) {
        console.error('Error loading popular entities:', error);
      }
    };
    
    loadPopularEntities();
  }, []);
  
  // Update session storage when previousSearches changes
  useEffect(() => {
    if (previousSearches.length > 0) {
      sessionStorage.setItem('previousSearches', JSON.stringify(previousSearches));
    }
  }, [previousSearches]);
  
  // Update session storage when knownEntities changes
  useEffect(() => {
    if (knownEntities.length > 0) {
      sessionStorage.setItem('knownEntities', JSON.stringify(knownEntities));
    }
  }, [knownEntities]);
  
  /**
   * Check for possible misspellings based on known terms using simple string comparison
   * Prioritizes connectable entities that might match the user's input
   * @param {string} term - Term to check for misspellings
   * @returns {Object|null} - Suggested entity or null
   */
  const checkForMisspelling = (term) => {
    if (!term || term.trim().length < 3) return null;
    
    const normalizedTerm = term.toLowerCase().trim();
    
    // Skip terms that are likely not names (common words, single character)
    const commonWords = ['the', 'and', 'movie', 'show', 'actor', 'star', 'film'];
    if (commonWords.includes(normalizedTerm)) return null;
    
    // Use different similarity thresholds based on context
    // More permissive threshold for connectable entities (things that can be added right now)
    const CONNECTABLE_THRESHOLD = SIMILARITY_THRESHOLDS.SUGGESTION - 0.08; // Lower threshold for connectables
    const NORMAL_THRESHOLD = SIMILARITY_THRESHOLDS.SUGGESTION; // Regular threshold for other entities
    
    // First, check if the term might be a partial match to a connectable entity's title
    // This helps with cases like typing "friend" for "Friends" TV show
    const connectablePartialMatches = [];
    connectableEntities.forEach(entity => {
      const entityTitle = getItemTitle(entity).toLowerCase();
      
      // Check if the search term is contained in the entity title
      // Or if entity title is contained in the search term
      if (entityTitle.includes(normalizedTerm) || normalizedTerm.includes(entityTitle)) {
        // Calculate what percentage of the entity title matches the search term
        const matchPercentage = Math.min(normalizedTerm.length / entityTitle.length, 
                                        entityTitle.length / normalizedTerm.length);
        
        // Only consider it a partial match if substantial overlap
        if (matchPercentage > 0.5) {
          connectablePartialMatches.push({
            entity,
            matchScore: matchPercentage * 0.9 // Scale a bit below exact match
          });
        }
      }
    });
    
    // If we found any good partial matches among connectable entities
    if (connectablePartialMatches.length > 0) {
      // Sort by match score descending
      connectablePartialMatches.sort((a, b) => b.matchScore - a.matchScore);
      const bestPartialMatch = connectablePartialMatches[0];
      
      // If it's a very good partial match, use it directly
      if (bestPartialMatch.matchScore > 0.7) {
        const result = bestPartialMatch.entity;
        const itemKey = `${result.media_type}-${result.id}`;
        result.isConnectable = connectableItems[itemKey] === true;
        return result;
      }
    }
    
    // Prepare lists of entities for similarity checking
    const allEntities = [];
    
    // Prioritize connectable entities - they get a lower threshold
    connectableEntities.forEach(entity => {
      const name = getItemTitle(entity);
      allEntities.push({
        name: name,
        entity: entity,
        isConnectable: true,
        threshold: CONNECTABLE_THRESHOLD 
      });
    });
    
    // Add known entities with normal threshold
    knownEntities.forEach(entity => {
      if (typeof entity !== 'string') {
        const name = getItemTitle(entity);
        const isConnectable = connectableItems[`${entity.media_type}-${entity.id}`];
        const threshold = isConnectable ? CONNECTABLE_THRESHOLD : NORMAL_THRESHOLD;
        
        // Avoid duplicates
        const isDuplicate = allEntities.some(item => 
          item.name.toLowerCase() === name.toLowerCase() && item.isConnectable === true
        );
        
        if (!isDuplicate) {
          allEntities.push({
            name: name,
            entity: entity,
            isConnectable: isConnectable,
            threshold: threshold
          });
        }
      }
    });
    
    // Add previous search terms
    previousSearches.forEach(search => {
      // Avoid duplicates
      const isDuplicate = allEntities.some(item => 
        item.name.toLowerCase() === search.toLowerCase()
      );
      
      if (!isDuplicate) {
        allEntities.push({
          name: search,
          entity: search,
          isConnectable: false,
          threshold: NORMAL_THRESHOLD
        });
      }
    });
    
    let bestMatch = null;
    let highestSimilarity = 0;
    
    // Check all names for similarity
    for (const item of allEntities) {
      // Skip very short names or common words
      if (item.name.length < 3 || commonWords.includes(item.name.toLowerCase())) continue;
      
      const similarity = stringSimilarity(normalizedTerm, item.name.toLowerCase());
      
      // Check against the appropriate threshold for this item
      if (similarity > item.threshold && similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatch = item.entity;
      }
    }
    
    // If we found a string match but don't have the full entity
    if (bestMatch && typeof bestMatch === 'string') {
      // Try to find the full entity in connectableEntities or knownEntities
      const entityMatch = [...connectableEntities, ...knownEntities].find(entity => 
        typeof entity !== 'string' && getItemTitle(entity).toLowerCase() === bestMatch.toLowerCase()
      );
      
      if (entityMatch) {
        bestMatch = entityMatch;
      }
    }
    
    // Add a flag if the suggestion is connectable
    if (bestMatch && typeof bestMatch === 'object' && bestMatch.media_type) {
      const itemKey = `${bestMatch.media_type}-${bestMatch.id}`;
      bestMatch.isConnectable = connectableItems[itemKey] === true;
    }
    
    return bestMatch;
  };
  
  /**
   * Find exact match from search results
   * @param {Array} results - Search results array
   * @param {string} term - Search term
   * @returns {Object|null} - Exact match object or null
   */
  const findExactMatch = (results, term) => {
    if (!term || !results || results.length === 0) return null;
    
    // Look for exact match (case insensitive)
    const normalizedTerm = term.toLowerCase().trim();
    
    // First, try to find a perfect match
    for (const item of results) {
      const itemTitle = getItemTitle(item).toLowerCase().trim();
      if (itemTitle === normalizedTerm) {
        return item;
      }
    }
    
    // If no perfect match, check if the search term is a complete name that's part of any results
    for (const item of results) {
      const itemTitle = getItemTitle(item).toLowerCase().trim();
      
      // Check if search term is contained within the item title
      if (itemTitle.includes(normalizedTerm) || normalizedTerm.includes(itemTitle)) {
        const searchTermWords = normalizedTerm.split(' ');
        const titleWords = itemTitle.split(' ');
        
        // For short search terms (1-2 words), require that all search words appear in the title
        if (searchTermWords.length <= 2) {
          if (searchTermWords.every(word => titleWords.some(titleWord => titleWord.includes(word)))) {
            return item;
          }
        }
        // For longer names, require high word overlap
        else {
          const matchingWords = searchTermWords.filter(word => 
            titleWords.some(titleWord => titleWord.includes(word))
          ).length;
          
          // If more than 75% of the words match, consider it an exact match
          if (matchingWords >= searchTermWords.length * 0.75) {
            return item;
          }
        }
      }
    }
    
    // For single-word searches, be more strict to avoid false matches
    if (!normalizedTerm.includes(' ')) {
      for (const item of results) {
        const itemTitle = getItemTitle(item).toLowerCase().trim();
        const titleWords = itemTitle.split(' ');
        
        // If single word search exactly matches the first or last word of a name
        if (titleWords[0] === normalizedTerm || titleWords[titleWords.length - 1] === normalizedTerm) {
          return item;
        }
      }
    }
    
    // If still no match found, look for highest similarity match above threshold
    let bestMatch = null;
    let highestSimilarity = SIMILARITY_THRESHOLDS.EXACT_MATCH;
    
    for (const item of results) {
      const itemTitle = getItemTitle(item).toLowerCase().trim();
      const similarity = stringSimilarity(normalizedTerm, itemTitle);
      
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatch = item;
      }
    }
    
    return bestMatch;
  };
  
  /**
   * Learn from successful searches to improve future searches
   * @param {string} term - Search term
   * @param {Array} results - Search results
   */
  const learnFromSuccessfulSearch = (term, results) => {
    // Only learn if we got results
    if (!results || results.length === 0) return;
    
    // Add the term to previous searches if it got results
    setPreviousSearches(prev => {
      if (!prev.includes(term.toLowerCase())) {
        return [...prev, term.toLowerCase()];
      }
      return prev;
    });
    
    // Add the complete entity objects to our known entities list
    // This preserves much more information than just storing strings
    setKnownEntities(prev => {
      const updatedEntities = [...prev];
      const existingIds = new Set();
      
      // First collect all existing IDs to avoid duplicates
      prev.forEach(entity => {
        if (typeof entity === 'object' && entity !== null && entity.id) {
          existingIds.add(`${entity.media_type}-${entity.id}`);
        }
      });
      
      // Add new entities that aren't already in the list
      results.forEach(entity => {
        const entityId = `${entity.media_type}-${entity.id}`;
        if (!existingIds.has(entityId)) {
          updatedEntities.push(entity);
          existingIds.add(entityId);
        }
      });
      
      return updatedEntities;
    });
    
    // Update the local database in session storage too
    try {
      const storedEntities = sessionStorage.getItem('popularEntities');
      let entities = storedEntities ? JSON.parse(storedEntities) : [];
      let updated = false;
      
      // Collection of existing entity IDs
      const existingIds = new Set(
        entities.map(entity => `${entity.media_type}-${entity.id}`)
      );
      
      // Add new entities from search results
      results.forEach(entity => {
        const entityId = `${entity.media_type}-${entity.id}`;
        if (!existingIds.has(entityId)) {
          entities.push({
            id: entity.id,
            name: entity.name || entity.title || '',
            title: entity.title || entity.name || '',
            profile_path: entity.profile_path,
            poster_path: entity.poster_path,
            media_type: entity.media_type,
            popularity: entity.popularity || 50
          });
          existingIds.add(entityId);
          updated = true;
        }
      });
      
      // Update session storage if we added new entities
      if (updated) {
        sessionStorage.setItem('popularEntities', JSON.stringify(entities));
      }
    } catch (error) {
      console.error('Error updating local entity database:', error);
    }
  };
  
  /**
   * Use the suggested spelling correction
   * @param {function} handleSearch - Function to perform search
   * @returns {Promise<void>} - Promise that resolves when search is complete
   */
  const useSpellingCorrection = async (handleSearch) => {
    if (!didYouMean || !handleSearch) return;
    
    // If didYouMean is a string, use it directly
    if (typeof didYouMean === 'string') {
      await handleSearch(didYouMean);
    } 
    // If didYouMean is an object (entity from string similarity)
    else if (typeof didYouMean === 'object' && didYouMean !== null) {
      // Use the name or title depending on media type
      const searchTerm = getItemTitle(didYouMean);
      console.log(`Using spelling correction with entity: ${searchTerm} (${didYouMean.media_type})`);
      await handleSearch(searchTerm);
    }
  };

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
    if (!node || !node.data || !fetchNodeConnectionsCallback) return;
    
    try {
      // Get all possible connections for this node
      const connections = await fetchNodeConnectionsCallback(node);
      
      // Add these connections to our connectable entities list
      if (connections && connections.length > 0) {
        setConnectableEntities(prev => {
          const updated = [...prev];
          const existingIds = new Set(prev.map(e => `${e.media_type}-${e.id}`));
          
          // Add new connectable entities that aren't already in the list
          connections.forEach(entity => {
            if (!entity || !entity.id || !entity.media_type) return;
            
            const entityId = `${entity.media_type}-${entity.id}`;
            if (!existingIds.has(entityId)) {
              updated.push(entity);
              existingIds.add(entityId);
            }
          });
          
          return updated;
        });
      }
    } catch (error) {
      console.error('Error updating connectable entities:', error);
    }
  };

  // Add a function to update connectable entities with TV shows where an actor appears
  const updateConnectableEntitiesWithActorShows = (actorDetails) => {
    if (!actorDetails) return;
    
    // Get existing connectable entities
    const newConnectableEntities = addActorTvShowsToConnectableEntities(
      actorDetails, 
      connectableEntities
    );
    
    if (newConnectableEntities.length > 0) {
      // Update the state with new entities
      setConnectableEntities(prevEntities => [
        ...prevEntities, 
        ...newConnectableEntities
      ]);
      
      console.log(`Added ${newConnectableEntities.length} TV shows from actor ${actorDetails.name}`);
    }
  };

  /**
   * Process an actor's data to extract all TV shows they've appeared in (including guest appearances)
   * and add them to the connectable entities list
   * @param {Object} actorData - Actor data object
   * @returns {Array} - Array of TV shows the actor has appeared in
   */
  const addActorTvShowsToConnectableEntities = (actorData) => {
    if (!actorData) return [];
    
    const allTvShows = [];
    
    // Process TV credits if available
    if (actorData.tv_credits && actorData.tv_credits.cast) {
      allTvShows.push(...actorData.tv_credits.cast.map(show => ({
        ...show,
        media_type: 'tv',
        connection_type: 'cast',
        from_actor_id: actorData.id,
        from_actor_name: actorData.name
      })));
    }
    
    // Process guest appearances separately if they exist
    if (actorData.guest_appearances && Array.isArray(actorData.guest_appearances)) {
      const guestShows = actorData.guest_appearances.map(show => ({
        ...show,
        media_type: 'tv',
        is_guest_appearance: true,
        connection_type: 'guest',
        from_actor_id: actorData.id,
        from_actor_name: actorData.name
      }));
      
      // Filter out duplicates by checking if the show ID already exists in allTvShows
      const existingShowIds = new Set(allTvShows.map(show => show.id));
      const uniqueGuestShows = guestShows.filter(show => !existingShowIds.has(show.id));
      
      allTvShows.push(...uniqueGuestShows);
    }
    
    // If the TV credits contain guest appearances (marked with a flag)
    if (actorData.tv_credits && actorData.guest_appearances_added) {
      // Ensure we're properly marking any guest appearances in the tv_credits
      allTvShows.forEach(show => {
        if (show.credit_id && show.credit_id.includes('guest') || 
            (show.character && show.character.toLowerCase().includes('guest'))) {
          show.is_guest_appearance = true;
          show.connection_type = 'guest';
        }
      });
    }
    
    // Filter for unique TV shows and those with poster images
    const uniqueShows = Array.from(
      new Map(allTvShows.map(show => [show.id, show])).values()
    ).filter(show => show.poster_path);
    
    // Add these TV shows to the connectable entities list
    setConnectableEntities(prev => {
      // Check for duplicates before adding
      const existingShowIds = new Set(prev
        .filter(entity => entity.media_type === 'tv')
        .map(entity => entity.id));
      
      const newShows = uniqueShows.filter(show => !existingShowIds.has(show.id));
      
      if (newShows.length > 0) {
        console.log(`Adding ${newShows.length} TV shows from actor ${actorData.name} to connectable entities`);
        return [...prev, ...newShows];
      }
      
      return prev;
    });
    
    return uniqueShows;
  };

  return {
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
    useSpellingCorrection,
    searchStartActors,
    updateConnectableEntitiesForNode,
    addActorTvShowsToConnectableEntities
  };
};