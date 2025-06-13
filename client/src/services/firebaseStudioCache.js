/**
 * Firebase Studio Cache Service
 * Fetches pre-processed cache from server API - no Firebase client needed.
 */

class FirebaseStudioCache extends EventTarget {
  constructor() {
    super();
    this.searchIndex = new Map();
    this.loaded = false;
  }

  async initializeFromFirebase() {
    if (this.loaded) return;
    
    try {
      // Fetch cache from server API
      const response = await fetch('/api/firebase/studio-cache');
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const studioData = await response.json();
      
      // Load cache directly from server response
      const { default: studioCache } = await import('../utils/studioCache');
      
      if (studioData['studio-cache']) {
        Object.entries(studioData['studio-cache']).forEach(([key, item]) => {
          studioCache.set(key, item, item.cache_tier || 'warm');
        });
      }

      if (studioData['search-index']) {
        this.searchIndex = new Map(Object.entries(studioData['search-index']));
      }

      this.loaded = true;
      this.dispatchEvent(new CustomEvent('gameReadyToPlay', { detail: { source: 'server-api' } }));
      
      console.log('✅ Studio cache loaded from server');
      
    } catch (error) {
      console.warn('Failed to load studio cache from server:', error);
    }
  }

  canHandleSearch(query) {
    return this.loaded && this.extractSearchTerms(query).some(term => this.searchIndex.has(term));
  }

  async searchWithFirebaseCache(query) {
    if (!this.loaded) return [];
    
    const cacheKeys = new Set();
    this.extractSearchTerms(query).forEach(term => {
      (this.searchIndex.get(term) || []).forEach(key => cacheKeys.add(key));
    });

    // Use dynamic import instead of require
    const { default: studioCache } = await import('../utils/studioCache');
    return Array.from(cacheKeys).map(key => studioCache.get(key)).filter(Boolean);
  }

  extractSearchTerms(query) {
    const terms = [query, ...query.toLowerCase().split(/\s+/).filter(w => w.length > 2)];
    
    // Special cases
    if (query.includes('iron man')) terms.push('stark');
    if (query.includes('spider man')) terms.push('parker');
    
    return [...new Set(terms)];
  }
}

export default new FirebaseStudioCache();