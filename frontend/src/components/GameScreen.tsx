import React, { useState, useEffect, useCallback, useRef } from 'react';

// Frontend WordNode includes position
interface WordNode {
    id: string;
    word: string;
    parent_id?: string | null;
    x: number; // Position X
    y: number; // Position Y
}

// GameState uses the frontend WordNode with position
interface GameState {
    game_id: string;
    puzzle_id: string;
    start_word: string;
    theme: string;
    time_limit_seconds: number;
    start_time?: number | null;
    nodes: Record<string, WordNode>;
    connections: Array<[string, string]>;
    score: number;
    is_active: boolean;
}

// Backend response structure (doesn't include x, y)
interface BackendWordNode {
    id: string;
    word: string;
    parent_id?: string | null;
}

interface BackendGameState {
    game_id: string;
    puzzle_id: string;
    start_word: string;
    theme: string;
    time_limit_seconds: number;
    start_time?: number | null;
    nodes: Record<string, BackendWordNode>; // Nodes from backend
    connections: Array<[string, string]>;
    score: number;
    is_active: boolean;
}


// TODO: Define props if this component receives data from a parent
interface GameScreenProps {
    puzzleId: string; // Example: Pass the puzzle ID to start
}

// Get the backend URL based on environment
const API_BASE_URL = window.location.hostname.includes('github.dev')
    ? `https://${window.location.hostname.replace('5173', '8001')}`
    : 'http://127.0.0.1:8001';

console.log('Using API URL:', API_BASE_URL); // Debug log

const NODE_OFFSET_X = 100; // How far horizontally new nodes appear from parent
const NODE_OFFSET_Y = 50;  // How far vertically new nodes appear from parent
const NODE_AREA_WIDTH = 500; // Approx width of map area for initial placement
const NODE_AREA_HEIGHT = 400; // Approx height

// Function to calculate positions for nodes received from backend
const assignPositionsToNodes = (backendNodes: Record<string, BackendWordNode>, existingNodes?: Record<string, WordNode>): Record<string, WordNode> => {
    const positionedNodes: Record<string, WordNode> = {};
    const nodesToProcess = Object.values(backendNodes);

    // Find the root node (no parent_id)
    const rootNodeBackend = nodesToProcess.find(n => !n.parent_id);

    if (!rootNodeBackend) {
        // Fallback if root isn't obvious (shouldn't happen with current backend logic)
        console.error("Could not find root node");
        let currentX = 50;
        let currentY = 50;
        for (const node of nodesToProcess) {
            positionedNodes[node.id] = {
                ...node,
                x: existingNodes?.[node.id]?.x ?? currentX,
                y: existingNodes?.[node.id]?.y ?? currentY
            };
            currentX += 100;
        }
        return positionedNodes;
    }

    // Use BFS or DFS to assign positions relative to parent
    const queue: Array<{ nodeId: string; parentX: number; parentY: number, depth: number }> = [];
    const assigned = new Set<string>();

    // Start with root node at the center
    const rootX = NODE_AREA_WIDTH / 2;
    const rootY = 50; // Start near top-center
    positionedNodes[rootNodeBackend.id] = { ...rootNodeBackend, x: rootX, y: rootY };
    assigned.add(rootNodeBackend.id);
    queue.push({ nodeId: rootNodeBackend.id, parentX: rootX, parentY: rootY, depth: 0 });

    let head = 0;
    while(head < queue.length) {
        const { nodeId, parentX, parentY, depth } = queue[head++];
        const children = nodesToProcess.filter(n => n.parent_id === nodeId);
        let childIndex = 0;
        const childrenCount = children.length;

        for (const child of children) {
            if (!assigned.has(child.id)) {
                 // Try to place children around parent, alternating sides
                 const angle = (Math.PI / (childrenCount + 1)) * (childIndex + 1);
                 const offsetX = Math.cos(angle) * NODE_OFFSET_X * (depth + 1) * 0.5; // Spread increases with depth slightly
                 const offsetY = Math.sin(angle) * NODE_OFFSET_Y * (1.5); // Fixed vertical offset relative to angle

                 // Simple alternative: alternate left/right
                 //const offsetX = (childIndex % 2 === 0 ? -NODE_OFFSET_X : NODE_OFFSET_X);
                 //const offsetY = NODE_OFFSET_Y * (Math.floor(childIndex / 2) + 1);

                const childX = parentX + offsetX;
                const childY = parentY + offsetY;

                positionedNodes[child.id] = {
                    ...child,
                    x: existingNodes?.[child.id]?.x ?? childX, // Use existing position if available
                    y: existingNodes?.[child.id]?.y ?? childY,
                };
                assigned.add(child.id);
                queue.push({ nodeId: child.id, parentX: childX, parentY: childY, depth: depth + 1 });
                childIndex++;
            }
        }
    }

     // Add any nodes missed by the traversal (shouldn't happen with tree structure)
    for (const node of nodesToProcess) {
        if (!assigned.has(node.id)) {
            console.warn(`Node ${node.id} missed in position assignment, placing randomly.`);
            positionedNodes[node.id] = {
                ...node,
                 x: existingNodes?.[node.id]?.x ?? Math.random() * NODE_AREA_WIDTH,
                 y: existingNodes?.[node.id]?.y ?? Math.random() * NODE_AREA_HEIGHT
            };
            assigned.add(node.id);
        }
    }

    return positionedNodes;
};

const GameScreen: React.FC<GameScreenProps> = ({ puzzleId }) => {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [newWord, setNewWord] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [hasLoaded, setHasLoaded] = useState(false); // For fade-in effect

    // --- Game Timer ---
    useEffect(() => {
        if (!gameState || !gameState.is_active || !gameState.start_time || !gameState.time_limit_seconds) {
            setTimeLeft(null);
            return;
        }

        const calculateTimeLeft = () => {
            const now = Date.now() / 1000; // Convert ms to seconds
            const elapsed = now - (gameState.start_time || now);
            const remaining = Math.max(0, gameState.time_limit_seconds - elapsed);
            // DEBUG: Log time calculation
            // console.log(`DEBUG TIMER: now=${now}, start=${gameState.start_time}, elapsed=${elapsed}, limit=${gameState.time_limit_seconds}, remaining=${remaining}`);
            setTimeLeft(Math.round(remaining));

            if (remaining <= 0 && gameState.is_active) { // Only set inactive once
                console.log("DEBUG: Time's up! Setting game inactive.");
                setGameState(prev => prev ? { ...prev, is_active: false } : null);
            }
        };

        calculateTimeLeft(); // Initial calculation
        const timerInterval = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timerInterval); // Cleanup interval on unmount or game state change

    }, [gameState]);

    // --- API Interaction ---

    // Function to start a new game
    const startGame = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setGameState(null);
        setHasLoaded(false); // Reset loaded state for new game
        try {
            const response = await fetch(`${API_BASE_URL}/puzzles/${puzzleId}/start`, {
                method: 'POST',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            const backendData: BackendGameState = await response.json();

            // Assign initial positions
            const positionedNodes = assignPositionsToNodes(backendData.nodes);

            setGameState({
                ...backendData,
                nodes: positionedNodes, // Use nodes with positions
            });

            setSelectedNodeId(backendData.start_word); // Select start node initially
            setTimeLeft(backendData.time_limit_seconds); // Initialize timer display
            setHasLoaded(true); // Trigger fade-in
        } catch (err) {
            console.error("Failed to start game:", err);
            setError(err instanceof Error ? err.message : 'Failed to start game');
            setHasLoaded(false); // Ensure fade-in doesn't happen on error
        } finally {
            setIsLoading(false);
        }
    }, [puzzleId]);

    // Function to add a word connection
    const handleAddConnection = useCallback(async (event: React.FormEvent) => {
        event.preventDefault();
        if (!gameState || !selectedNodeId || !newWord.trim() || !gameState.is_active) {
            setError("Cannot add connection: Game not active, no node selected, or word is empty.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/games/${gameState.game_id}/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    parent_node_id: selectedNodeId,
                    new_word: newWord.trim(),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                // If time ran out, the backend might return an error but also update is_active
                if (response.status === 400 && errorData.detail === "Time limit exceeded") {
                     setGameState(prev => prev ? { ...prev, is_active: false } : null);
                }
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const updatedBackendState: BackendGameState = await response.json();

            // Assign positions, preserving existing ones
            const updatedPositionedNodes = assignPositionsToNodes(updatedBackendState.nodes, gameState.nodes);

            setGameState({
                ...updatedBackendState,
                nodes: updatedPositionedNodes, // Use newly positioned nodes
            });

            setNewWord(''); // Clear input field
            // Keep the parent node selected for now, or select the new node:
            // setSelectedNodeId(newWord.trim().toLowerCase()); // Backend uses lower case for ID
        } catch (err) {
            console.error("Failed to add connection:", err);
            setError(err instanceof Error ? err.message : 'Failed to add connection');
        } finally {
            setIsLoading(false);
        }
    }, [gameState, selectedNodeId, newWord]);

    // --- Effects ---

    // Start the game when the component mounts or puzzleId changes
    useEffect(() => {
        startGame();
    }, [startGame]); // Dependency array includes the memoized startGame function

    // --- Rendering Logic ---

    // TODO: Implement the actual mind map visualization (e.g., using SVG, Canvas, or a library like react-flow)
    const renderMindMap = () => {
        if (!gameState) return null; // Render nothing until loaded

        const nodes = Object.values(gameState.nodes);
        const edges = gameState.connections.map(([parentId, childId]) => {
            const parentNode = gameState.nodes[parentId];
            const childNode = gameState.nodes[childId];
            if (!parentNode || !childNode) return null;
            return {
                id: `${parentId}-${childId}`,
                sourceX: parentNode.x,
                sourceY: parentNode.y + 30, // Offset source/target Y to connect bottom/top of circles
                targetX: childNode.x,
                targetY: childNode.y - 30,
            };
        }).filter(edge => edge !== null);

        const padding = 50;
        const maxX = Math.max(...nodes.map(n => n.x), NODE_AREA_WIDTH) + padding;
        const maxY = Math.max(...nodes.map(n => n.y), NODE_AREA_HEIGHT) + padding;
        const minX = Math.min(...nodes.map(n => n.x), 0) - padding;
        const minY = Math.min(...nodes.map(n => n.y), 0) - padding;
        const viewWidth = Math.max(maxX - minX, NODE_AREA_WIDTH + padding * 2);
        const viewHeight = Math.max(maxY - minY, NODE_AREA_HEIGHT + padding * 2);

        return (
            <div
                ref={mapContainerRef}
                className={`mind-map-area w-full flex-grow border-none rounded bg-transparent min-h-[400px] overflow-auto relative transition-opacity duration-500 ease-in ${hasLoaded ? 'opacity-100' : 'opacity-0'}`}
            >
                 <svg width={viewWidth} height={viewHeight} viewBox={`${minX} ${minY} ${viewWidth} ${viewHeight}`} style={{ minWidth: '100%', minHeight: '100%' }}>
                    {/* Render Edges (Lines) */}
                    <g className="edges">
                        {edges.map(edge => edge && (
                            <line
                                key={edge.id}
                                x1={edge.sourceX}
                                y1={edge.sourceY}
                                x2={edge.targetX}
                                y2={edge.targetY}
                                stroke="#a8a29e" // gray-400 equivalent, softer
                                strokeWidth={1.5}
                            />
                        ))}
                    </g>

                    {/* Render Nodes (Circles + Text) - NYT Style */}
                    <g className="nodes">
                        {nodes.map(node => (
                            <g
                                key={node.id}
                                transform={`translate(${node.x}, ${node.y})`}
                                onClick={() => {
                                    // DEBUG: Log click event
                                    console.log(`DEBUG CLICK: Node '${node.id}' clicked. Game active? ${gameState?.is_active}`);
                                    if (gameState?.is_active) {
                                        setSelectedNodeId(node.id);
                                        console.log(`DEBUG CLICK: Set selectedNodeId to '${node.id}'`);
                                    } else {
                                        console.log(`DEBUG CLICK: Game not active, selection prevented.`);
                                    }
                                }}
                                // Added transition for hover effect
                                className={`cursor-pointer group transform transition-transform duration-150 ease-in-out ${gameState?.is_active ? 'hover:scale-105' : 'opacity-70'}`}
                                style={{ filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.1))' }} // Soft shadow
                            >
                                <circle
                                    r={35} // Slightly larger radius
                                    // Purple accent for selected, white otherwise. Subtle border.
                                    fill={selectedNodeId === node.id ? '#6a0dad' : '#ffffff'}
                                    stroke={selectedNodeId === node.id ? '#6a0dad' : '#d1d5db'} // Purple or gray border
                                    strokeWidth={selectedNodeId === node.id ? 2 : 1}
                                />
                                <text
                                    fontFamily="Inter, Helvetica Neue, sans-serif" // NYT-like sans-serif
                                    textAnchor="middle"
                                    dy=".3em"
                                    fill={selectedNodeId === node.id ? '#ffffff' : '#1f2937'} // White on purple, dark gray on white
                                    fontSize="13"
                                    fontWeight="500" // medium
                                >
                                    {node.word}
                                </text>
                            </g>
                        ))}
                    </g>
                </svg>
            </div>
        );
    };

    // DEBUG: Log state before render
    console.log(`DEBUG RENDER: isLoading=${isLoading}, error=${error}, gameActive=${gameState?.is_active}, selectedNodeId=${selectedNodeId}`);

    // --- Component Return ---

    if (isLoading && !gameState) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#f5f5dc]">
                <p className="text-gray-600 font-sans">Loading Game...</p>
                {/* Optional: Add a simple spinner */} 
            </div>
        );
    }

    if (error && !gameState) {
        // Show fatal error if game couldn't even start
        return (
             <div className="flex items-center justify-center min-h-screen bg-[#f5f5dc]">
                <p className="text-red-600 font-sans">Error loading game: {error}</p>
            </div>
        );
    }

    if (!gameState) {
        // Should ideally not be reached if startGame is called on mount, but good fallback
        return <div>Initializing...</div>;
    }

    return (
        // Main container with beige background and centered content
        <div className="flex flex-col items-center min-h-screen bg-[#f5f5dc] p-4 font-sans text-gray-800">
            {/* Header: Title + Game Info (Timer/Score) */} 
            <header className="w-full max-w-4xl flex justify-between items-center mb-6 px-2">
                 {/* Title with Icon placeholder */} 
                 <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 flex items-center">
                     {/* Placeholder for Purple Icon */} 
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="#6a0dad" className="mr-2">
                         {/* Simple placeholder shape */} 
                         <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                     </svg>
                    MindMap
                </h1>
                {/* Game Status Info */} 
                <div className="flex items-center space-x-4 text-sm text-gray-700">
                    {/* Score - TODO: Add Moves Counter later */} 
                     <span>Score: <span className="font-semibold">{gameState?.score ?? 0}</span></span>
                     {/* Timer */} 
                    {timeLeft !== null && gameState?.is_active && (
                        <span className={`font-semibold ${timeLeft < 30 ? 'text-red-600' : 'text-gray-800'}`}>
                            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                        </span>
                    )}
                    {!gameState?.is_active && <span className="text-red-600 font-bold">Game Over</span>}
                </div>
            </header>

            {/* Main Game Area (Mind Map SVG) */} 
            <main className="w-full max-w-4xl flex-grow flex flex-col items-center justify-center mb-4">
                {renderMindMap()}
            </main>

            {/* Input Area */} 
            {gameState?.is_active && (
                <footer className="w-full max-w-md mb-4">
                    <form onSubmit={handleAddConnection} className="flex gap-2 items-center">
                         <input
                            type="text"
                            value={newWord}
                            onChange={(e) => setNewWord(e.target.value)}
                            placeholder={selectedNodeId ? `Connect to "${gameState.nodes[selectedNodeId]?.word ?? '...'}"` : "Select a word to connect"}
                            disabled={!selectedNodeId || isLoading}
                            className={`flex-grow p-2.5 border rounded-md text-base font-sans bg-white
                                        ${!selectedNodeId ? 'border-gray-300 placeholder-gray-400' : 'border-[#6a0dad] ring-1 ring-[#6a0dad] placeholder-gray-500'}
                                        disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out
                                        focus:outline-none focus:ring-2 focus:ring-[#6a0dad] focus:border-transparent`}
                            aria-label="New word"
                        />
                        <button
                            type="submit"
                            disabled={!selectedNodeId || !newWord.trim() || isLoading}
                            // NYT-style button: minimal, bold hover, purple accent
                            className={`px-5 py-2.5 rounded-md border border-gray-800 bg-white text-gray-900 font-semibold text-sm
                                        hover:bg-gray-900 hover:text-white
                                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6a0dad]
                                        disabled:bg-gray-200 disabled:text-gray-500 disabled:border-gray-300 disabled:cursor-not-allowed
                                        transition-all duration-150 ease-in-out`}
                        >
                            {isLoading ? 'Adding...' : 'Add'}
                        </button>
                    </form>
                </footer>
            )}

             {/* Error display at bottom */} 
             {error && <p className="text-red-600 mt-2 text-sm">Error: {error}</p>}

        </div>
    );
};

export default GameScreen; 