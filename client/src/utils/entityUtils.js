// Entity-specific utility functions for handling people, movies, and TV shows
import { getPersonDetails, getMovieDetails, getTvShowDetails, findPersonGuestAppearances } from '../services/tmdbService';

/**
 * Check if an item can connect with the starting actors
 * 
 * Critical for the initial game state when only starting actors are on the board.
 * For each entity type:
 * - Movies: Check if either starting actor appeared in the movie
 * - TV Shows: Check if either starting actor appeared in the show (regular cast or guest)
 * - Actors: Check if they appeared in any same production as either starting actor
 * 
 * @param {Object} item - Item to check (person, movie, TV)
 * @param {Array} startingActors - The two starting actors
 * @param {Function} getPersonDetailsFn - Function to get person details 
 * @param {Function} getMovieDetailsFn - Function to get movie details
 * @param {Function} getTvShowDetailsFn - Function to get TV show details
 * @returns {Promise<boolean>} - Whether the item can connect to starting actors
 */
export const checkInitialConnectabilityUtil = async (
  item, 
  startingActors,
  getPersonDetailsFn = getPersonDetails,
  getMovieDetailsFn = getMovieDetails,
  getTvShowDetailsFn = getTvShowDetails
) => {
  try {
    // Make sure we have starting actors
    if (!startingActors || startingActors.length === 0) {
      console.error("No starting actors provided to checkInitialConnectability");
      return false;
    }

    // Log to help debug the issue
    console.log(`Checking connectability for ${item.media_type} "${getItemTitle(item)}" with starting actors`);
    
    if (item.media_type === 'movie') {
      const details = await getMovieDetailsFn(item.id);
      const cast = details.credits?.cast || [];
      
      // Check if either of the starting actors is in this movie
      const connected = cast.some(actor => 
        startingActors.some(startActor => startActor && startActor.id === actor.id)
      );
      
      if (connected) {
        console.log(`✅ Movie "${getItemTitle(item)}" is connectable - matching actor found in cast`);
      }
      return connected;
    } 
    else if (item.media_type === 'tv') {
      const details = await getTvShowDetailsFn(item.id);
      const cast = details.credits?.cast || [];
      
      // First check the regular cast
      if (cast.some(actor => 
        startingActors.some(startActor => startActor && startActor.id === actor.id)
      )) {
        console.log(`✅ TV Show "${getItemTitle(item)}" is connectable - actor found in regular cast`);
        return true;
      }
      
      // If not in regular cast, check if either starting actor has this TV show
      // in their TV credits or guest appearances
      for (const startActor of startingActors) {
        if (!startActor) continue;
        
        // Get full actor details if not already loaded
        let actorDetails = startActor;
        if (!startActor.tv_credits || !startActor.tv_credits.cast) {
          actorDetails = await getPersonDetailsFn(startActor.id);
        }
        
        // Check if the actor has TV credits that include this show
        if (actorDetails.tv_credits && actorDetails.tv_credits.cast) {
          if (actorDetails.tv_credits.cast.some(credit => credit.id === item.id)) {
            console.log(`✅ TV Show "${getItemTitle(item)}" is connectable - found in actor's TV credits`);
            return true;
          }
        }
        
        // Also check specific guest_appearances if available
        if (actorDetails.guest_appearances) {
          if (actorDetails.guest_appearances.some(appearance => appearance.id === item.id)) {
            console.log(`✅ TV Show "${getItemTitle(item)}" is connectable - found in actor's guest appearances`);
            return true;
          }
        }
      }
      
      console.log(`❌ TV Show "${getItemTitle(item)}" is not connectable to starting actors`);
      return false;
    } 
    else if (item.media_type === 'person') {
      // Don't allow adding the starting actors again
      if (startingActors.some(startActor => startActor && startActor.id === item.id)) {
        console.log(`❌ Not allowing readding starting actor`);
        return false;
      }
      
      // Get the searched actor's filmography
      const searchedActorDetails = await getPersonDetailsFn(item.id);
      
      // Extract the movie and TV IDs the searched actor has appeared in
      const searchedActorMovieIds = new Set(
        (searchedActorDetails.movie_credits?.cast || [])
          .map(credit => credit.id)
      );
      const searchedActorTvIds = new Set(
        (searchedActorDetails.tv_credits?.cast || [])
          .map(credit => credit.id)
      );
      
      // Check connections with each starting actor
      for (const startActor of startingActors) {
        if (!startActor) continue;
        
        // Skip if trying to add the starting actor again
        if (item.id === startActor.id) continue;
        
        // Get full actor details if not already loaded
        let startActorDetails = startActor;
        if (!startActor.movie_credits || !startActor.movie_credits.cast) {
          startActorDetails = await getPersonDetailsFn(startActor.id);
        }
        
        // Check if they've been in any of the same movies
        const startActorMovieCredits = startActorDetails.movie_credits?.cast || [];
        for (const credit of startActorMovieCredits) {
          if (searchedActorMovieIds.has(credit.id)) {
            console.log(`✅ Actor "${getItemTitle(item)}" is connectable - both appeared in movie ${credit.title || credit.name}`);
            return true;
          }
        }
        
        // Check if they've been in any of the same TV shows
        const startActorTvCredits = startActorDetails.tv_credits?.cast || [];
        for (const credit of startActorTvCredits) {
          if (searchedActorTvIds.has(credit.id)) {
            console.log(`✅ Actor "${getItemTitle(item)}" is connectable - both appeared in TV show ${credit.title || credit.name}`);
            return true;
          }
        }
      }
      
      console.log(`❌ Actor "${getItemTitle(item)}" is not connectable to starting actors`);
      return false;
    }
    
    console.log(`❌ Item type ${item.media_type} not recognized`);
    return false;
  } catch (error) {
    console.error("Error checking initial connectability:", error);
    return false;
  }
};

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

/**
 * Process person details and add necessary information
 * Includes handling guest appearances
 * 
 * @param {Object} person - Person object
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
 * Find connections between a person and existing nodes
 * 
 * @param {Object} person - Person object with complete details
 * @param {Array} nodes - Existing nodes on the board
 * @param {string} personNodeId - ID of the person node
 * @returns {Array} - Array of connections
 */
export const findPersonConnections = (person, nodes, personNodeId) => {
  const connections = [];
  
  // Get this actor's movie and TV credits
  const movieCredits = person.movie_credits?.cast || [];
  const tvCredits = person.tv_credits?.cast || [];
  
  console.log(`Actor has ${movieCredits.length} movie credits and ${tvCredits.length} TV credits`);
  
  // Check existing nodes for potential connections
  nodes.forEach(existingNode => {
    // Check for connections with movies
    if (existingNode.type === 'movie') {
      const isConnected = movieCredits.some(credit => credit.id === existingNode.data.id);
      if (isConnected) {
        console.log(`Found connection between ${personNodeId} and movie ${existingNode.id}`);
        connections.push({
          id: `${personNodeId}-${existingNode.id}`,
          source: personNodeId,
          target: existingNode.id
        });
      }
    } 
    // Check for connections with TV shows - including guest appearances
    else if (existingNode.type === 'tv') {
      // Find the credit information for this TV show
      const creditInfo = tvCredits.find(credit => credit.id === existingNode.data.id);
      const isConnected = !!creditInfo;
      
      if (isConnected) {
        const isGuestAppearance = creditInfo.is_guest_appearance || false;
        
        console.log(`Found connection between ${personNodeId} and TV show ${existingNode.id}`);
        if (isGuestAppearance) {
          console.log(`(Guest star appearance)`);
        }
        
        connections.push({
          id: `${personNodeId}-${existingNode.id}`,
          source: personNodeId,
          target: existingNode.id,
          isGuestAppearance: isGuestAppearance
        });
      }
    }
  });
  
  return connections;
};

/**
 * Find connections between a movie and existing nodes
 * 
 * @param {Object} movie - Movie object with complete details
 * @param {Array} nodes - Existing nodes on the board
 * @param {string} movieNodeId - ID of the movie node
 * @returns {Array} - Array of connections
 */
export const findMovieConnections = (movie, nodes, movieNodeId) => {
  const connections = [];
  
  // Get the movie's cast
  const cast = movie.credits?.cast || [];
  console.log(`Movie has ${cast.length} cast members`);
  
  // Check if any actor on the board is in this movie's cast
  nodes.forEach(existingNode => {
    if (existingNode.type === 'person') {
      const isConnected = cast.some(actor => actor.id === existingNode.data.id);
      if (isConnected) {
        console.log(`Found connection between movie ${movieNodeId} and actor ${existingNode.id}`);
        connections.push({
          id: `${existingNode.id}-${movieNodeId}`,
          source: existingNode.id,
          target: movieNodeId
        });
      }
    }
  });
  
  return connections;
};

/**
 * Find connections between a TV show and existing nodes
 * 
 * @param {Object} tvShow - TV show object with complete details
 * @param {Array} nodes - Existing nodes on the board
 * @param {string} tvNodeId - ID of the TV show node
 * @returns {Array} - Array of connections
 */
export const findTvShowConnections = (tvShow, nodes, tvNodeId) => {
  const connections = [];
  
  // Get the TV show's cast
  const cast = tvShow.credits?.cast || [];
  console.log(`TV show has ${cast.length} cast members`);
  
  // Check for connections with actors on the board
  // This includes both regular cast and guest star appearances
  nodes.forEach(existingNode => {
    if (existingNode.type === 'person') {
      const actorId = existingNode.data.id;
      
      // First check regular cast
      const isInRegularCast = cast.some(actor => actor.id === actorId);
      
      if (isInRegularCast) {
        console.log(`Found regular cast connection between TV show ${tvNodeId} and actor ${existingNode.id}`);
        connections.push({
          id: `${existingNode.id}-${tvNodeId}`,
          source: existingNode.id,
          target: tvNodeId
        });
      } else {
        // If not in regular cast, check if this actor has this TV show in their credits
        // This would pick up guest appearances automatically
        const tvCredits = existingNode.data.tv_credits?.cast || [];
        const creditInfo = tvCredits.find(credit => credit.id === tvShow.id);
        
        if (creditInfo) {
          const isGuestAppearance = creditInfo.is_guest_appearance || false;
          console.log(`Found ${isGuestAppearance ? 'guest appearance' : 'cast'} connection between TV show ${tvNodeId} and actor ${existingNode.id}`);
          connections.push({
            id: `${existingNode.id}-${tvNodeId}`,
            source: existingNode.id,
            target: tvNodeId,
            isGuestAppearance: isGuestAppearance
          });
        }
      }
    }
  });
  
  return connections;
};

/**
 * Check if an item can connect with the starting actors
 * 
 * Critical for the initial game state when only starting actors are on the board.
 * For each entity type:
 * - Movies: Check if either starting actor appeared in the movie
 * - TV Shows: Check if either starting actor appeared in the show (regular cast or guest)
 * - Actors: Check if they appeared in any same production as either starting actor
 * 
 * @param {Object} item - Item to check (person, movie, TV)
 * @param {Array} startingActors - The two starting actors
 * @returns {Promise<boolean>} - Whether the item can connect to starting actors
 */
export const checkInitialConnectability = async (item, startingActors, getPersonDetailsFn, getMovieDetailsFn, getTvShowDetailsFn) => {
  try {
    // Make sure we have starting actors
    if (!startingActors || startingActors.length === 0) {
      console.error("No starting actors provided to checkInitialConnectability");
      return false;
    }

    // Log to help debug the issue
    console.log(`Checking connectability for ${item.media_type} "${getItemTitle(item)}" with starting actors`);
    
    if (item.media_type === 'movie') {
      const details = await getMovieDetailsFn(item.id);
      const cast = details.credits?.cast || [];
      
      // Check if either of the starting actors is in this movie
      const connected = cast.some(actor => 
        startingActors.some(startActor => startActor && startActor.id === actor.id)
      );
      
      if (connected) {
        console.log(`✅ Movie "${getItemTitle(item)}" is connectable - matching actor found in cast`);
      }
      return connected;
    } 
    else if (item.media_type === 'tv') {
      const details = await getTvShowDetailsFn(item.id);
      const cast = details.credits?.cast || [];
      
      // First check the regular cast
      if (cast.some(actor => 
        startingActors.some(startActor => startActor && startActor.id === actor.id)
      )) {
        console.log(`✅ TV Show "${getItemTitle(item)}" is connectable - actor found in regular cast`);
        return true;
      }
      
      // If not in regular cast, check if either starting actor has this TV show
      // in their TV credits or guest appearances
      for (const startActor of startingActors) {
        if (!startActor) continue;
        
        // Get full actor details if not already loaded
        let actorDetails = startActor;
        if (!startActor.tv_credits || !startActor.tv_credits.cast) {
          actorDetails = await getPersonDetailsFn(startActor.id);
        }
        
        // Check if the actor has TV credits that include this show
        if (actorDetails.tv_credits && actorDetails.tv_credits.cast) {
          if (actorDetails.tv_credits.cast.some(credit => credit.id === item.id)) {
            console.log(`✅ TV Show "${getItemTitle(item)}" is connectable - found in actor's TV credits`);
            return true;
          }
        }
        
        // Also check specific guest_appearances if available
        if (actorDetails.guest_appearances) {
          if (actorDetails.guest_appearances.some(appearance => appearance.id === item.id)) {
            console.log(`✅ TV Show "${getItemTitle(item)}" is connectable - found in actor's guest appearances`);
            return true;
          }
        }
      }
      
      console.log(`❌ TV Show "${getItemTitle(item)}" is not connectable to starting actors`);
      return false;
    } 
    else if (item.media_type === 'person') {
      // Don't allow adding the starting actors again
      if (startingActors.some(startActor => startActor && startActor.id === item.id)) {
        console.log(`❌ Not allowing readding starting actor`);
        return false;
      }
      
      // Get the searched actor's filmography
      const searchedActorDetails = await getPersonDetailsFn(item.id);
      
      // Extract the movie and TV IDs the searched actor has appeared in
      const searchedActorMovieIds = new Set(
        (searchedActorDetails.movie_credits?.cast || [])
          .map(credit => credit.id)
      );
      const searchedActorTvIds = new Set(
        (searchedActorDetails.tv_credits?.cast || [])
          .map(credit => credit.id)
      );
      
      // Check connections with each starting actor
      for (const startActor of startingActors) {
        if (!startActor) continue;
        
        // Skip if trying to add the starting actor again
        if (item.id === startActor.id) continue;
        
        // Get full actor details if not already loaded
        let startActorDetails = startActor;
        if (!startActor.movie_credits || !startActor.movie_credits.cast) {
          startActorDetails = await getPersonDetailsFn(startActor.id);
        }
        
        // Check if they've been in any of the same movies
        const startActorMovieCredits = startActorDetails.movie_credits?.cast || [];
        for (const credit of startActorMovieCredits) {
          if (searchedActorMovieIds.has(credit.id)) {
            console.log(`✅ Actor "${getItemTitle(item)}" is connectable - both appeared in movie ${credit.title || credit.name}`);
            return true;
          }
        }
        
        // Check if they've been in any of the same TV shows
        const startActorTvCredits = startActorDetails.tv_credits?.cast || [];
        for (const credit of startActorTvCredits) {
          if (searchedActorTvIds.has(credit.id)) {
            console.log(`✅ Actor "${getItemTitle(item)}" is connectable - both appeared in TV show ${credit.title || credit.name}`);
            return true;
          }
        }
      }
      
      console.log(`❌ Actor "${getItemTitle(item)}" is not connectable to starting actors`);
      return false;
    }
    
    console.log(`❌ Item type ${item.media_type} not recognized`);
    return false;
  } catch (error) {
    console.error("Error checking initial connectability:", error);
    return false;
  }
};

/**
 * Check if an item can be connected to existing nodes on the board
 * 
 * For each entity type:
 * - Actors: Check if they were in any movie/show already on the board
 * - Movies: Check if any actor on the board appeared in the movie
 * - TV Shows: Check if any actor on the board appeared in the show
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
        // Includes both regular appearances and guest star appearances
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
          
          // IMPORTANT: Now also check if this TV show appears in the actor's credits
          // This catches guest appearances that might not be in the TV show's regular cast
          const actorTvCredits = node.data.tv_credits?.cast || [];
          if (actorTvCredits.some(credit => credit.id === item.id)) {
            return true;
          }
          
          // Also check the dedicated guest_appearances array if it exists
          const guestAppearances = node.data.guest_appearances || [];
          if (guestAppearances.some(appearance => appearance.id === item.id)) {
            return true;
          }
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error checking item connectability:", error);
    return false;
  }
};