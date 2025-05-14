// Search-related utility functions for string matching and entity comparison
import { stringSimilarity, getItemTitle } from './stringUtils';
import { SIMILARITY_THRESHOLDS } from './constants';

/**
 * Common words to ignore in search processing
 */
export const COMMON_WORDS = ['the', 'and', 'movie', 'show', 'actor', 'star', 'film'];

/**
 * Check for possible misspellings based on known terms using string comparison
 * Prioritizes connectable entities that might match the user's input
 * 
 * @param {string} term - Term to check for misspellings
 * @param {Array} connectableEntities - List of entities that can be connected to the board
 * @param {Array} knownEntities - List of known entities from previous searches
 * @param {Array} previousSearches - List of previous search terms
 * @param {Object} connectableItems - Map of items that are connectable (by ID)
 * @returns {Object|null} - Suggested entity or null
 */
export const checkForMisspelling = (
  term,
  connectableEntities = [],
  knownEntities = [],
  previousSearches = [],
  connectableItems = {}
) => {
  if (!term || term.trim().length < 3) return null;
  
  const normalizedTerm = term.toLowerCase().trim();
  
  // Skip common words
  if (COMMON_WORDS.includes(normalizedTerm)) return null;
  
  // Different thresholds based on context
  const CONNECTABLE_THRESHOLD = SIMILARITY_THRESHOLDS.SUGGESTION - 0.08;
  const NORMAL_THRESHOLD = SIMILARITY_THRESHOLDS.SUGGESTION;
  
  // Check for partial matches in connectable entities
  const partialMatch = findPartialMatch(normalizedTerm, connectableEntities, connectableItems);
  if (partialMatch) return partialMatch;
  
  // Prepare lists of entities for similarity checking
  const allEntities = prepareEntityList(
    connectableEntities,
    knownEntities,
    previousSearches,
    connectableItems,
    CONNECTABLE_THRESHOLD,
    NORMAL_THRESHOLD
  );
  
  // Find best match based on similarity
  return findBestMatch(normalizedTerm, allEntities, connectableEntities, knownEntities, connectableItems);
};

/**
 * Find partial matches in connectable entities
 * 
 * @param {string} normalizedTerm - Normalized search term
 * @param {Array} connectableEntities - List of connectable entities
 * @param {Object} connectableItems - Map of connectable items by ID
 * @returns {Object|null} - Best partial match or null
 */
const findPartialMatch = (normalizedTerm, connectableEntities, connectableItems) => {
  const partialMatches = [];
  
  connectableEntities.forEach(entity => {
    const entityTitle = getItemTitle(entity).toLowerCase();
    
    if (entityTitle.includes(normalizedTerm) || normalizedTerm.includes(entityTitle)) {
      const matchPercentage = Math.min(
        normalizedTerm.length / entityTitle.length,
        entityTitle.length / normalizedTerm.length
      );
      
      if (matchPercentage > 0.5) {
        partialMatches.push({
          entity,
          matchScore: matchPercentage * 0.9
        });
      }
    }
  });
  
  if (partialMatches.length > 0) {
    partialMatches.sort((a, b) => b.matchScore - a.matchScore);
    const bestPartialMatch = partialMatches[0];
    
    if (bestPartialMatch.matchScore > 0.7) {
      const result = bestPartialMatch.entity;
      const itemKey = `${result.media_type}-${result.id}`;
      result.isConnectable = connectableItems[itemKey] === true;
      return result;
    }
  }
  
  return null;
};

/**
 * Prepare a consolidated list of entities for similarity comparison
 * 
 * @param {Array} connectableEntities - List of connectable entities
 * @param {Array} knownEntities - List of known entities
 * @param {Array} previousSearches - List of previous search terms
 * @param {Object} connectableItems - Map of connectable items
 * @param {number} connectableThreshold - Threshold for connectable items
 * @param {number} normalThreshold - Threshold for normal items
 * @returns {Array} - Consolidated list of entities with thresholds
 */
const prepareEntityList = (
  connectableEntities,
  knownEntities,
  previousSearches,
  connectableItems,
  connectableThreshold,
  normalThreshold
) => {
  const allEntities = [];
  
  // Prioritize connectable entities - they get a lower threshold
  connectableEntities.forEach(entity => {
    const name = getItemTitle(entity);
    allEntities.push({
      name: name,
      entity: entity,
      isConnectable: true,
      threshold: connectableThreshold
    });
  });
  
  // Add known entities with appropriate threshold
  knownEntities.forEach(entity => {
    if (typeof entity !== 'string') {
      const name = getItemTitle(entity);
      const isConnectable = connectableItems[`${entity.media_type}-${entity.id}`];
      const threshold = isConnectable ? connectableThreshold : normalThreshold;
      
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
        threshold: normalThreshold
      });
    }
  });
  
  return allEntities;
};

/**
 * Find the best match based on string similarity
 * 
 * @param {string} normalizedTerm - Normalized search term
 * @param {Array} allEntities - List of all entities to compare
 * @param {Array} connectableEntities - List of connectable entities
 * @param {Array} knownEntities - List of known entities
 * @param {Object} connectableItems - Map of connectable items
 * @returns {Object|null} - Best match or null
 */
const findBestMatch = (
  normalizedTerm,
  allEntities,
  connectableEntities,
  knownEntities,
  connectableItems
) => {
  let bestMatch = null;
  let highestSimilarity = 0;
  
  // Check all names for similarity
  for (const item of allEntities) {
    // Skip very short names or common words
    if (item.name.length < 3 || COMMON_WORDS.includes(item.name.toLowerCase())) continue;
    
    const similarity = stringSimilarity(normalizedTerm, item.name.toLowerCase());
    
    // Check against the appropriate threshold
    if (similarity > item.threshold && similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = item.entity;
    }
  }
  
  // If string match but not full entity
  if (bestMatch && typeof bestMatch === 'string') {
    // Find the full entity in lists
    const entityMatch = [...connectableEntities, ...knownEntities].find(entity => 
      typeof entity !== 'string' && getItemTitle(entity).toLowerCase() === bestMatch.toLowerCase()
    );
    
    if (entityMatch) {
      bestMatch = entityMatch;
    }
  }
  
  // Add connectability flag
  if (bestMatch && typeof bestMatch === 'object' && bestMatch.media_type) {
    const itemKey = `${bestMatch.media_type}-${bestMatch.id}`;
    bestMatch.isConnectable = connectableItems[itemKey] === true;
  }
  
  return bestMatch;
};

/**
 * Find exact match from search results
 * 
 * @param {Array} results - Search results array
 * @param {string} term - Search term
 * @returns {Object|null} - Exact match object or null
 */
export const findExactMatch = (results, term) => {
  if (!term || !results || results.length === 0) return null;
  
  const normalizedTerm = term.toLowerCase().trim();
  
  // Perfect match (case insensitive)
  const perfectMatch = findPerfectMatch(results, normalizedTerm);
  if (perfectMatch) return perfectMatch;
  
  // Partial word match
  const partialMatch = findPartialWordMatch(results, normalizedTerm);
  if (partialMatch) return partialMatch;
  
  // Single word match
  if (!normalizedTerm.includes(' ')) {
    const singleWordMatch = findSingleWordMatch(results, normalizedTerm);
    if (singleWordMatch) return singleWordMatch;
  }
  
  // Similarity-based match
  return findSimilarityMatch(results, normalizedTerm);
};

/**
 * Find perfect match (exact title match)
 */
const findPerfectMatch = (results, normalizedTerm) => {
  for (const item of results) {
    const itemTitle = getItemTitle(item).toLowerCase().trim();
    if (itemTitle === normalizedTerm) {
      return item;
    }
  }
  return null;
};

/**
 * Find partial word match (search term is part of title or vice versa)
 */
const findPartialWordMatch = (results, normalizedTerm) => {
  for (const item of results) {
    const itemTitle = getItemTitle(item).toLowerCase().trim();
    
    if (itemTitle.includes(normalizedTerm) || normalizedTerm.includes(itemTitle)) {
      const searchTermWords = normalizedTerm.split(' ');
      const titleWords = itemTitle.split(' ');
      
      // For short search terms (1-2 words)
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
        
        // If more than 75% of the words match
        if (matchingWords >= searchTermWords.length * 0.75) {
          return item;
        }
      }
    }
  }
  return null;
};

/**
 * Find single word match (exact match with first or last word)
 */
const findSingleWordMatch = (results, normalizedTerm) => {
  for (const item of results) {
    const itemTitle = getItemTitle(item).toLowerCase().trim();
    const titleWords = itemTitle.split(' ');
    
    if (titleWords[0] === normalizedTerm || titleWords[titleWords.length - 1] === normalizedTerm) {
      return item;
    }
  }
  return null;
};

/**
 * Find match based on string similarity
 */
const findSimilarityMatch = (results, normalizedTerm) => {
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