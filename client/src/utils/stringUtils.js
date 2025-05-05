/**
 * String utility functions for text comparison and matching
 */

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string to compare
 * @param {string} str2 - Second string to compare
 * @returns {number} - Levenshtein distance value
 */
export const levenshteinDistance = (str1, str2) => {
  const track = Array(str2.length + 1).fill(null).map(() => 
    Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + cost, // substitution,
      );
    }
  }
  
  return track[str2.length][str1.length];
};

/**
 * Calculate similarity between two strings (0-1 value)
 * @param {string} str1 - First string to compare
 * @param {string} str2 - Second string to compare
 * @returns {number} - Similarity score (0-1)
 */
export const stringSimilarity = (str1, str2) => {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;
  
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLength;
};

/**
 * Get consistent title from different media types
 * @param {Object} item - Media item (movie, TV show, or person)
 * @returns {string} - Title or name of the item
 */
export const getItemTitle = (item) => {
  if (!item) return '';
  
  // Check media_type (API format) or type (internal format)
  const type = item.media_type || item.type;
  
  if (type === 'movie') return item.title || '';
  if (type === 'tv') return item.name || '';
  if (type === 'person') return item.name || '';
  
  // Fallbacks if type is not available
  if (item.title) return item.title;
  if (item.name) return item.name;
  
  return '';
};