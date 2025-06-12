/**
 * Firebase Studio Cache Service
 * 
 * Manages studio data loading from Firebase with fallback to TMDB prefetching.
 * Integrates with TieredStudioCache for instant loading and comprehensive cleanup.
 * 
 * Features:
 * - Firebase studio data loading (3 seconds vs 10 minutes)
 * - Search index for direct, partial, and fuzzy matching
 * - Automatic stale data updates in background
 * - Complete cleanup integration
 * - Fallback to existing TMDB prefetch system
 */

import studioCache from '../utils/studioCache';
import { fetchPopularEntities } from './tmdbService';
import { logger } from '../utils/loggerUtils';
import { stringSimilarity } from '../utils/stringUtils';
import config from '../config/api.config';

class FirebaseStudioCache {
  constructor() {
    this.initialized = false;
    this.loading = false;
    this.searchIndex = new Map();    this.abortController = null;
    this.pendingRequests = new Set();
    this.companies = new Map(); // Changed from studios to companies
    this.lastUpdated = null;
    this.version = null;
    
    // Events
    this.eventListeners = new Map();
      // Company configuration - matches server-side COMPANIES array
    this.companyConfig = [
      { id: 420, name: 'Marvel Studios', key: 'marvel' },
      { id: 7505, name: 'Marvel Entertainment', key: 'marvel_entertainment' },
      { id: 2, name: 'Walt Disney Pictures', key: 'disney' },
      { id: 6125, name: 'Walt Disney Animation Studios', key: 'disney_animation' },
      { id: 9993, name: 'DC Entertainment', key: 'dc' },
      { id: 429, name: 'DC Comics', key: 'dc_comics' },
      { id: 1, name: 'Lucasfilm', key: 'lucasfilm' },
      { id: 3, name: 'Pixar Animation Studios', key: 'pixar' },
      { id: 33, name: 'Universal Pictures', key: 'universal' },
      { id: 4, name: 'Paramount Pictures', key: 'paramount' }
    ];
  }

  /**
   * Initialize studio cache from Firebase
   * Main entry point for studio data loading
   */
  async initializeFromFirebase() {
    if (this.loading) {
      logger.debug('🔄 Firebase initialization already in progress');
      return;
    }

    this.loading = true;
    logger.time('firebase-studio-init');
    logger.info('🚀 Initializing studio cache from Firebase...');

    try {
      // Register cleanup handlers before loading
      this.registerGlobalCleanupHandlers();
      
      // Load studio data from Firebase
      const firebaseData = await this.loadStudioDataFromFirebase();
      
      if (firebaseData && this.isDataFresh(firebaseData)) {
        // Process and populate cache with Firebase data
        await this.processFirebaseData(firebaseData);
          // Emit ready event
        this.emitEvent('gameReadyToPlay', {
          source: 'firebase',
          itemCount: this.companies.size,
          searchTerms: this.searchIndex.size
        });
        
        logger.timeEnd('firebase-studio-init');
        logger.info(`✅ Firebase studio cache ready: ${this.companies.size} items, ${this.searchIndex.size} search terms`);
        
      } else {
        // Data is stale or missing, update in background
        logger.warn('📊 Firebase data is stale or missing, falling back to TMDB');
        await this.fallbackToTmdbPrefetch();
        
        // Trigger background update
        this.updateStaleData();
      }
      
    } catch (error) {
      logger.error('❌ Firebase initialization failed:', error);
      await this.fallbackToTmdbPrefetch();
    } finally {
      this.loading = false;
      this.initialized = true;
    }
  }

  /**
   * Load studio data from Firebase API
   */
  async loadStudioDataFromFirebase() {
    try {
      // Create abort controller for request cancellation
      this.abortController = new AbortController();
      
      const url = `${config.backend.baseUrl}/api/firebase/studio-cache`;
      logger.debug(`📡 Fetching studio data from: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`Firebase API responded with status: ${response.status}`);
      }

      const data = await response.json();
        if (!data || !data.companies) {
        throw new Error('Invalid Firebase response structure');
      }

      logger.info(`📦 Loaded Firebase data: version ${data.version}, ${Object.keys(data.companies).length} companies`);
      return data;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        logger.debug('📡 Firebase request aborted');
        return null;
      }
      
      logger.error('🔥 Firebase load error:', error);
      throw error;
    }
  }

  /**
   * Process Firebase data and populate cache
   */
  async processFirebaseData(data) {
    try {
      logger.debug('🔄 Processing Firebase studio data...');
      
      this.version = data.version;
      this.lastUpdated = data.lastUpdated;
        // Clear existing data
      this.companies.clear();
      this.searchIndex.clear();
      
      let totalItems = 0;
      
      // Process each company (changed from studio)
      for (const [companyKey, companyData] of Object.entries(data.companies)) {
        const companyName = this.getCompanyName(companyKey); // Changed method name
        
        if (companyData.items && Array.isArray(companyData.items)) {
          // Store company items
          this.companies.set(companyKey, companyData.items);
          
          // Process each item for search and cache
          for (const item of companyData.items) {
            // Add company information (changed from studio)
            const enhancedItem = {
              ...item,
              company: companyName, // Changed from studio
              companyKey: companyKey // Changed from studioKey
            };            
            // Store in tiered cache
            const cacheKey = `company-${item.media_type}-${item.id}`; // Changed prefix
            studioCache.set(cacheKey, enhancedItem, 'warm');
            
            // Build search index
            this.addToSearchIndex(enhancedItem);
            totalItems++;
          }
        }
      }
      
      // Process search index from Firebase if available
      if (data.searchIndex) {
        for (const [searchTerm, itemPaths] of Object.entries(data.searchIndex)) {
          if (!this.searchIndex.has(searchTerm.toLowerCase())) {
            this.searchIndex.set(searchTerm.toLowerCase(), itemPaths);
          }
        }
      }
      
      logger.info(`✅ Processed ${totalItems} company items across ${this.companies.size} companies`); // Updated log message
      
    } catch (error) {
      logger.error('❌ Error processing Firebase data:', error);
      throw error;
    }
  }

  /**
   * Add item to search index with multiple search terms
   */
  addToSearchIndex(item) {
    const title = item.title || item.name;
    if (!title) return;
      const itemPath = `${item.companyKey}.${item.id}`; // Changed from studioKey
    const searchTerms = this.extractSearchTerms(title);
    
    searchTerms.forEach(term => {
      const normalizedTerm = term.toLowerCase();
      if (!this.searchIndex.has(normalizedTerm)) {
        this.searchIndex.set(normalizedTerm, []);
      }
      this.searchIndex.get(normalizedTerm).push(itemPath);
    });
  }

  /**
   * Extract search terms from title (full title + words + abbreviations)
   */
  extractSearchTerms(title) {
    const terms = [title]; // Full title
    
    // Split into words
    const words = title.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    terms.push(...words);
    
    // Create abbreviations for multi-word titles
    if (words.length > 1) {
      const abbreviation = words.map(word => word[0]).join('');
      if (abbreviation.length > 1) {
        terms.push(abbreviation);
      }
    }
    
    // Special cases for common variations
    if (title.toLowerCase().includes('captain america')) {
      terms.push('cap');
    }
    if (title.toLowerCase().includes('iron man')) {
      terms.push('ironman');
    }
    
    return terms;
  }

  /**
   * Search with Firebase cache using multiple strategies
   */
  searchWithFirebaseCache(query) {
    if (!this.initialized || !query || query.trim().length < 2) {
      return [];
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    const results = [];
    
    // Strategy 1: Direct match
    if (this.searchIndex.has(normalizedQuery)) {
      const directMatches = this.getItemsByPaths(this.searchIndex.get(normalizedQuery));
      results.push(...directMatches);
      
      if (results.length > 0) {
        logger.debug(`🎯 Direct search hit for "${query}": ${results.length} results`);
        return this.rankSearchResults(results, query);
      }
    }
    
    // Strategy 2: Partial match (starts with)
    for (const [term, paths] of this.searchIndex.entries()) {
      if (term.startsWith(normalizedQuery) || normalizedQuery.includes(term)) {
        const partialMatches = this.getItemsByPaths(paths);
        results.push(...partialMatches);
      }
    }
    
    if (results.length > 0) {
      logger.debug(`🔍 Partial search hit for "${query}": ${results.length} results`);
      return this.rankSearchResults(results, query);
    }
    
    // Strategy 3: Fuzzy match (similarity threshold)
    const fuzzyResults = [];
    for (const [term, paths] of this.searchIndex.entries()) {
      const similarity = stringSimilarity(normalizedQuery, term);
      if (similarity > 0.7) { // 70% similarity threshold
        const fuzzyMatches = this.getItemsByPaths(paths);
        fuzzyMatches.forEach(item => {
          fuzzyResults.push({ ...item, _similarity: similarity });
        });
      }
    }
    
    if (fuzzyResults.length > 0) {
      logger.debug(`🔀 Fuzzy search hit for "${query}": ${fuzzyResults.length} results`);
      return fuzzyResults
        .sort((a, b) => b._similarity - a._similarity)
        .slice(0, 20)
        .map(item => {
          const { _similarity, ...cleanItem } = item;
          return cleanItem;
        });
    }
    
    logger.debug(`❌ No Firebase cache results for "${query}"`);
    return [];
  }
  /**
   * Get items by their index paths
   */
  getItemsByPaths(paths) {
    const items = [];
    
    for (const path of paths) {
      const [companyKey, itemId] = path.split('.'); // Changed from studioKey
      const companyItems = this.companies.get(companyKey); // Changed from studios
      
      if (companyItems) {
        const item = companyItems.find(item => item.id.toString() === itemId);
        if (item) {
          items.push({
            ...item,
            company: this.getCompanyName(companyKey), // Changed from studio/getStudioName
            companyKey: companyKey // Changed from studioKey
          });
        }
      }
    }
    
    return items;
  }

  /**
   * Rank search results by relevance
   */
  rankSearchResults(results, query) {
    const normalizedQuery = query.toLowerCase();
    
    return results
      .map(item => {
        const title = (item.title || item.name || '').toLowerCase();
        let score = 0;
        
        // Exact title match gets highest score
        if (title === normalizedQuery) score += 100;
        // Title starts with query
        else if (title.startsWith(normalizedQuery)) score += 50;
        // Title contains query
        else if (title.includes(normalizedQuery)) score += 25;
        
        // Boost by popularity
        score += (item.popularity || 0) * 0.1;
        
        // Boost recent releases
        const releaseYear = new Date(item.release_date || item.first_air_date || 0).getFullYear();
        if (releaseYear > 2020) score += 10;
        
        return { ...item, _score: score };
      })
      .sort((a, b) => b._score - a._score)
      .slice(0, 20)
      .map(item => {
        const { _score, ...cleanItem } = item;
        return cleanItem;
      });
  }

  /**
   * Check if Firebase data is fresh (< 7 days old)
   */
  isDataFresh(data) {
    if (!data.lastUpdated) return false;
    
    const lastUpdate = new Date(data.lastUpdated);
    const now = new Date();
    const daysSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24);
    
    return daysSinceUpdate < 7;
  }
  /**
   * Get company name by key
   */
  getCompanyName(companyKey) {
    const company = this.companyConfig.find(c => c.key === companyKey);
    return company ? company.name : 'Unknown Company';
  }

  /**
   * Fallback to existing TMDB prefetch system
   */
  async fallbackToTmdbPrefetch() {
    try {
      logger.info('🔄 Falling back to TMDB prefetch system...');
      logger.time('tmdb-prefetch-fallback');
      
      const popularData = await fetchPopularEntities();
      
      if (popularData) {
        // Process and cache popular entities
        let totalCached = 0;
        
        if (popularData.movies) {
          popularData.movies.forEach(movie => {
            const cacheKey = `popular-movie-${movie.id}`;
            studioCache.set(cacheKey, { ...movie, media_type: 'movie' }, 'warm');
            totalCached++;
          });
        }
        
        if (popularData.tvShows) {
          popularData.tvShows.forEach(show => {
            const cacheKey = `popular-tv-${show.id}`;
            studioCache.set(cacheKey, { ...show, media_type: 'tv' }, 'warm');
            totalCached++;
          });
        }
        
        if (popularData.people) {
          popularData.people.forEach(person => {
            const cacheKey = `popular-person-${person.id}`;
            studioCache.set(cacheKey, { ...person, media_type: 'person' }, 'warm');
            totalCached++;
          });
        }
        
        logger.timeEnd('tmdb-prefetch-fallback');
        logger.info(`✅ TMDB fallback complete: ${totalCached} items cached`);
        
        // Emit ready event
        this.emitEvent('gameReadyToPlay', {
          source: 'tmdb-fallback',
          itemCount: totalCached
        });
      }
      
    } catch (error) {
      logger.error('❌ TMDB fallback failed:', error);
    }
  }

  /**
   * Update stale data in background
   */
  async updateStaleData() {
    try {
      logger.info('🔄 Triggering background studio cache update...');
      
      const url = `${config.backend.baseUrl}/api/firebase/refresh-studio-cache`;
      
      // Non-blocking request
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trigger: 'stale-data' })
      }).catch(error => {
        logger.warn('Background update request failed:', error);
      });
      
    } catch (error) {
      logger.warn('Failed to trigger background update:', error);
    }
  }

  /**
   * EVENT MANAGEMENT
   */

  /**
   * Add event listener
   */
  addEventListener(event, listener) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event, listener) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to all listeners
   */
  emitEvent(event, data = null) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          logger.warn(`Event listener error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * CLEANUP METHODS
   */

  /**
   * Register global cleanup handlers for Firebase-specific cleanup
   */
  registerGlobalCleanupHandlers() {
    const firebaseCleanup = () => this.cleanupFirebaseData();
    
    window.addEventListener('beforeunload', firebaseCleanup);
    window.addEventListener('unload', firebaseCleanup);
    window.addEventListener('pagehide', firebaseCleanup);
    
    logger.debug('🎧 Registered Firebase cleanup handlers');
  }
  /**
   * Cleanup Firebase-specific data
   */
  cleanupFirebaseData() {
    logger.debug('🧹 Cleaning up Firebase company cache data');
    
    // Cancel pending requests
    this.cancelPendingRequests();
    
    // Clear internal data structures
    this.companies.clear(); // Changed from studios
    this.searchIndex.clear();
    this.eventListeners.clear();
    this.pendingRequests.clear();
    
    // Reset state
    this.initialized = false;
    this.loading = false;
    this.lastUpdated = null;
    this.version = null;
  }

  /**
   * Cancel all pending requests
   */
  cancelPendingRequests() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    
    this.pendingRequests.forEach(request => {
      if (request && typeof request.abort === 'function') {
        request.abort();
      }
    });
    
    this.pendingRequests.clear();
  }
  /**
   * Get cache statistics
   */
  getStats() {
    return {
      initialized: this.initialized,
      loading: this.loading,
      companiesLoaded: this.companies.size, // Changed from studiosLoaded
      searchTerms: this.searchIndex.size,
      lastUpdated: this.lastUpdated,
      version: this.version,
      pendingRequests: this.pendingRequests.size
    };
  }

  /**
   * Check if a search query would hit the cache
   */
  canHandleSearch(query) {
    if (!this.initialized || !query) return false;
    
    const normalizedQuery = query.toLowerCase().trim();
    
    // Check direct match
    if (this.searchIndex.has(normalizedQuery)) return true;
    
    // Check partial matches
    for (const term of this.searchIndex.keys()) {
      if (term.startsWith(normalizedQuery) || normalizedQuery.includes(term)) {
        return true;
      }
    }
    
    return false;
  }
}

// Create singleton instance
const firebaseStudioCache = new FirebaseStudioCache();

export default firebaseStudioCache;
export { FirebaseStudioCache };
