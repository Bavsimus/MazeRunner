# Artificial Intelligence in Action: Applied Programming Project
## Option 2: Search & Pathfinding Visualizer

### 1. Problem Description (Rat in a Maze)
The "Rat in a Maze" problem is a classic computational challenge where an entity (the rat) must find a path from a starting position to a target destination (the cheese) through a two-dimensional grid filled with obstacles (walls). This maps directly to real-world applications in robotics navigation, GPS routing, and video game AI. 

Our application transforms this problem into an interactive constraints solver by allowing users to draw complex mazes and visualize how different search algorithms process the environment to find a valid path.

### 2. Theoretical Background of Algorithms
We implemented three fundamental search algorithms to demonstrate different AI navigation strategies:

#### Breadth-First Search (BFS)
- **Concept**: Explores the graph layer by layer, expanding all neighbor nodes at the present depth before moving deeper.
- **Guarantee**: Always finds the shortest path on an unweighted graph (like our uniform grid).
- **Complexity**: Time Complexity is $O(V + E)$ where $V$ is number of vertices (nodes) and $E$ is number of edges. Space Complexity is $O(V)$ as the queue stores all discovered nodes.
- **Visual Behavior**: Spreads outward like a water ripple in all directions equally until the target is hit.

#### Depth-First Search (DFS)
- **Concept**: Uninformed deep search. It explores as far as possible along each branch before backtracking.
- **Guarantee**: Does *not* guarantee the shortest path. It simply finds *a* path.
- **Complexity**: Time Complexity is $O(V + E)$. Space Complexity is $O(V)$ in the worst case for the stack (or recursion tree).
- **Visual Behavior**: Plunges directly down a specific path and only turns around when it hits a dead end, resulting in visually erratic but conceptually important "blind" searching behavior.

#### Dijkstra's Algorithm
- **Concept**: A greedy algorithm that finds the shortest path from a starting node to a target node in a graph strictly with positive edge weights. In our unweighted grid (all steps cost 1), Dijkstra behaves similarly to BFS but uses a priority queue sorting by current shortest calculated distance from the start node.
- **Guarantee**: Always finds the shortest path.
- **Complexity**: Time Complexity is $O(V^2)$ in a simple un-optimized array implementation or $O(E + V \log V)$ with a Min-Priority Queue. 
- **Visual Behavior**: Prioritizes nodes with the cheapest accumulated traveling cost. Extremely robust for future extensions where grid nodes might have "mud" or "water" adding path weights.

### 3. Overvew of Code Architecture
The application is built using a modern web stack (HTML5, Vanilla JavaScript, Vanilla CSS) to achieve high performance without requiring external frameworks.

#### Component Breakdown:
1. **app.js (Controller & UI State)**: 
   - Manages the grid array state (`grid[row][col]`).
   - Handles Document Object Model (DOM) event listeners for mouse interactions to establish barriers (walls), or relocate the `startNode` and `endNode`.
   - Coordinates the async `visualize()` function that processes the chosen algorithm's array of visited nodes and steps through them using time delays (`await sleep(ms)`) to visually manifest the processing speed. 
2. **algorithms.js (AI Engine)**:
   - Houses pure functions (`breadthFirstSearch`, `depthFirstSearch`, `dijkstra`) that accept the abstract grid state and return `{ visitedNodesInOrder, pathFound }`. These functions are decoupled from the UI layer.
3. **style.css (View/Presentation)**:
   - Responsible for the "glassmorphism" aesthetic.
   - Leverages CSS Keyframes (`@keyframes visitedAnimation`, `@keyframes pathAnimation`) invoked by JavaScript toggling CSS classes. This hardware-accelerates the visualization matrix, maintaining 60 FPS even on massive grids.
