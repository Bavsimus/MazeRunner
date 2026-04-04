# Artificial Intelligence in Action: Applied Programming Project
## Option 2: Search & Pathfinding Visualizer (Dynamic Area Refactor)

### 1. Problem Description (Dynamic Graph Selection)
Our application solves the "Rat in a Maze" pathfinding problem on real-world topological street networks. Following a significant architectural refactor, the application now supports **Dynamic Area Selection**, allowing users to define an arbitrary geographical bounding box within major world cities to perform search operations.

This workflow transitions the AI from a predefined static environment to a user-defined topological graph, mimicking real-world constraints such as selecting specific city blocks or neighborhoods for analysis.

### 2. The 4-Stage Interactive Pipeline
The application follows a strict state-machine flow to ensure data integrity and user clarity:

1.  **Stage 1: Metropolitan Scoping**: The user selects a major city (e.g., Manhattan, Paris, Shibuya). The map translates to an overview of that city but does not yet load street data to conserve bandwidth and API resources.
2.  **Stage 2: Graph Extraction (Interactive Bbox)**: The user defines a specific search area by clicking two points. The software calculates the geographical Bounding Box (Bbox) and fetches the street vectors from the OpenStreetMap Overpass API for that precise coordinate range.
3.  **Stage 3: Topological Ingestion (Graph Building)**: The downloaded data is parsed into a node-and-edge adjacency list. The UI then provides immediate feedback on the graph's availability, allowing the user to place a "Rat" (Start) and "Cheese" (End) within the extracted topology.
4.  **Stage 4: Algorithmic Simulation**: The user chooses from implemented algorithms (BFS, DFS, Dijkstra) and starts the visualization. The AI traverses the dynamically created graph to compute the optimal route.

### 3. Theoretical Background of Algorithms
- **Breadth-First Search (BFS)**: An uninformed search that expands level-by-level. Optimized for finding the shortest path in unweighted graphs (fewest intersections).
- **Depth-First Search (DFS)**: A blind search that explores branches deeply before backtracking. Excellent for demonstrating inefficient pathfinding in complex metropolitan grids.
- **Dijkstra's Algorithm**: A greedy, weighted search. Our implementation uses the **Haversine Formula** (geographic distance between two lat/lon intersections) as the edge weight to guarantee the absolute shortest physical path in kilometers.

### 4. Technical Architecture
The core system is decoupled into three layers:
- **Presentation Layer (`index.html`, `style.css`)**: Uses a glassmorphism "Wizard" UI to guide users through the 4-stage pipeline.
- **Mapping Layer (`app.js`)**: Orchestrates Leaflet.js rendering, SVG animations for neon "scanning" dots, and dynamic BBox extraction.
- **Computation Layer (`algorithms.js`)**: A lean engine that takes a topological adjacency list and returns the path sequence, independent of the UI or map coordinates.
