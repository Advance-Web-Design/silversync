/**
 * Actor Tree Management System
 * 
 * This utility manages linked trees for each starting actor, tracking which entities
 * belong to each actor's connection network. When an entity connects to both trees,
 * it calculates the shortest path between the starting actors.
 */
import { logger } from './loggerUtils';

/**
 * Class to represent a tree node in the actor connection network
 */
class TreeNode {
  constructor(nodeId, nodeType, data, parent = null) {
    this.nodeId = nodeId;
    this.nodeType = nodeType; // 'person', 'movie', 'tv'
    this.data = data;
    this.parent = parent;
    this.children = new Set();
    this.depth = parent ? parent.depth + 1 : 0;
    
    // Add this node to parent's children if parent exists
    if (parent) {
      parent.children.add(this);
    }
  }

  /**
   * Get the path from this node to the root
   * @returns {Array} Array of node IDs from root to this node
   */
  getPathToRoot() {
    const path = [];
    let current = this;
    
    while (current) {
      path.unshift(current.nodeId);
      current = current.parent;
    }
    
    return path;
  }

  /**
   * Get the depth of this node (distance from root)
   * @returns {number} Depth level
   */
  getDepth() {
    return this.depth;
  }
}

/**
 * Class to manage the actor connection tree
 */
export class ActorTree {
  constructor(rootActorId, rootActorData) {
    this.rootActorId = rootActorId;
    this.root = new TreeNode(rootActorId, 'person', rootActorData);
    this.nodeMap = new Map(); // nodeId -> TreeNode
    this.nodeMap.set(rootActorId, this.root);
    
    logger.info(`🌳 Created actor tree for ${rootActorData.name} (${rootActorId})`);
  }

  /**
   * Add a new entity to the tree
   * @param {string} nodeId - ID of the new node
   * @param {string} nodeType - Type of the node ('person', 'movie', 'tv')
   * @param {Object} nodeData - Data for the node
   * @param {string} parentNodeId - ID of the parent node to connect to
   * @returns {TreeNode|null} The created tree node or null if failed
   */
  addNode(nodeId, nodeType, nodeData, parentNodeId) {
    // Check if node already exists in this tree
    if (this.nodeMap.has(nodeId)) {
      logger.debug(`Node ${nodeId} already exists in tree for ${this.rootActorId}`);
      return this.nodeMap.get(nodeId);
    }

    // Find parent node
    const parentNode = this.nodeMap.get(parentNodeId);
    if (!parentNode) {
      logger.warn(`Parent node ${parentNodeId} not found in tree for ${this.rootActorId}`);
      return null;
    }

    // Create new tree node
    const newNode = new TreeNode(nodeId, nodeType, nodeData, parentNode);
    this.nodeMap.set(nodeId, newNode);

    logger.debug(`🌿 Added ${nodeType} ${nodeId} to tree for ${this.rootActorId} (depth: ${newNode.getDepth()})`);
    return newNode;
  }

  /**
   * Check if a node exists in this tree
   * @param {string} nodeId - ID to check
   * @returns {boolean} Whether the node exists
   */
  hasNode(nodeId) {
    return this.nodeMap.has(nodeId);
  }

  /**
   * Get a node from the tree
   * @param {string} nodeId - ID of the node
   * @returns {TreeNode|null} The tree node or null if not found
   */
  getNode(nodeId) {
    return this.nodeMap.get(nodeId) || null;
  }

  /**
   * Get the path from root to a specific node
   * @param {string} nodeId - Target node ID
   * @returns {Array|null} Path from root to node, or null if node not found
   */
  getPathToNode(nodeId) {
    const node = this.nodeMap.get(nodeId);
    return node ? node.getPathToRoot() : null;
  }

  /**
   * Get all nodes at a specific depth level
   * @param {number} depth - Depth level to query
   * @returns {Array} Array of TreeNodes at the specified depth
   */
  getNodesAtDepth(depth) {
    const result = [];
    for (const node of this.nodeMap.values()) {
      if (node.getDepth() === depth) {
        result.push(node);
      }
    }
    return result;
  }

  /**
   * Get statistics about the tree
   * @returns {Object} Tree statistics
   */
  getStats() {
    const nodesByType = { person: 0, movie: 0, tv: 0 };
    let maxDepth = 0;

    for (const node of this.nodeMap.values()) {
      nodesByType[node.nodeType]++;
      maxDepth = Math.max(maxDepth, node.getDepth());
    }

    return {
      totalNodes: this.nodeMap.size,
      nodesByType,
      maxDepth,
      rootActor: this.rootActorId
    };
  }
}

/**
 * Manager class for handling both actor trees and finding connections
 */
export class ActorTreeManager {
  constructor() {
    this.trees = new Map(); // actorId -> ActorTree
    this.globalNodeToTrees = new Map(); // nodeId -> Set of actorIds that have this node
  }

  /**
   * Initialize trees for the starting actors
   * @param {Array} startingActors - Array of starting actor objects
   */
  initializeTrees(startingActors) {
    this.trees.clear();
    this.globalNodeToTrees.clear();

    for (const actor of startingActors) {
      const actorId = `person-${actor.id}`;
      const tree = new ActorTree(actorId, actor);
      this.trees.set(actorId, tree);
      
      // Register the root actor in global map
      if (!this.globalNodeToTrees.has(actorId)) {
        this.globalNodeToTrees.set(actorId, new Set());
      }
      this.globalNodeToTrees.get(actorId).add(actorId);
    }

    logger.info(`🌲 Initialized trees for ${startingActors.length} starting actors`);
  }

  /**
   * Add a new entity to the appropriate tree(s) based on its connections
   * @param {string} nodeId - ID of the new node
   * @param {string} nodeType - Type of the node
   * @param {Object} nodeData - Data for the node
   * @param {Array} connections - Array of connections this node has
   * @returns {Object} Information about which trees were updated and if connection found
   */
  addEntityToTrees(nodeId, nodeType, nodeData, connections) {
    const treesAffected = new Set();
    const connectionResults = [];

    // Find which trees this entity should be added to based on its connections
    for (const connection of connections) {
      const connectedNodeId = connection.source === nodeId ? connection.target : connection.source;
      
      // Check which trees contain the connected node
      const treesWithConnectedNode = this.globalNodeToTrees.get(connectedNodeId);
      if (treesWithConnectedNode) {
        for (const treeActorId of treesWithConnectedNode) {
          treesAffected.add(treeActorId);
          
          // Add this node to the tree
          const tree = this.trees.get(treeActorId);
          if (tree && !tree.hasNode(nodeId)) {
            const addedNode = tree.addNode(nodeId, nodeType, nodeData, connectedNodeId);
            if (addedNode) {
              connectionResults.push({
                treeActorId,
                depth: addedNode.getDepth(),
                parentNodeId: connectedNodeId
              });
            }
          }
        }
      }
    }

    // Update global node mapping
    if (treesAffected.size > 0) {
      this.globalNodeToTrees.set(nodeId, new Set(treesAffected));
    }

    // Check if this entity connects trees (bridges both starting actors)
    const treeActorIds = Array.from(treesAffected);
    let shortestConnection = null;
    
    if (treeActorIds.length >= 2) {
      // This entity bridges multiple trees - find shortest path
      shortestConnection = this.findShortestPathBetweenTrees(treeActorIds, nodeId);
    }

    logger.info(`🔗 Added ${nodeType} ${nodeId} to ${treesAffected.size} tree(s)`, {
      treesAffected: Array.from(treesAffected),
      connectionFound: !!shortestConnection,
      shortestPathLength: shortestConnection?.pathLength
    });

    return {
      treesAffected: Array.from(treesAffected),
      connectionResults,
      shortestConnection,
      bridgeNode: treeActorIds.length >= 2 ? nodeId : null
    };
  }

  /**
   * Find the shortest path between trees when they become connected
   * @param {Array} treeActorIds - IDs of the tree root actors
   * @param {string} bridgeNodeId - ID of the node that connects the trees
   * @returns {Object|null} Shortest path information
   */
  findShortestPathBetweenTrees(treeActorIds, bridgeNodeId) {
    if (treeActorIds.length < 2) return null;

    let shortestPath = null;
    let shortestLength = Infinity;

    // Check all combinations of tree pairs
    for (let i = 0; i < treeActorIds.length; i++) {
      for (let j = i + 1; j < treeActorIds.length; j++) {
        const tree1 = this.trees.get(treeActorIds[i]);
        const tree2 = this.trees.get(treeActorIds[j]);

        if (!tree1 || !tree2) continue;

        // Get paths from each root to the bridge node
        const pathFromRoot1 = tree1.getPathToNode(bridgeNodeId);
        const pathFromRoot2 = tree2.getPathToNode(bridgeNodeId);        if (pathFromRoot1 && pathFromRoot2) {
          // Calculate total path length
          // Path is: root1 -> ... -> bridge <- ... <- root2
          // We subtract 1 because the bridge node is counted in both paths
          const totalLength = pathFromRoot1.length + pathFromRoot2.length - 1;

          if (totalLength < shortestLength) {
            shortestLength = totalLength;
            
            // Create the full path: actor1 -> entities -> bridge -> entities -> actor2
            // pathFromRoot1: [actor1, entity1, entity2, bridge]
            // pathFromRoot2: [actor2, entity3, entity4, bridge] 
            // Result should be: [actor1, entity1, entity2, bridge, entity4, entity3, actor2]
            const pathFromActor2ToBridge = pathFromRoot2.slice(0, -1).reverse(); // Remove bridge and reverse
            const constructedPath = [...pathFromRoot1, ...pathFromActor2ToBridge];
            
            logger.debug('🔗 Constructing path between trees:', {
              actor1: treeActorIds[i],
              actor2: treeActorIds[j],
              pathFromRoot1,
              pathFromRoot2,
              pathFromActor2ToBridge,
              bridgeNode: bridgeNodeId,
              constructedPath,
              totalLength
            });
            
            shortestPath = {
              startActor1: treeActorIds[i],
              startActor2: treeActorIds[j],
              pathLength: totalLength - 2, // Subtract the starting actors from path length
              bridgeNode: bridgeNodeId,
              fullPath: constructedPath,
              pathFromActor1: pathFromRoot1,
              pathFromActor2: pathFromRoot2
            };
          }
        }
      }
    }

    return shortestPath;
  }

  /**
   * Get statistics for all trees
   * @returns {Object} Statistics for all trees
   */
  getAllTreeStats() {
    const stats = {};
    for (const [actorId, tree] of this.trees) {
      stats[actorId] = tree.getStats();
    }
    return stats;
  }

  /**
   * Get total count of unique nodes across all trees (excluding starting actors)
   * @returns {number} Total count of unique nodes
   */
  getTotalUniqueNodes() {
    const uniqueNodes = new Set();
    
    for (const [actorId, tree] of this.trees) {
      for (const nodeId of tree.nodeMap.keys()) {
        // Exclude the starting actors from the count
        if (nodeId !== actorId) {
          uniqueNodes.add(nodeId);
        }
      }
    }
    
    return uniqueNodes.size;
  }

  /**
   * Check if two starting actors are connected
   * @param {string} actor1Id - First actor ID
   * @param {string} actor2Id - Second actor ID
   * @returns {Object|null} Connection information if connected
   */
  checkActorsConnected(actor1Id, actor2Id) {
    const tree1 = this.trees.get(actor1Id);
    const tree2 = this.trees.get(actor2Id);

    if (!tree1 || !tree2) return null;

    // Find common nodes between the trees
    const commonNodes = [];
    for (const nodeId of tree1.nodeMap.keys()) {
      if (tree2.hasNode(nodeId)) {
        commonNodes.push(nodeId);
      }
    }

    if (commonNodes.length === 0) return null;

    // Find the shortest connection through common nodes
    let shortestConnection = null;
    let shortestLength = Infinity;

    for (const commonNodeId of commonNodes) {
      const pathFromActor1 = tree1.getPathToNode(commonNodeId);
      const pathFromActor2 = tree2.getPathToNode(commonNodeId);

      if (pathFromActor1 && pathFromActor2) {        const totalLength = pathFromActor1.length + pathFromActor2.length - 1;
        if (totalLength < shortestLength) {
          shortestLength = totalLength;
            // Create the full path: actor1 -> entities -> bridge -> entities -> actor2
          // pathFromActor1: [actor1, entity1, entity2, bridge]
          // pathFromActor2: [actor2, entity3, entity4, bridge] 
          // Result should be: [actor1, entity1, entity2, bridge, entity4, entity3, actor2]
          const pathFromActor2ToBridge = pathFromActor2.slice(0, -1).reverse(); // Remove bridge and reverse
          const constructedPath = [...pathFromActor1, ...pathFromActor2ToBridge, actor2Id];
          
          logger.debug('🔗 checkActorsConnected constructing path:', {
            actor1: actor1Id,
            actor2: actor2Id,
            pathFromActor1,
            pathFromActor2,
            pathFromActor2ToBridge,
            bridgeNode: commonNodeId,
            constructedPath,
            totalLength
          });
          
          shortestConnection = {
            pathLength: totalLength - 2, // Exclude starting actors
            bridgeNode: commonNodeId,
            fullPath: constructedPath,
            pathFromActor1,
            pathFromActor2
          };
        }
      }
    }

    return shortestConnection;
  }

  /**
   * Reset all trees
   */
  reset() {
    this.trees.clear();
    this.globalNodeToTrees.clear();
    logger.info('🌲 Reset all actor trees');
  }
}

// Export a singleton instance
export const actorTreeManager = new ActorTreeManager();
