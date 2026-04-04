/**
 * Pathfinding Algorithms
 * Each algorithm takes the grid state, start node, and end node.
 * It returns an object: { visitedNodesInOrder, pathFound }
 * visitedNodesInOrder is used to animate the search.
 * pathFound contains the nodes forming the shortest path.
 */

function getNeighbors(node, grid, numRows, numCols) {
    const neighbors = [];
    const { row, col } = node;
    
    // Order: Up, Right, Down, Left
    if (row > 0) neighbors.push(grid[row - 1][col]);
    if (col < numCols - 1) neighbors.push(grid[row][col + 1]);
    if (row < numRows - 1) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    
    return neighbors.filter(n => !n.isWall);
}

function getShortestPath(endNode) {
    const path = [];
    let currentNode = endNode;
    while (currentNode !== null) {
        path.unshift(currentNode); // prepend to get start->end order
        currentNode = currentNode.previousNode;
    }
    // Only return valid path if start node is included (i.e. length > 1)
    if (path.length > 1 || path[0].isStart) {
        return path;
    }
    return [];
}

/**
 * Breadth-First Search (BFS)
 * Guarantees the shortest path on unweighted grids.
 */
function breadthFirstSearch(grid, startNode, endNode, numRows, numCols) {
    const visitedNodesInOrder = [];
    const queue = [startNode];
    startNode.isVisited = true;
    
    while (queue.length > 0) {
        const currentNode = queue.shift();
        
        // Skip wall nodes just in case
        if (currentNode.isWall) continue;
        
        visitedNodesInOrder.push(currentNode);
        
        if (currentNode === endNode) {
            return {
                visitedNodesInOrder,
                pathFound: getShortestPath(endNode)
            };
        }
        
        const neighbors = getNeighbors(currentNode, grid, numRows, numCols);
        for (const neighbor of neighbors) {
            if (!neighbor.isVisited) {
                neighbor.isVisited = true;
                neighbor.previousNode = currentNode;
                queue.push(neighbor);
            }
        }
    }
    
    return { visitedNodesInOrder, pathFound: [] }; // Path not found
}

/**
 * Depth-First Search (DFS)
 * Does NOT guarantee shortest path. Deep search.
 */
function depthFirstSearch(grid, startNode, endNode, numRows, numCols) {
    const visitedNodesInOrder = [];
    const stack = [startNode];
    
    while (stack.length > 0) {
        const currentNode = stack.pop();
        
        if (currentNode.isWall || currentNode.isVisited) continue;
        
        currentNode.isVisited = true;
        visitedNodesInOrder.push(currentNode);
        
        if (currentNode === endNode) {
            return {
                visitedNodesInOrder,
                pathFound: getShortestPath(endNode)
            };
        }
        
        const neighbors = getNeighbors(currentNode, grid, numRows, numCols);
        // Push in reverse order so that we process Up/Right/Down/Left conventionally
        for (let i = neighbors.length - 1; i >= 0; i--) {
            const neighbor = neighbors[i];
            if (!neighbor.isVisited) {
                neighbor.previousNode = currentNode;
                stack.push(neighbor);
            }
        }
    }
    
    return { visitedNodesInOrder, pathFound: [] };
}

/**
 * Dijkstra's Algorithm
 * Guarantees shortest path. Uses distance weights (all 1 for unweighted grid).
 */
function dijkstra(grid, startNode, endNode, numRows, numCols) {
    const visitedNodesInOrder = [];
    startNode.distance = 0;
    
    // Get all nodes in a flat array
    const unvisitedNodes = [];
    for (const row of grid) {
        for (const node of row) {
            unvisitedNodes.push(node);
        }
    }
    
    while (unvisitedNodes.length > 0) {
        // Sort nodes by distance
        unvisitedNodes.sort((a, b) => a.distance - b.distance);
        const currentNode = unvisitedNodes.shift();
        
        // If the closest node is at infinity, we are trapped
        if (currentNode.distance === Infinity) break;
        
        if (currentNode.isWall) continue;
        
        currentNode.isVisited = true;
        visitedNodesInOrder.push(currentNode);
        
        if (currentNode === endNode) {
            return {
                visitedNodesInOrder,
                pathFound: getShortestPath(endNode)
            };
        }
        
        const neighbors = getNeighbors(currentNode, grid, numRows, numCols);
        for (const neighbor of neighbors) {
            if (!neighbor.isVisited) {
                // In our simple grid, distance between neighbors is always 1
                const tentativeDistance = currentNode.distance + 1;
                if (tentativeDistance < neighbor.distance) {
                    neighbor.distance = tentativeDistance;
                    neighbor.previousNode = currentNode;
                }
            }
        }
    }
    
    return { visitedNodesInOrder, pathFound: [] };
}
