# Artificial Intelligence in Action: Applied Programming Project
**Course:** Artificial Intelligence
**Topic:** Option 2 — Search & Pathfinding Visualizer (Real-World Topological Network)
**Project Title:** MazeRunner: A Dynamic AI Pathfinding Engine for Metropolitan Grids

## 1. Problem Description
The primary goal of this project is to solve the "Shortest Path Problem" (SPP) on real-world geographical datasets. While traditional AI exercises often utilize simple two-dimensional grids ("Rat in a Maze"), this application elevates the concept by utilizing live topological data from major world cities.

### Challenges Addressed:
1.  **Dynamic Graph Extraction**: Converting raw OpenStreetMap (OSM) vector data into a mathematically valid graph structure.
2.  **Stateful Interaction**: Guiding the user through a multi-stage pipeline—City Selection, Area Definition, Graph Building, and Algorithmic Simulation.
3.  **Visualization of AI "Thoughts"**: Animating the exploration process (frontier expansion) vs. the final computed path to provide educational clarity on how different AI agents perceive the search space.

---

## 2. Theoretical & Mathematical Background
The application models the chosen city area as a weighted graph $G = (V, E)$. 
*   $V$ (Vertices): Intersections or dead-ends where two or more streets meet.
*   $E$ (Edges): The street segments connecting these vertices.

### A. Breadth-First Search (BFS)
BFS is an uninformed search algorithm that explores the graph level-by-level. It uses a **FIFO (First-In, First-Out)** queue to manage the frontier.
*   **Mathematical Objective**: Finds the path with the minimum number of edges (unweighted shortest path).
*   **Time Complexity**: $O(V + E)$
*   **Use Case**: Ideal for discovering the route with the fewest "turns" or intersections.

### B. Depth-First Search (DFS)
DFS utilizes a **LIFO (Last-In, First-Out)** approach, exploring one branch as deeply as possible before backtracking.
*   **Behavior in Road Networks**: Because metropolitan road networks are highly cyclic and dense, DFS often produces erratic, non-optimal paths. This project includes DFS to demonstrate the limitations of blind, depth-oriented exploration in geographical graphs.
*   **Time Complexity**: $O(V + E)$

### C. Dijkstra’s Algorithm
Dijkstra's is a weighted search algorithm that finds the absolute shortest path by always expanding the node with the lowest cumulative cost.
*   **Cost Function**: The weight of each edge is the physical distance between its two nodes, calculated using the **Haversine Formula**:
    $$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos \phi_1 \cdot \cos \phi_2 \cdot \sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
    Where $\phi$ is latitude and $\lambda$ is longitude.
*   **Optimality**: Dijkstra is guaranteed to find the shortest path in terms of physical distance (kilometers).
*   **Time Complexity**: $O(E + V \log V)$ (using a Priority Queue).

---

## 3. Technical Architecture
The system is built using a modern, decoupled three-layer stack:

### Layer 1: Presentation (HTML5, Vanilla CSS3)
-   **Design System**: Implements a "Glassmorphism" UI with a semi-transparent, blurred-backdrop control panel.
-   **State Management**: A specialized CSS-class system (`active`, `completed`, `hidden`) manages the 4-stage "Wizard" workflow, ensuring the user follows a logical sequence.

### Layer 2: API & Data Extraction (Overpass API)
-   Uses the **Overpass API** to fetch real-time JSON street vectors from the OSM database.
-   **Sub-Graph Logic**: The application extracts only specific highways (primary, secondary, residential, pedestrian) to ensure a navigable graph for a "Rat" agent.

### Layer 3: Algorithmic Logic (JavaScript ESM Modules)
-   `algorithms.js`: Contains the pure math and logic for BFS, DFS, and Dijkstra.
-   `app.js`: Acts as the orchestrator, handling Leaflet.js map rendering, SVG animations for neon "scanning" dots, and the dynamic Bounding Box (Bbox) calculations.

---

## 4. Implementation Details
The application follows a strict 4-stage state machine:
1.  **Metropolitan Scoping**: The user zooms to a high-level view of a city (Manhattan, Paris, Tokyo).
2.  **Interactive Bounding Box**: The user clicks two points on the map to define a search area. This is geometrically translated into an OSM Bbox string.
3.  **Graph Synthesis**: The software fetches the data, identifies intersections, and builds an **Adjacency List**.
4.  **Simulation & Stats**: The visualization runs with an adjustable "Animation Speed," and a statistics panel displays execution time (ms), nodes explored, and final distance (km).

---

## 5. Conclusion & Observations
Throughout development, we observed that **Dijkstra’s Algorithm** consistently outperforms BFS in terms of physical distance but requires more computational resources to maintain the cost-sorted frontier. **DFS**, while computationally fast, is proved to be practically unusable for modern navigation tasks.

The project demonstrates that by combining classical AI algorithms with modern web technologies and real-world geographical APIs, we can create powerful, educational tools that transcend theoretical "toy problems."
