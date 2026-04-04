// App State
let grid = [];
let numRows = 23;
let numCols = 45;
let startNode = { row: 11, col: 10 };
let endNode = { row: 11, col: 35 };

let isDrawingState = false; // true if drawing walls, false if erasing
let isMouseDown = false;
let isMovingStart = false;
let isMovingEnd = false;
let isAnimationRunning = false;

// DOM Elements
const gridElement = document.getElementById('grid');
const algorithmSelect = document.getElementById('algorithm');
const speedSlider = document.getElementById('speed');
const visualizeBtn = document.getElementById('visualizeBtn');
const clearPathBtn = document.getElementById('clearPathBtn');
const clearBoardBtn = document.getElementById('clearBoardBtn');
const generateMazeBtn = document.getElementById('generateMazeBtn');

const statsPanel = document.getElementById('statsPanel');
const statTime = document.getElementById('statTime');
const statNodes = document.getElementById('statNodes');
const statPath = document.getElementById('statPath');

// Initialize App
function initApp() {
    calculateGridSize();
    window.addEventListener('resize', () => {
        if (!isAnimationRunning) {
            calculateGridSize();
        }
    });

    createGrid();
    setupEventListeners();
}

// Automatically size grid based on screen space
function calculateGridSize() {
    const container = document.querySelector('.grid-container');
    const containerWidth = container.clientWidth - 48; // padding
    const containerHeight = container.clientHeight - 48;
    
    const nodeSize = 25; // Matching CSS variable
    const gap = 1;

    // Estimate rows and cols
    let newCols = Math.floor(containerWidth / (nodeSize + gap));
    let newRows = Math.floor(containerHeight / (nodeSize + gap));

    if (newCols < 10) newCols = 10;
    if (newRows < 10) newRows = 10;

    // Only recreate if changed significantly
    if (newRows !== numRows || newCols !== numCols) {
        numRows = newRows;
        numCols = newCols;
        
        // Reset start and end to reasonable defaults if out of bounds
        startNode = { 
            row: Math.floor(numRows / 2), 
            col: Math.floor(numCols / 4) 
        };
        endNode = { 
            row: Math.floor(numRows / 2), 
            col: Math.floor((numCols / 4) * 3) 
        };
        
        createGrid();
    }
}

// Node Factory
function createNode(row, col) {
    return {
        row,
        col,
        isStart: row === startNode.row && col === startNode.col,
        isEnd: row === endNode.row && col === endNode.col,
        isWall: false,
        isVisited: false,
        distance: Infinity,
        previousNode: null,
    };
}

// Setup Data Structure and DOM Grid
function createGrid() {
    gridElement.innerHTML = '';
    gridElement.style.gridTemplateColumns = `repeat(${numCols}, var(--node-size))`;
    grid = [];

    for (let row = 0; row < numRows; row++) {
        const currentRow = [];
        for (let col = 0; col < numCols; col++) {
            const nodeData = createNode(row, col);
            currentRow.push(nodeData);

            const div = document.createElement('div');
            div.id = `node-${row}-${col}`;
            div.className = 'node';
            if (nodeData.isStart) div.classList.add('start-node');
            if (nodeData.isEnd) div.classList.add('end-node');

            // Mouse Events for drawing
            div.addEventListener('mousedown', () => handleMouseDown(row, col));
            div.addEventListener('mouseenter', () => handleMouseEnter(row, col));
            div.addEventListener('mouseup', () => handleMouseUp());


            gridElement.appendChild(div);
        }
        grid.push(currentRow);
    }
}

// Mouse Event Handlers
function handleMouseDown(row, col) {
    if (isAnimationRunning) return;
    isMouseDown = true;

    if (row === startNode.row && col === startNode.col) {
        isMovingStart = true;
    } else if (row === endNode.row && col === endNode.col) {
        isMovingEnd = true;
    } else {
        toggleWall(row, col);
        // Determine whether the user is drawing or erasing based on the initial click
        isDrawingState = grid[row][col].isWall;
    }
}

function handleMouseEnter(row, col) {
    if (!isMouseDown || isAnimationRunning) return;

    if (isMovingStart) {
        moveStartNode(row, col);
    } else if (isMovingEnd) {
        moveEndNode(row, col);
    } else {
        // Only toggle if we are not moving start/end nodes
        if (grid[row][col].isWall !== isDrawingState && !grid[row][col].isStart && !grid[row][col].isEnd) {
             toggleWall(row, col);
        }
    }
}

function handleMouseUp() {
    isMouseDown = false;
    isMovingStart = false;
    isMovingEnd = false;
}

// Node Interaction Logics
function toggleWall(row, col) {
    const node = grid[row][col];
    if (node.isStart || node.isEnd) return; // Can't make start/end into a wall

    node.isWall = !node.isWall;
    const element = document.getElementById(`node-${row}-${col}`);
    if (node.isWall) {
        element.classList.add('wall-node');
    } else {
        element.classList.remove('wall-node');
    }
}

function moveStartNode(row, col) {
    if (grid[row][col].isEnd || grid[row][col].isWall) return;

    // Remove old
    grid[startNode.row][startNode.col].isStart = false;
    document.getElementById(`node-${startNode.row}-${startNode.col}`).classList.remove('start-node');

    // Set new
    startNode = { row, col };
    grid[row][col].isStart = true;
    document.getElementById(`node-${row}-${col}`).classList.add('start-node');
}

function moveEndNode(row, col) {
    if (grid[row][col].isStart || grid[row][col].isWall) return;

    // Remove old
    grid[endNode.row][endNode.col].isEnd = false;
    document.getElementById(`node-${endNode.row}-${endNode.col}`).classList.remove('end-node');

    // Set new
    endNode = { row, col };
    grid[row][col].isEnd = true;
    document.getElementById(`node-${row}-${col}`).classList.add('end-node');
}

// Reset functions
function resetGrid(clearWalls = false) {
    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
            const node = grid[row][col];
            node.isVisited = false;
            node.distance = Infinity;
            node.previousNode = null;
            if (clearWalls) node.isWall = false;

            const element = document.getElementById(`node-${row}-${col}`);
            element.classList.remove('visited-node', 'path-node');
            if (clearWalls) element.classList.remove('wall-node');
        }
    }
    statsPanel.classList.add('hidden');
}

function generateRandomMaze() {
    if (isAnimationRunning) return;
    resetGrid(true);
    
    // Simple random maze (approx 25% walls)
    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
            if (row === startNode.row && col === startNode.col) continue;
            if (row === endNode.row && col === endNode.col) continue;
            
            if (Math.random() < 0.25) {
                grid[row][col].isWall = true;
                const element = document.getElementById(`node-${row}-${col}`);
                element.classList.add('wall-node');
            }
        }
    }
}

// Visualization Logic
async function visualize() {
    if (isAnimationRunning) return;
    resetGrid(false); // Clear previous path but keep walls
    
    const algorithm = algorithmSelect.value;
    const start = grid[startNode.row][startNode.col];
    const end = grid[endNode.row][endNode.col];

    isAnimationRunning = true;
    setControlsState(false);

    let result = { visitedNodesInOrder: [], pathFound: [] };
    
    const startTimeMs = performance.now();

    // Run algorithms synchronously (they are very fast)
    switch(algorithm) {
        case 'bfs':
            result = breadthFirstSearch(grid, start, end, numRows, numCols);
            break;
        case 'dfs':
            result = depthFirstSearch(grid, start, end, numRows, numCols);
            break;
        case 'dijkstra':
            result = dijkstra(grid, start, end, numRows, numCols);
            break;
    }

    const endTimeMs = performance.now();
    const executeTime = Math.round((endTimeMs - startTimeMs) * 100) / 100;

    // Calculate delay based on slider (1 = slow, 100 = fast)
    // Delay ranges from ~2ms to 50ms per node
    const sliderVal = parseInt(speedSlider.value);
    const delay = sliderVal === 100 ? 0 : 50 - (sliderVal * 0.48);

    await animateSearch(result.visitedNodesInOrder, result.pathFound, delay);

    // Update Stats
    statTime.innerText = executeTime;
    statNodes.innerText = result.visitedNodesInOrder.length;
    statPath.innerText = result.pathFound.length;
    statsPanel.classList.remove('hidden');

    isAnimationRunning = false;
    setControlsState(true);
}

function sleep(ms) {
    if(ms <= 0) return Promise.resolve();
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function animateSearch(visitedNodesInOrder, pathFound, delay) {
    for (let i = 0; i < visitedNodesInOrder.length; i++) {
        const node = visitedNodesInOrder[i];
        if (node.isStart || node.isEnd) continue;
        
        const element = document.getElementById(`node-${node.row}-${node.col}`);
        element.classList.add('visited-node');
        
        if (i % 2 === 0 && delay > 0) {
             await sleep(delay); // Chunk sleeps for slightly smoother performance on very fast speeds
        } else if (delay > 0){
             await sleep(delay);
        }
    }

    if (pathFound.length > 0) {
        await sleep(200); // Small pause before drawing path
        await animatePath(pathFound);
    } else {
        alert("No path found! The target is unreachable.");
    }
}

async function animatePath(pathFound) {
    for (let i = 0; i < pathFound.length; i++) {
        const node = pathFound[i];
        if (node.isStart || node.isEnd) continue;
        
        const element = document.getElementById(`node-${node.row}-${node.col}`);
        element.classList.remove('visited-node');
        element.classList.add('path-node');
        await sleep(30);
    }
}

function setControlsState(enabled) {
    visualizeBtn.disabled = !enabled;
    clearPathBtn.disabled = !enabled;
    clearBoardBtn.disabled = !enabled;
    generateMazeBtn.disabled = !enabled;
    algorithmSelect.disabled = !enabled;
    if(enabled) {
        visualizeBtn.innerText = "Visualize Algorithm";
    } else {
        visualizeBtn.innerText = "Visualizing...";
    }
}

// Event Listeners
function setupEventListeners() {
    visualizeBtn.addEventListener('click', visualize);
    clearPathBtn.addEventListener('click', () => { if(!isAnimationRunning) resetGrid(false); });
    clearBoardBtn.addEventListener('click', () => { if(!isAnimationRunning) resetGrid(true); });
    generateMazeBtn.addEventListener('click', generateRandomMaze);
    
    // Global mouseup to handle dragging outside grid gracefully
    window.addEventListener('mouseup', handleMouseUp);
}

// Run
window.onload = initApp;
