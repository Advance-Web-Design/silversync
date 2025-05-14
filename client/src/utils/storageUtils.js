// Storage utilities for managing local/session storage and entity caching

/**
 * Load previous search terms from session storage
 * 
 * @returns {Array} - Array of previous search terms
 */
export const loadPreviousSearches = () => {
  try {
    const storedSearches = sessionStorage.getItem('previousSearches');
    return storedSearches ? JSON.parse(storedSearches) : [];
  } catch (error) {
    console.error('Error loading previous searches from session storage:', error);
    return [];
  }
};

/**
 * Load known entities from session storage
 * 
 * @returns {Array} - Array of known entities
 */
export const loadKnownEntities = () => {
  try {
    const storedEntities = sessionStorage.getItem('knownEntities');
    return storedEntities ? JSON.parse(storedEntities) : [];
  } catch (error) {
    console.error('Error loading known entities from session storage:', error);
    return [];
  }
};

/**
 * Save previous searches to session storage
 * 
 * @param {Array} searches - Array of search terms
 */
export const savePreviousSearches = (searches) => {
  if (searches && searches.length > 0) {
    try {
      sessionStorage.setItem('previousSearches', JSON.stringify(searches));
    } catch (error) {
      console.error('Error saving previous searches to session storage:', error);
    }
  }
};

/**
 * Save known entities to session storage
 * 
 * @param {Array} entities - Array of entity objects
 */
export const saveKnownEntities = (entities) => {
  if (entities && entities.length > 0) {
    try {
      sessionStorage.setItem('knownEntities', JSON.stringify(entities));
    } catch (error) {
      console.error('Error saving known entities to session storage:', error);
    }
  }
};

/**
 * Update local entity database with new entities
 * 
 * @param {Array} results - New search results to add
 * @returns {boolean} - Whether the database was updated
 */
export const updateLocalEntityDatabase = (results) => {
  if (!results || results.length === 0) return false;
  
  try {
    const storedEntities = sessionStorage.getItem('popularEntities');
    let entities = storedEntities ? JSON.parse(storedEntities) : [];
    let updated = false;
    
    // Create a set of existing entity IDs for fast lookup
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
    
    // Save back to storage if updated
    if (updated) {
      sessionStorage.setItem('popularEntities', JSON.stringify(entities));
    }
    
    return updated;
  } catch (error) {
    console.error('Error updating local entity database:', error);
    return false;
  }
};

/**
 * Add a search term and its results to history
 * 
 * @param {string} term - Search term
 * @param {Array} results - Search results
 * @param {Function} setPreviousSearches - State setter for previous searches
 * @param {Function} setKnownEntities - State setter for known entities
 */
export const addToSearchHistory = (
  term,
  results,
  setPreviousSearches,
  setKnownEntities
) => {
  if (!term || !results || results.length === 0) return;
  
  // Add the term to previous searches
  setPreviousSearches(prev => {
    if (!prev.includes(term.toLowerCase())) {
      return [...prev, term.toLowerCase()];
    }
    return prev;
  });
  
  // Add the entities to known entities
  setKnownEntities(prev => {
    const updatedEntities = [...prev];
    const existingIds = new Set();
    
    // Collect existing IDs to avoid duplicates
    prev.forEach(entity => {
      if (typeof entity === 'object' && entity !== null && entity.id) {
        existingIds.add(`${entity.media_type}-${entity.id}`);
      }
    });
    
    // Add new entities
    results.forEach(entity => {
      const entityId = `${entity.media_type}-${entity.id}`;
      if (!existingIds.has(entityId)) {
        updatedEntities.push(entity);
        existingIds.add(entityId);
      }
    });
    
    return updatedEntities;
  });
  
  // Update local entity database
  updateLocalEntityDatabase(results);
};