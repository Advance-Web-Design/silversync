// Storage utilities for managing local/session storage and entity caching
import { logger } from './loggerUtils';

/**
 * Load previous search terms from session storage
 */
export const loadPreviousSearches = () => {
  try {
    const storedSearches = sessionStorage.getItem('previousSearches');
    return storedSearches ? JSON.parse(storedSearches) : [];
  } catch (error) {
    logger.error('Error loading previous searches:', error);
    return [];
  }
};

/**
 * Load known entities from session storage
 */
export const loadKnownEntities = () => {
  try {
    const storedEntities = sessionStorage.getItem('knownEntities');
    return storedEntities ? JSON.parse(storedEntities) : [];
  } catch (error) {
    logger.error('Error loading known entities:', error);
    return [];
  }
};

/**
 * Save previous searches to session storage
 */
export const savePreviousSearches = (searches) => {
  if (searches && searches.length > 0) {
    try {
      sessionStorage.setItem('previousSearches', JSON.stringify(searches));
    } catch (error) {
      logger.error('Error saving previous searches:', error);
    }
  }
};

/**
 * Save known entities to session storage
 */
export const saveKnownEntities = (entities) => {
  if (entities && entities.length > 0) {
    try {
      sessionStorage.setItem('knownEntities', JSON.stringify(entities));
    } catch (error) {
      logger.error('Error saving known entities:', error);
    }
  }
};

/**
 * Update local entity database with new entities
 */
export const updateLocalEntityDatabase = (results) => {
  if (!results || results.length === 0) return false;
  
  try {
    const storedEntities = sessionStorage.getItem('popularEntities');
    let entities = storedEntities ? JSON.parse(storedEntities) : [];
    let updated = false;
    
    const existingIds = new Set(
      entities.map(entity => `${entity.media_type}-${entity.id}`)
    );
    
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
    
    if (updated) {
      sessionStorage.setItem('popularEntities', JSON.stringify(entities));
    }
    
    return updated;
  } catch (error) {
    logger.error('Error updating local entity database:', error);
    return false;
  }
};

/**
 * Add a search term and its results to history
 */
export const addToSearchHistory = (term, results, setPreviousSearches, setKnownEntities) => {
  if (!term || !results || results.length === 0) return;
  
  setPreviousSearches(prev => {
    if (!prev.includes(term.toLowerCase())) {
      return [...prev, term.toLowerCase()];
    }
    return prev;
  });
  
  setKnownEntities(prev => {
    const updatedEntities = [...prev];
    const existingIds = new Set();
    
    prev.forEach(entity => {
      if (typeof entity === 'object' && entity !== null && entity.id) {
        existingIds.add(`${entity.media_type}-${entity.id}`);
      }
    });
    
    results.forEach(entity => {
      const entityId = `${entity.media_type}-${entity.id}`;
      if (!existingIds.has(entityId)) {
        updatedEntities.push(entity);
        existingIds.add(entityId);
      }
    });
    
    return updatedEntities;
  });
  
  updateLocalEntityDatabase(results);
};

/**
 * Compress studio item for storage (60% size reduction)
 */
export const compressStudioItem = (item, details = null) => {
  if (!item) return null;
  
  return {
    id: item.id,
    title: item.title || item.name,
    poster_path: item.poster_path,
    media_type: item.media_type,
    popularity: item.popularity,
    release_date: item.release_date || item.first_air_date,
    vote_average: item.vote_average,
    studio: item.studio,
    company: item.company,
    cast: item.cast || (details?.cast ? details.cast.slice(0, 50) : [])
  };
};

/**
 * Load all studio cache items from session storage
 */
export const loadStudioCacheFromSession = () => {
  const cacheData = new Map();
  const keys = Object.keys(sessionStorage).filter(key => key.startsWith('studio-cache-'));
  
  for (const key of keys) {
    try {
      const stored = sessionStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        if (data?.data) {
          const cacheKey = key.replace('studio-cache-', '');
          cacheData.set(cacheKey, data.data);
        }
      }
    } catch (error) {
      // Skip corrupted entries
    }
  }
  
  return cacheData;
};

/**
 * Save studio cache item to session storage
 */
export const saveStudioCacheItem = (key, data) => {
  try {
    const compressed = compressStudioItem(data);
    sessionStorage.setItem(`studio-cache-${key}`, JSON.stringify({
      data: compressed,
      timestamp: Date.now()
    }));
  } catch (error) {
    // Fail silently
  }
};

/**
 * Get studio cache item from session storage
 */
export const getStudioCacheItem = (key) => {
  try {
    const stored = sessionStorage.getItem(`studio-cache-${key}`);
    if (stored) {
      const data = JSON.parse(stored);
      return data?.data || null;
    }
  } catch (error) {
    // Fail silently
  }
  return null;
};

/**
 * Clear all cache-related session storage
 */
export const clearAllCacheStorage = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (
        key.startsWith('studio-cache-') || 
        key.startsWith('company-cache-') ||
        key.startsWith('tmdb-cache-') ||
        key.startsWith('search-cache-')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    logger.debug('All cache storage cleared');
  } catch (error) {
    logger.error('Error clearing cache storage:', error);
  }
};

/**
 * Register cleanup handlers for app close only
 */
export const registerCacheCleanupHandlers = () => {
  window.addEventListener('beforeunload', clearAllCacheStorage);
  window.addEventListener('unload', clearAllCacheStorage);
  logger.debug('Cache cleanup handlers registered');
};