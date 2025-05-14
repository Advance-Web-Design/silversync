// Utilities for handling connectable entities and related operations

/**
 * Update connectable entities list with a node's potential connections
 * 
 * @param {Object} node - The node to analyze
 * @param {Function} fetchNodeConnectionsCallback - Function to get connections
 * @param {Function} setConnectableEntities - State setter for connectable entities
 * @returns {Promise<void>}
 */
export const updateConnectableEntitiesForNode = async (
  node,
  fetchNodeConnectionsCallback,
  setConnectableEntities
) => {
  if (!node || !node.data || !fetchNodeConnectionsCallback) return;
  
  try {
    // Get all possible connections for this node
    const connections = await fetchNodeConnectionsCallback(node);
    
    // Add connections to connectable entities list
    if (connections && connections.length > 0) {
      setConnectableEntities(prev => {
        const updated = [...prev];
        const existingIds = new Set(prev.map(e => `${e.media_type}-${e.id}`));
        
        // Add new connectable entities
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

/**
 * Extract all TV shows an actor has appeared in, including guest appearances
 * 
 * @param {Object} actorData - Actor data object
 * @returns {Array} - Array of TV show objects
 */
export const extractActorTvShows = (actorData) => {
  if (!actorData) return [];
  
  const allTvShows = [];
  
  // Process regular TV credits
  if (actorData.tv_credits && actorData.tv_credits.cast) {
    allTvShows.push(...actorData.tv_credits.cast.map(show => ({
      ...show,
      media_type: 'tv',
      connection_type: 'cast',
      from_actor_id: actorData.id,
      from_actor_name: actorData.name
    })));
  }
  
  // Process guest appearances
  if (actorData.guest_appearances && Array.isArray(actorData.guest_appearances)) {
    const guestShows = actorData.guest_appearances.map(show => ({
      ...show,
      media_type: 'tv',
      is_guest_appearance: true,
      connection_type: 'guest',
      from_actor_id: actorData.id,
      from_actor_name: actorData.name
    }));
    
    // Filter out duplicates
    const existingShowIds = new Set(allTvShows.map(show => show.id));
    const uniqueGuestShows = guestShows.filter(show => !existingShowIds.has(show.id));
    
    allTvShows.push(...uniqueGuestShows);
  }
  
  // Mark guest appearances in TV credits if needed
  if (actorData.tv_credits && actorData.guest_appearances_added) {
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
  
  return uniqueShows;
};