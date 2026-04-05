/**
 * Topological Pathfinding Algorithms
 * Now operating on geographical graphs (Adjacency Lists)
 * 
 * adjList format: Map<nodeId, Array<{node: targetNodeId, dist: physicalDistance}>>
 */

function reconstructPath(cameFrom, currentId) {
    const path = [currentId];
    while (cameFrom.has(currentId)) {
        currentId = cameFrom.get(currentId);
        path.unshift(currentId);
    }
    return path;
}

/**
 * Breadth-First Search (BFS)
 * Unweighted shortest path (fewest intersections)
 */
export function breadthFirstSearch(startId, endId, adjList) {
    const visitedNodesInOrder = [];
    const queue = [startId];
    const visited = new Set();
    const cameFrom = new Map();

    visited.add(startId);

    while (queue.length > 0) {
        const currentId = queue.shift();
        visitedNodesInOrder.push(currentId);

        if (currentId === endId) {
            return {
                visitedNodesInOrder,
                pathFound: reconstructPath(cameFrom, currentId)
            };
        }

        const neighbors = adjList.get(currentId) || [];
        for (const edge of neighbors) {
            if (!visited.has(edge.node)) {
                visited.add(edge.node);
                cameFrom.set(edge.node, currentId);
                queue.push(edge.node);
            }
        }
    }

    return { visitedNodesInOrder, pathFound: [] };
}

/**
 * Depth-First Search (DFS)
 * Deep search (not guaranteed to find shortest path)
 */
export function depthFirstSearch(startId, endId, adjList) {
    const visitedNodesInOrder = [];
    const stack = [startId];
    const visited = new Set();
    const cameFrom = new Map();

    while (stack.length > 0) {
        const currentId = stack.pop();

        if (visited.has(currentId)) continue;
        
        visited.add(currentId);
        visitedNodesInOrder.push(currentId);

        if (currentId === endId) {
            return {
                visitedNodesInOrder,
                pathFound: reconstructPath(cameFrom, currentId)
            };
        }

        const neighbors = adjList.get(currentId) || [];
        // Push neighbors to stack
        for (const edge of neighbors) {
            if (!visited.has(edge.node)) {
                // In DFS we might overwrite cameFrom if we visit a node from multiple paths, 
                // but since we only care if it's NOT visited, we set cameFrom eagerly when pushing?
                // Actually, standard is to set cameFrom when visiting for DFS trees.
                // For simplicity, we just set it here if not visited
                if (!cameFrom.has(edge.node)) {
                    cameFrom.set(edge.node, currentId);
                }
                stack.push(edge.node);
            }
        }
    }

    return { visitedNodesInOrder, pathFound: [] };
}

/**
 * Dijkstra's Algorithm
 * Weighted pathfinding using geographical distance between intersections
 */
export function dijkstra(startId, endId, adjList) {
    const visitedNodesInOrder = [];
    const distances = new Map();
    const cameFrom = new Map();
    const visited = new Set();
    
    // Priority Queue substitute (array sort is O(N log N), fine for small graphs)
    // A proper MinHeap would be faster, but array is acceptable for <10,000 nodes.
    const pq = []; 

    // Initialize distances
    for (const nodeId of adjList.keys()) {
        distances.set(nodeId, Infinity);
    }
    distances.set(startId, 0);
    pq.push({ id: startId, dist: 0 });

    while (pq.length > 0) {
        // Sort to get node with smallest distance
        pq.sort((a, b) => a.dist - b.dist);
        const { id: currentId, dist: currentDist } = pq.shift();

        if (visited.has(currentId)) continue;
        
        visited.add(currentId);
        visitedNodesInOrder.push(currentId);

        if (currentId === endId) {
            return {
                visitedNodesInOrder,
                pathFound: reconstructPath(cameFrom, currentId)
            };
        }

        // We can't reach any more nodes
        if (currentDist === Infinity) break;

        const neighbors = adjList.get(currentId) || [];
        for (const edge of neighbors) {
            if (visited.has(edge.node)) continue;

            const tentativeDistance = currentDist + edge.dist;
            const knownDist = distances.get(edge.node);

            if (tentativeDistance < knownDist) {
                distances.set(edge.node, tentativeDistance);
                cameFrom.set(edge.node, currentId);
                pq.push({ id: edge.node, dist: tentativeDistance });
            }
        }
    }

    return { visitedNodesInOrder, pathFound: [] };
}
