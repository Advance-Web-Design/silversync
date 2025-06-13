/**
 * Tiered Studio Cache System
 * 
 * A simplified 3-tier cache system for studio data:
 * - Hot Cache: Recently searched items, instant access
 * - Warm Cache: All studio content, fast access  
 * - Cold Cache + SessionStorage: Historical searches
 * 
 * Real-world performance (based on TMDB analysis):
 * - 540 total items across 10 major companies
 * - 2.96MB total size with full cast data
 * - 6KB average per item after compression
 * - Full dataset fits comfortably in Warm Cache
 * 
 * Features:
 * - Simple tier-based storage without smart eviction
 * - No size limits or LRU management for reduced overhead
 * - Cleanup handled by storageUtils.js on page close
 * - Company-based organization (Marvel, Disney, DC, etc.)
 */

import { sessionStorageManager } from './apiUtils';
import { logger } from './loggerUtils';

class TieredStudioCache {
  constructor() {
    // Cache tiers - simplified without size limits
    this.hotCache = new Map();          // Recently accessed, instant retrieval
    this.warmCache = new Map();         // All studio data, fast access
    this.coldStorage = new Map();       // Historical data (also in sessionStorage)
    
    this.loadFromSession();
  }

  /**
   * Load existing cache data from session storage
   */
  loadFromSession() {
    try {
      const keys = Object.keys(sessionStorage).filter(key => 
        key.startsWith('studio-cache-')
      );
      
      for (const key of keys) {
        const data = sessionStorageManager.get(key);
        if (data?.data) {
          const cacheKey = key.replace('studio-cache-', '');
          this.coldStorage.set(cacheKey, data.data);
        }
      }
      
      logger.debug(`Loaded ${keys.length} items from session storage`);
    } catch (error) {
      logger.warn('Error loading cache from session:', error);
    }
  }

  /**
   * Compress studio item for storage
   */
  compressStudioItem(item, details = null) {
    if (!item) return null;
    
    const compressed = {
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
    
    return compressed;
  }

  /**
   * Get item from cache, checking hot -> warm -> cold in order
   */
  get(key) {
    // Check hot cache first
    if (this.hotCache.has(key)) {
      logger.debug(`Cache HIT (hot): ${key}`);
      return this.hotCache.get(key);
    }
    
    // Check warm cache
    if (this.warmCache.has(key)) {
      logger.debug(`Cache HIT (warm): ${key}`);
      return this.warmCache.get(key);
    }
    
    // Check cold storage
    if (this.coldStorage.has(key)) {
      logger.debug(`Cache HIT (cold): ${key}`);
      return this.coldStorage.get(key);
    }
    
    // Check session storage as last resort
    const sessionItem = this.getFromSession(key);
    if (sessionItem) {
      logger.debug(`Cache HIT (session): ${key}`);
      return sessionItem;
    }
    
    logger.debug(`Cache MISS: ${key}`);
    return null;
  }

  /**
   * Set item in appropriate tier based on type
   */
  set(key, value, tier = 'auto') {
    const compressed = this.compressStudioItem(value);
    
    if (tier === 'auto') {
      // Auto-assign tier based on item type
      if (this.isRecentSearch(key)) {
        tier = 'hot';
      } else if (key.includes('company-') || key.includes('studio-')) {
        tier = 'warm';
      } else {
        tier = 'cold';
      }
    }
    
    switch (tier) {
      case 'hot':
        this.hotCache.set(key, compressed);
        logger.debug(`Cache SET (hot): ${key}`);
        break;
      case 'warm':
        this.warmCache.set(key, compressed);
        logger.debug(`Cache SET (warm): ${key}`);
        break;
      case 'cold':
        this.coldStorage.set(key, compressed);
        this.saveToSession(key, compressed);
        logger.debug(`Cache SET (cold): ${key}`);
        break;
    }
  }

  /**
   * Check if item exists in any tier
   */
  has(key) {
    return this.hotCache.has(key) || 
           this.warmCache.has(key) || 
           this.coldStorage.has(key) ||
           sessionStorage.getItem(`studio-cache-${key}`) !== null;
  }

  /**
   * Delete item from all tiers
   */
  delete(key) {
    this.hotCache.delete(key);
    this.warmCache.delete(key);
    this.coldStorage.delete(key);
    sessionStorage.removeItem(`studio-cache-${key}`);
    logger.debug(`Cache DELETE: ${key}`);
  }

  /**
   * Check if search term is recent (for hot cache placement)
   */
  isRecentSearch(key) {
    return key.includes('search-') && key.includes(Date.now().toString().slice(0, 8));
  }

  /**
   * Save item to session storage
   */
  saveToSession(key, data) {
    try {
      sessionStorageManager.set(`studio-cache-${key}`, {
        data,
        timestamp: Date.now()
      });
    } catch (error) {
      logger.warn('Failed to save to session storage:', error);
    }
  }

  /**
   * Get item from session storage
   */
  getFromSession(key) {
    try {
      const data = sessionStorageManager.get(`studio-cache-${key}`);
      return data?.data || null;
    } catch (error) {
      logger.error('Error getting from session storage:', error);
      return null;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const stats = {
      hot: this.hotCache.size,
      warm: this.warmCache.size,
      cold: this.coldStorage.size,
      total: this.hotCache.size + this.warmCache.size + this.coldStorage.size
    };
    
    logger.debug('Cache statistics:', stats);
    return stats;
  }
}

// Create singleton instance
const studioCache = new TieredStudioCache();

export default studioCache;
export { TieredStudioCache };