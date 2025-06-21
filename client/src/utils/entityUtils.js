// Entity-specific utility functions for handling people, movies, and TV shows
import { getPersonDetails, getMovieDetails, getTvShowDetails, findPersonGuestAppearances } from '../services/tmdbService';
import { 
  createConnectionIndex, 
  findPersonConnectionsOptimized, 
  findMovieConnectionsOptimized, 
  findTvShowConnectionsOptimized
} from './connectionOptimizer';
import { logger } from './loggerUtils';

/**
 * Gets a display title for any entity type
 * 
 * @param {Object} item - Entity item (person, movie, or TV show)
 * @returns {string} - Display title
 */
export const getItemTitle = (item) => {
  if (!item) return 'Unknown';
  if (item.media_type === 'person') return item.name;
  if (item.media_type === 'movie') return item.title;
  if (item.media_type === 'tv') return item.name;
  return item.title || item.name || 'Unknown';
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Checks if an actor appears in a TV show based on their credits
 * @param {Object} actorDetails - Actor details with tv_credits
 * @param {number} tvShowId - ID of the TV show to check
 * @returns {boolean} - Whether actor appears in the show
 */
function checkActorInTvCredits(actorDetails, tvShowId) {
  // Check regular TV credits
  if (actorDetails.tv_credits?.cast?.some(credit => credit.id === tvShowId)) {
    return true;
  }
  
  // Check guest appearances
  if (actorDetails.guest_appearances?.some(appearance => appearance.id === tvShowId)) {
    return true;
  }
  
  return false;
}

/**
 * Ensures actor has full details loaded, fetches if needed
 * @param {Object} actor - Actor object (may be partial)
 * @param {Function} getPersonDetailsFn - Function to fetch full details
 * @returns {Promise<Object>} - Full actor details
 */
async function ensureActorDetails(actor, getPersonDetailsFn) {
  if (!actor) return null;
  
  // If we already have the required data, return as-is
  if (actor.movie_credits?.cast && actor.tv_credits?.cast) {
    return actor;
  }
  
  // Otherwise fetch full details
  return await getPersonDetailsFn(actor.id);
}

/**
 * Maps credits array to entities with proper media_type and additional data
 * @param {Array} credits - Array of credits
 * @param {string} mediaType - Media type to assign
 * @param {Object} additionalData - Additional data to merge
 * @returns {Array} - Mapped entities
 */
function mapCreditsToEntities(credits, mediaType, additionalData = {}) {
  return credits.map(credit => ({
    ...credit,
    media_type: mediaType,
    ...additionalData
  }));
}

/**
 * Filters entities to only include those with required images
 * @param {Array} entities - Array of entities
 * @returns {Array} - Filtered entities with images
 */
function filterEntitiesWithImages(entities) {
  return entities.filter(item => {
    if (!item || !item.id) return false;
    if (item.media_type === 'person' && !item.profile_path) return false;
    if ((item.media_type === 'movie' || item.media_type === 'tv') && !item.poster_path) return false;
    return true;
  });
}

/**
 * Removes duplicate entities from an array based on media_type and id
 * @param {Array} entities - Array of entities
 * @returns {Array} - Array without duplicates
 */
function removeDuplicateEntities(entities) {
  const uniqueEntitiesMap = new Map();
  entities.forEach(item => {
    const key = `${item.media_type}-${item.id}`;
    uniqueEntitiesMap.set(key, item);
  });
  return Array.from(uniqueEntitiesMap.values());
}

/**
 * Checks if any starting actor appears in a movie's cast
 * @param {Object} movie - Movie to check
 * @param {Array} startingActors - Starting actors array
 * @param {Function} getMovieDetailsFn - Function to get movie details
 * @returns {Promise<boolean>} - Whether movie is connectable
 */
async function checkMovieConnectability(movie, startingActors, getMovieDetailsFn) {
  const details = await getMovieDetailsFn(movie.id);
  const cast = details.credits?.cast || [];
  
  const connected = cast.some(actor => 
    startingActors.some(startActor => startActor?.id === actor.id)
  );
  
  if (connected) {
    logger.debug(`✅ Movie "${getItemTitle(movie)}" is connectable - matching actor found in cast`);
  }
  return connected;
}

/**
 * Checks if any starting actor appears in a TV show
 * @param {Object} tvShow - TV show to check
 * @param {Array} startingActors - Starting actors array
 * @param {Function} getTvShowDetailsFn - Function to get TV show details
 * @param {Function} getPersonDetailsFn - Function to get person details
 * @returns {Promise<boolean>} - Whether TV show is connectable
 */
async function checkTvConnectability(tvShow, startingActors, getTvShowDetailsFn, getPersonDetailsFn) {
  const details = await getTvShowDetailsFn(tvShow.id);
  const cast = details.credits?.cast || [];
  
  // Check regular cast first
  if (cast.some(actor => startingActors.some(startActor => startActor?.id === actor.id))) {
    logger.debug(`✅ TV Show "${getItemTitle(tvShow)}" is connectable - actor found in regular cast`);
    return true;
  }
  
  // Check each starting actor's TV credits
  for (const startActor of startingActors) {
    if (!startActor) continue;
    
    const actorDetails = await ensureActorDetails(startActor, getPersonDetailsFn);
    
    if (checkActorInTvCredits(actorDetails, tvShow.id)) {
      logger.debug(`✅ TV Show "${getItemTitle(tvShow)}" is connectable - found in actor's TV credits`);
      return true;
    }
  }
  
  logger.debug(`❌ TV Show "${getItemTitle(tvShow)}" is not connectable to starting actors`);
  return false;
}

/**
 * Checks if a person can connect to starting actors
 * @param {Object} person - Person to check
 * @param {Array} startingActors - Starting actors array
 * @param {Function} getPersonDetailsFn - Function to get person details
 * @returns {Promise<boolean>} - Whether person is connectable
 */
async function checkPersonConnectability(person, startingActors, getPersonDetailsFn) {
  // Don't allow adding the starting actors again
  if (startingActors.some(startActor => startActor?.id === person.id)) {
    logger.debug(`❌ Not allowing readding starting actor`);
    return false;
  }
  
  // Get the searched actor's filmography
  const searchedActorDetails = await getPersonDetailsFn(person.id);
  
  // Extract the movie and TV IDs the searched actor has appeared in
  const searchedActorMovieIds = new Set(
    (searchedActorDetails.movie_credits?.cast || []).map(credit => credit.id)
  );
  const searchedActorTvIds = new Set(
    (searchedActorDetails.tv_credits?.cast || []).map(credit => credit.id)
  );
  
  // Check connections with each starting actor
  for (const startActor of startingActors) {
    if (!startActor || person.id === startActor.id) continue;
    
    const startActorDetails = await ensureActorDetails(startActor, getPersonDetailsFn);
    
    // Check if they've been in any of the same movies
    const startActorMovieCredits = startActorDetails.movie_credits?.cast || [];
    for (const credit of startActorMovieCredits) {
      if (searchedActorMovieIds.has(credit.id)) {
        logger.debug(`✅ Actor "${getItemTitle(person)}" is connectable - both appeared in movie ${credit.title || credit.name}`);
        return true;
      }
    }
    
    // Check if they've been in any of the same TV shows
    const startActorTvCredits = startActorDetails.tv_credits?.cast || [];
    for (const credit of startActorTvCredits) {
      if (searchedActorTvIds.has(credit.id)) {
        logger.debug(`✅ Actor "${getItemTitle(person)}" is connectable - both appeared in TV show ${credit.title || credit.name}`);
        return true;
      }
    }
  }
  
  logger.debug(`❌ Actor "${getItemTitle(person)}" is not connectable to starting actors`);
  return false;
}

// ==================== EXPORTED MAIN FUNCTIONS ====================

/**
 * Process person details and add necessary information
 * Includes handling guest appearances
 * 
 * @param {number} personId - Person ID
 * @returns {Promise<Object>} - Enhanced person details
 */
export const processPersonDetails = async (personId) => {
  // Get person details - fetch with guest appearances included
  const details = await getPersonDetails(personId);
  
  // Explicitly fetch guest appearances to make sure we have them
  const guestAppearances = await findPersonGuestAppearances(personId);
  
  // Make sure TV credits include guest appearances
  if (guestAppearances && guestAppearances.length > 0) {
    if (!details.tv_credits) {
      details.tv_credits = { cast: [] };
    }
    
    // Add any guest appearances that aren't already in the TV credits
    const existingTvIds = new Set(details.tv_credits.cast.map(credit => credit.id));
    
    for (const appearance of guestAppearances) {
      if (!existingTvIds.has(appearance.id)) {
        details.tv_credits.cast.push({
          ...appearance,
          is_guest_appearance: true  // Mark as guest appearance
        });
        existingTvIds.add(appearance.id);
      } else {
        // If it's already there, mark it as a guest appearance if it is one
        const existingCredit = details.tv_credits.cast.find(credit => credit.id === appearance.id);
        if (existingCredit && appearance.is_guest_appearance) {
          existingCredit.is_guest_appearance = true;
        }
      }
    }
    
    details.guest_appearances_added = true;
  }
  
  return details;
};

/**
 * Find connections between a person and existing nodes (OPTIMIZED)
 * 
 * @param {Object} person - Person object with complete details
 * @param {Array} nodes - Existing nodes on the board
 * @param {string} personNodeId - ID of the person node
 * @returns {Array} - Array of connections
 */
export const findPersonConnections = (person, nodes, personNodeId) => {
  const connectionIndex = createConnectionIndex(nodes);
  return findPersonConnectionsOptimized(person, connectionIndex, personNodeId);
};

/**
 * Find connections between a movie and existing nodes (OPTIMIZED)
 * 
 * @param {Object} movie - Movie object with complete details
 * @param {Array} nodes - Existing nodes on the board
 * @param {string} movieNodeId - ID of the movie node
 * @returns {Array} - Array of connections
 */
export const findMovieConnections = (movie, nodes, movieNodeId) => {
  const connectionIndex = createConnectionIndex(nodes);
  return findMovieConnectionsOptimized(movie, connectionIndex, movieNodeId);
};

/**
 * Find connections between a TV show and existing nodes (OPTIMIZED)
 * 
 * @param {Object} tvShow - TV show object with complete details
 * @param {Array} nodes - Existing nodes on the board
 * @param {string} tvNodeId - ID of the TV show node
 * @returns {Array} - Array of connections
 */
export const findTvShowConnections = (tvShow, nodes, tvNodeId) => {
  const connectionIndex = createConnectionIndex(nodes);
  return findTvShowConnectionsOptimized(tvShow, connectionIndex, tvNodeId);
};

/**
 * Check if an item can connect with the starting actors
 * 
 * @param {Object} item - Item to check (person, movie, TV)
 * @param {Array} startingActors - The two starting actors
 * @param {Function} getPersonDetailsFn - Function to get person details
 * @param {Function} getMovieDetailsFn - Function to get movie details
 * @param {Function} getTvShowDetailsFn - Function to get TV show details
 * @returns {Promise<boolean>} - Whether the item can connect to starting actors
 */
export const checkInitialConnectability = async (item, startingActors, getPersonDetailsFn, getMovieDetailsFn, getTvShowDetailsFn) => {
  const title = getItemTitle(item);
  const mediaType = item.media_type === 'movie' ? 'Movie' : 
                   item.media_type === 'tv' ? 'TV Show' : 'Person';
  
  logger.debug(`Checking connectability for ${mediaType.toLowerCase()} "${title}"`);
  
  try {
    if (!startingActors?.length) {
      logger.error("No starting actors provided to checkInitialConnectability");
      return false;
    }

    if (item.media_type === 'movie') {
      return await checkMovieConnectability(item, startingActors, getMovieDetailsFn);
    } 
    else if (item.media_type === 'tv') {
      return await checkTvConnectability(item, startingActors, getTvShowDetailsFn, getPersonDetailsFn);
    } 
    else if (item.media_type === 'person') {
      return await checkPersonConnectability(item, startingActors, getPersonDetailsFn);
    }
    
    logger.debug(`❌ Item type ${item.media_type} not recognized`);
    return false;
  } catch (error) {
    logger.error("Error checking initial connectability:", error);
    return false;
  }
};

/**
 * Check if an item can be connected to existing nodes on the board
 * 
 * @param {Object} item - Item to check (person, movie, TV)
 * @param {Array} nodes - Current nodes on the board
 * @param {Function} getPersonDetailsFn - Function to get person details 
 * @param {Function} getMovieDetailsFn - Function to get movie details
 * @param {Function} getTvShowDetailsFn - Function to get TV show details
 * @returns {Promise<boolean>} - Whether the item is connectable to current board
 */
export const checkItemConnectabilityUtil = async (
  item, 
  nodes,
  getPersonDetailsFn = getPersonDetails,
  getMovieDetailsFn = getMovieDetails,
  getTvShowDetailsFn = getTvShowDetails
) => {
  try {
    // If board is empty, nothing can connect to it
    if (nodes.length === 0) return false;
    
    // Check connectability based on media type
    if (item.media_type === 'person') {
      // For actors: get their filmography and check if they appeared in any movie/show on the board
      const details = await getPersonDetailsFn(item.id);
      const movieCredits = details.movie_credits?.cast || [];
      const tvCredits = details.tv_credits?.cast || [];
      
      // Check if any movie on the board is in this actor's credits
      for (const node of nodes) {
        if (node.type === 'movie') {
          if (movieCredits.some(movie => movie.id === node.data.id)) {
            return true;
          }
        }
        // Check if any TV show on the board is in this actor's credits
        else if (node.type === 'tv') {
          if (tvCredits.some(tv => tv.id === node.data.id)) {
            return true;
          }
        }
      }
    } 
    else if (item.media_type === 'movie') {
      // For movies: check if any actor on the board appeared in this movie
      const details = await getMovieDetailsFn(item.id);
      const cast = details.credits?.cast || [];
      
      // Check if any actor on the board is in this movie
      for (const node of nodes) {
        if (node.type === 'person') {
          if (cast.some(actor => actor.id === node.data.id)) {
            return true;
          }
        }
      }
    } 
    else if (item.media_type === 'tv') {
      // For TV shows: check if any actor on the board appeared in this show
      const details = await getTvShowDetailsFn(item.id);
      const cast = details.credits?.cast || [];
      
      // Check if any actor on the board is in this TV show's regular cast
      for (const node of nodes) {
        if (node.type === 'person') {
          // First check the regular cast list
          if (cast.some(actor => actor.id === node.data.id)) {
            return true;
          }
          
          // Check if this TV show appears in the actor's credits
          if (checkActorInTvCredits(node.data, item.id)) {
            return true;
          }
        }
      }
    }
    
    return false;
  } catch (error) {
    logger.error("Error checking item connectability:", error);
    return false;
  }
};

/**
 * Fetches all entities that can connect to a given node
 * @param {Object} node - Node to find connections for
 * @param {Object} services - TMDB service functions
 * @returns {Array} - List of entities that can connect to the node
 */
export const fetchAllPossibleConnections = async (node, services) => {
  const { getPersonDetails, getMovieDetails, getTvShowDetails } = services;
  let connections = [];

  try {
    if (node.type === 'person') {
      const credits = await getPersonDetails(node.data.id);
      if (credits) {
        if (credits.movie_credits?.cast) {
          connections.push(...mapCreditsToEntities(credits.movie_credits.cast, 'movie'));
        }
        if (credits.tv_credits?.cast) {
          connections.push(...mapCreditsToEntities(credits.tv_credits.cast, 'tv'));
        }
      }
    } else if (node.type === 'movie') {
      const credits = await getMovieDetails(node.data.id);
      if (credits?.cast) {
        connections.push(...mapCreditsToEntities(credits.cast, 'person'));
      }    } else if (node.type === 'tv') {
      const credits = await getTvShowDetails(node.data.id);
      // Use aggregate_credits.cast for more comprehensive actor list
      if (credits?.aggregate_credits?.cast) {
        connections.push(...mapCreditsToEntities(credits.aggregate_credits.cast, 'person'));
      } else if (credits?.credits?.cast) {
        // Fallback to regular credits if aggregate_credits not available
        connections.push(...mapCreditsToEntities(credits.credits.cast, 'person'));
      }
    }

    return filterEntitiesWithImages(connections);
  } catch (error) {
    logger.error(`Error fetching connections for ${node.type} ${node.data.id}:`, error);
    return [];
  }
};

/**
 * Checks if an actor has appeared in a TV show (including guest appearances)
 * @param {number} actorId - TMDB ID of the actor
 * @param {number} tvShowId - TMDB ID of the TV show
 * @param {Array} nodes - Current board nodes
 * @param {Function} checkActorInTvShow - TMDB service function
 * @returns {Promise<boolean>} - Whether actor has appeared in the show
 */
export const checkActorTvShowConnection = async (actorId, tvShowId, nodes, checkActorInTvShow) => {
  try {
    const actorNodeId = `person-${actorId}`;
    const actorNode = nodes.find(node => node.id === actorNodeId);

    if (actorNode) {
      if (checkActorInTvCredits(actorNode.data, tvShowId)) {
        return true;
      }

      if (actorNode.data.guest_appearances_added) {
        const tvCredits = actorNode.data.tv_credits?.cast || [];
        return tvCredits.some(show => {
          return show.id === tvShowId ||
            (show.credit_id && show.credit_id.includes('guest')) ||
            (show.character && show.character.toLowerCase().includes('guest'));
        });
      }

      return false;
    }

    const result = await checkActorInTvShow(actorId, tvShowId);
    return result.appears;
  } catch (error) {
    logger.error(`Error checking actor-TV connection: ${error}`);
    return false;
  }
};

/**
 * Fetches connectable entities from current board nodes
 * @param {Array} nodes - Current board nodes
 * @returns {Array} - Array of connectable entities
 */
export const fetchConnectableEntitiesFromBoard = async (nodes) => {
  let allConnectableEntities = [];

  for (const node of nodes) {
    if (!node?.data?.id) continue;

    let nodeConnections = [];

    if (node.type === 'person') {
      if (node.data.movie_credits?.cast) {
        nodeConnections.push(...mapCreditsToEntities(
          node.data.movie_credits.cast, 
          'movie', 
          { source_node: node.id }
        ));
      }

      if (node.data.tv_credits?.cast) {
        nodeConnections.push(...mapCreditsToEntities(
          node.data.tv_credits.cast.map(show => ({
            ...show,
            connection_type: show.is_guest_appearance ? 'guest' : 'cast'
          })), 
          'tv', 
          { source_node: node.id }
        ));
      }

      if (node.data.guest_appearances) {
        nodeConnections.push(...mapCreditsToEntities(
          node.data.guest_appearances, 
          'tv', 
          { 
            is_guest_appearance: true,
            connection_type: 'guest',
            source_node: node.id 
          }
        ));
      }
    } else if (node.type === 'movie' && node.data.credits?.cast) {
      nodeConnections.push(...mapCreditsToEntities(
        node.data.credits.cast, 
        'person', 
        { source_node: node.id }
      ));    } else if (node.type === 'tv') {
      // Use aggregate_credits.cast for more comprehensive actor list
      if (node.data.aggregate_credits?.cast) {
        nodeConnections.push(...mapCreditsToEntities(
          node.data.aggregate_credits.cast, 
          'person', 
          { source_node: node.id }
        ));
      } else if (node.data.credits?.cast) {
        // Fallback to regular credits if aggregate_credits not available
        nodeConnections.push(...mapCreditsToEntities(
          node.data.credits.cast, 
          'person', 
          { source_node: node.id }
        ));
      }

      if (node.data.guest_stars) {
        nodeConnections.push(...mapCreditsToEntities(
          node.data.guest_stars, 
          'person', 
          { 
            is_guest_star: true,
            source_node: node.id 
          }
        ));
      }
    }

    // Filter connections with images
    nodeConnections = filterEntitiesWithImages(nodeConnections);
    allConnectableEntities.push(...nodeConnections);
  }

  return removeDuplicateEntities(allConnectableEntities);
};