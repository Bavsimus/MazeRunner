import { breadthFirstSearch, depthFirstSearch, dijkstra } from './algorithms.js';

// App State
let map;
let currentStep = 1;

let graph = {
    nodes: new Map(),
    adjList: new Map()
};

let uiLayers = {
    streets: null,
    vis: null,
    selection: null
};

// Selection State
let selectionPoints = [];
let scanRectangle = null;
let currentBBox = null;

// Routing State
let startNodeId = null;
let endNodeId = null;
let isAnimationRunning = false;

// Constant Bounding Boxes for City Overview Zoom
const CITY_ZOOMS = {
    manhattan: { center: [40.7175, -74.0025], zoom: 14 },
    paris:     { center: [48.8570, 2.3465], zoom: 15 },
    shibuya:   { center: [35.6600, 139.7000], zoom: 15 },
    london:    { center: [51.5150, -0.0900], zoom: 15 }
};

// DOM Elements
const citySelect = document.getElementById('citySelect');
const algorithmSelect = document.getElementById('algorithm');
const speedSlider = document.getElementById('speed');
const loadingOverlay = document.getElementById('loadingOverlay');

const nextToStep2Btn = document.getElementById('nextToStep2');
const confirmAreaBtn = document.getElementById('confirmAreaBtn');
const backToStep1Btn = document.getElementById('backToStep1');
const visualizeBtn = document.getElementById('visualizeBtn');
const resetAreaBtn = document.getElementById('resetAreaBtn');
const globalResetBtn = document.getElementById('globalResetBtn');

const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');

const statTime = document.getElementById('statTime');
const statNodes = document.getElementById('statNodes');
const statPath = document.getElementById('statPath');
const statDist = document.getElementById('statDist');
const statsPanel = document.getElementById('statsPanel');

// Initial Setup
function initApp() {
    map = L.map('map', { zoomControl: false });
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    uiLayers.streets = L.layerGroup().addTo(map);
    uiLayers.vis = L.layerGroup().addTo(map);
    uiLayers.selection = L.layerGroup().addTo(map);

    map.on('click', handleMapClick);
    
    // Zoom to default city
    updateCityZoom();

    // Event Listeners
    citySelect.addEventListener('change', updateCityZoom);
    nextToStep2Btn.addEventListener('click', () => setStep(2));
    backToStep1Btn.addEventListener('click', () => setStep(1));
    confirmAreaBtn.addEventListener('click', finalizeAreaSelection);
    resetAreaBtn.addEventListener('click', () => setStep(2));
    visualizeBtn.addEventListener('click', runVisualization);
    globalResetBtn.addEventListener('click', () => setStep(1));

    updateStatus('offline', 'Pick a city to begin');
}

function updateCityZoom() {
    const config = CITY_ZOOMS[citySelect.value];
    if (config) map.setView(config.center, config.zoom);
}

function setStep(step) {
    if (isAnimationRunning) return;
    currentStep = step;

    // Update UI elements
    for (let i = 1; i <= 4; i++) {
        const stepEl = document.getElementById(`step${i}`);
        const contentEl = document.getElementById(`content${i}`);
        
        if (stepEl) {
            stepEl.classList.toggle('active', i === step);
            stepEl.classList.toggle('completed', i < step);
        }
        
        if (contentEl) {
            contentEl.classList.toggle('hidden', i !== (step === 4 ? 3 : step));
        }
    }

    // State cleanup
    if (step === 1) {
        resetFullState();
        updateStatus('offline', 'Step 1: Pick a city');
    } else if (step === 2) {
        clearRoutingLayers();
        uiLayers.selection.clearLayers();
        selectionPoints = [];
        scanRectangle = null;
        confirmAreaBtn.disabled = true;
        updateStatus('loading', 'Step 2: Draw a rectangle on the map');
    } else if (step === 3) {
        clearRoutingLayers();
        updateStatus('online', 'Step 3: Place Start (Rat) & End (Cheese)');
    }
}

function handleMapClick(e) {
    if (isAnimationRunning) return;

    if (currentStep === 2) {
        handleAreaSelectionClick(e.latlng);
    } else if (currentStep === 3) {
        handleRoutingPointClick(e.latlng);
    }
}

function handleAreaSelectionClick(latlng) {
    selectionPoints.push(latlng);
    
    // Add a visual marker for the point
    L.circleMarker(latlng, { radius: 5, color: '#3b82f6', fillOpacity: 1 }).addTo(uiLayers.selection);

    if (selectionPoints.length === 2) {
        const bounds = L.latLngBounds(selectionPoints[0], selectionPoints[1]);
        
        // Ensure rectangle isn't too huge (heuristic: approx 4km wide)
        const distance = selectionPoints[0].distanceTo(selectionPoints[1]);
        if (distance > 6000) {
            alert("Selection area too large! Please pick a smaller neighborhood for a faster scan.");
            uiLayers.selection.clearLayers();
            selectionPoints = [];
            return;
        }

        scanRectangle = L.rectangle(bounds, { className: 'scan-rect' }).addTo(uiLayers.selection);
        currentBBox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
        confirmAreaBtn.disabled = false;
    } else if (selectionPoints.length > 2) {
        // Start over selection
        uiLayers.selection.clearLayers();
        selectionPoints = [latlng];
        L.circleMarker(latlng, { radius: 5, color: '#3b82f6', fillOpacity: 1 }).addTo(uiLayers.selection);
        confirmAreaBtn.disabled = true;
    }
}

async function finalizeAreaSelection() {
    if (!currentBBox) return;
    
    loadingOverlay.classList.remove('hidden');
    updateStatus('loading', 'Scanning city grid...');

    const query = `[out:json][timeout:25];(way["highway"~"primary|secondary|tertiary|residential|unclassified|pedestrian"](${currentBBox}););(._;>;);out skel;`;
    const mirrors = [
        'https://overpass-api.de/api/interpreter',
        'https://lz4.overpass-api.de/api/interpreter',
        'https://z.overpass-api.de/api/interpreter'
    ];

    let success = false;
    for (const mirror of mirrors) {
        try {
            const response = await fetch(`${mirror}?data=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error("Mirror busy");
            const data = await response.json();
            if (data.elements && data.elements.length > 0) {
                buildGraph(data.elements);
                success = true;
                break;
            }
        } catch (e) { console.warn(`Mirror ${mirror} failed`); }
    }

    loadingOverlay.classList.add('hidden');

    if (success) {
        setStep(3);
    } else {
        updateStatus('offline', 'Scan Failed');
        alert("Could not load data for this area. Please try a different location or a smaller area.");
    }
}

function buildGraph(elements) {
    graph.nodes.clear();
    graph.adjList.clear();
    uiLayers.streets.clearLayers();

    const ways = [];
    for (const el of elements) {
        if (el.type === 'node') {
            graph.nodes.set(el.id, { lat: el.lat, lon: el.lon });
            graph.adjList.set(el.id, []);
        } else if (el.type === 'way') ways.push(el);
    }

    for (const way of ways) {
        const nodes = way.nodes || [];
        const coords = [];
        for (let i = 0; i < nodes.length - 1; i++) {
            const nA = graph.nodes.get(nodes[i]);
            const nB = graph.nodes.get(nodes[i+1]);
            if (nA && nB) {
                const d = getDist(nA.lat, nA.lon, nB.lat, nB.lon);
                graph.adjList.get(nodes[i]).push({ node: nodes[i+1], dist: d });
                graph.adjList.get(nodes[i+1]).push({ node: nodes[i], dist: d });
                coords.push([nA.lat, nA.lon]);
                if (i === nodes.length - 2) coords.push([nB.lat, nB.lon]);
            }
        }
        if (coords.length > 0) L.polyline(coords, { color: '#334155', weight: 2, opacity: 0.5 }).addTo(uiLayers.streets);
    }
}

function handleRoutingPointClick(latlng) {
    const closestId = findClosestNode(latlng.lat, latlng.lng);
    if (!closestId) return;

    const node = graph.nodes.get(closestId);

    if (!startNodeId) {
        startNodeId = closestId;
        L.circleMarker([node.lat, node.lon], { radius: 10, fillColor: 'var(--start-color)', color: '#fff', weight: 2, fillOpacity: 1, interactive: false }).addTo(uiLayers.vis);
    } else if (!endNodeId) {
        endNodeId = closestId;
        L.circleMarker([node.lat, node.lon], { radius: 10, fillColor: 'var(--end-color)', color: '#fff', weight: 2, fillOpacity: 1, interactive: false }).addTo(uiLayers.vis);
        visualizeBtn.disabled = false;
    } else {
        clearRoutingLayers();
        startNodeId = closestId;
        L.circleMarker([node.lat, node.lon], { radius: 10, fillColor: 'var(--start-color)', color: '#fff', weight: 2, fillOpacity: 1, interactive: false }).addTo(uiLayers.vis);
        visualizeBtn.disabled = true;
    }
}

function findClosestNode(lat, lon) {
    let closestId = null;
    let minDist = Infinity;
    for (const [id, node] of graph.nodes.entries()) {
        const edges = graph.adjList.get(id);
        if (!edges || edges.length === 0) continue;
        const d = getDist(lat, lon, node.lat, node.lon);
        if (d < minDist) { minDist = d; closestId = id; }
    }
    return minDist < 0.2 ? closestId : null;
}

function getDist(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function runVisualization() {
    isAnimationRunning = true;
    visualizeBtn.disabled = true;
    resetAreaBtn.disabled = true;
    globalResetBtn.disabled = true;
    updateStatus('loading', 'AI is thinking...');

    const algo = algorithmSelect.value;
    let res = { visitedNodesInOrder: [], pathFound: [] };
    const t0 = performance.now();

    if (algo === 'bfs') res = breadthFirstSearch(startNodeId, endNodeId, graph.adjList);
    else if (algo === 'dfs') res = depthFirstSearch(startNodeId, endNodeId, graph.adjList);
    else res = dijkstra(startNodeId, endNodeId, graph.adjList);

    const t1 = performance.now();
    const delay = parseInt(speedSlider.value) === 100 ? 0 : 30 - (parseInt(speedSlider.value) * 0.28);

    await animateSearch(res.visitedNodesInOrder, res.pathFound, delay);

    statTime.innerText = (t1 - t0).toFixed(2);
    statNodes.innerText = res.visitedNodesInOrder.length;
    statPath.innerText = res.pathFound.length;
    
    let d = 0;
    for(let i=0; i<res.pathFound.length-1; i++) {
        const n1 = graph.nodes.get(res.pathFound[i]);
        const n2 = graph.nodes.get(res.pathFound[i+1]);
        d += getDist(n1.lat, n1.lon, n2.lat, n2.lon);
    }
    statDist.innerText = d.toFixed(3);
    statsPanel.classList.remove('hidden');

    isAnimationRunning = false;
    visualizeBtn.disabled = false;
    resetAreaBtn.disabled = false;
    globalResetBtn.disabled = false;
    setStep(4);
    updateStatus('online', 'Route Found');
}

async function animateSearch(visited, path, delay) {
    for (let i = 0; i < visited.length; i++) {
        const nId = visited[i];
        if (nId === startNodeId || nId === endNodeId) continue;
        const node = graph.nodes.get(nId);
        L.circleMarker([node.lat, node.lon], { radius: 3, fillColor: 'var(--visit-color)', color: '#7dd3fc', weight: 2, fillOpacity: 1, className: 'scanning-dot' }).addTo(uiLayers.vis);
        if (delay > 0 && i % 3 === 0) await new Promise(r => setTimeout(r, delay));
    }
    if (path.length > 0) {
        await new Promise(r => setTimeout(r, 300));
        for (let i = 0; i < path.length - 1; i++) {
            const p1 = graph.nodes.get(path[i]);
            const p2 = graph.nodes.get(path[i+1]);
            L.polyline([[p1.lat, p1.lon], [p2.lat, p2.lon]], { color: 'var(--path-color)', weight: 6, opacity: 1, lineCap: 'round' }).addTo(uiLayers.vis);
            await new Promise(r => setTimeout(r, 20));
        }
    } else alert("Target unreachable!");
}

function clearRoutingLayers() {
    uiLayers.vis.clearLayers();
    startNodeId = null;
    endNodeId = null;
    visualizeBtn.disabled = true;
    statsPanel.classList.add('hidden');
}

function resetFullState() {
    clearRoutingLayers();
    uiLayers.streets.clearLayers();
    uiLayers.selection.clearLayers();
    graph.nodes.clear();
    graph.adjList.clear();
    selectionPoints = [];
    scanRectangle = null;
    currentBBox = null;
    updateCityZoom();
}

function updateStatus(state, message) {
    statusIndicator.className = 'status-dot ' + state;
    statusText.innerText = message;
}

window.onload = initApp;
