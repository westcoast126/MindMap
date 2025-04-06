import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Connection,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  NodeChange,
} from 'reactflow';

// Import custom node type
import MindMapNode from './Node';

// Import styles for reactflow
import 'reactflow/dist/style.css';

// Initial game state placeholders
const initialNodes: Node[] = [
  { id: 'StartNode', data: { label: 'Start Word' }, position: { x: 250, y: 5 }, type: 'mindMapNode' },
];
const initialEdges: Edge[] = [];

interface GameboardProps {
  startWord: string;
  onNodeAdded: (newNodeLabel: string, parentNodeId: string) => boolean; // Returns true if successful
  onGameEnd: (finalScore: number, moves: number) => void;
  setMoves: React.Dispatch<React.SetStateAction<number>>;
  // Add puzzleId, timeLimit etc. as needed
}

let idCounter = 0;
const getNodeId = () => `node_${++idCounter}`;

const Gameboard: React.FC<GameboardProps> = ({ startWord, onNodeAdded, onGameEnd, setMoves }) => {
  // Define custom node types
  const nodeTypes: NodeTypes = useMemo(() => ({ mindMapNode: MindMapNode }), []);

  const [nodes, setNodes] = useState<Node[]>([{ 
      id: 'StartNode', 
      data: { label: startWord || 'Start' }, // Use prop
      position: { x: 250, y: 5 }, 
      type: 'mindMapNode' 
  }]);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Reset board when startWord changes
  useEffect(() => {
      idCounter = 0; // Reset node ID counter
      setNodes([{ 
          id: 'StartNode', 
          data: { label: startWord || 'Start' }, 
          position: { x: 250, y: 5 }, 
          type: 'mindMapNode' 
      }]);
      setEdges([]);
      setSelectedNodeId(null);
  }, [startWord]);

  // Handlers for reactflow changes (node drag, selection, etc.)
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
        setNodes((nds) => applyNodeChanges(changes, nds));
        // Update selected node ID on selection change
        changes.forEach((change) => {
            if (change.type === 'select') {
                if (change.selected) {
                    setSelectedNodeId(change.id);
                } else if (selectedNodeId === change.id) {
                    // Deselect if the currently selected node is deselected
                    setSelectedNodeId(null);
                }
            }
        });
    },
    [setNodes, selectedNodeId]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  // Handler for connecting nodes manually (we might disable this)
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  // Handler for adding a new node via the InputForm
  const handleAddNode = useCallback((newNodeLabel: string, parentNodeId: string) => {
    // TODO: Add validation logic here (call backend?) - using onNodeAdded prop for now
    const isValidConnection = onNodeAdded(newNodeLabel, parentNodeId);

    if (isValidConnection) {
        const newNodeId = getNodeId();
        // Position new nodes somewhat predictably (needs improvement)
        const parentNode = nodes.find(n => n.id === parentNodeId);
        const position = parentNode ? { 
            x: parentNode.position.x + (Math.random() * 400 - 200), // Spread horizontally
            y: parentNode.position.y + 100 + (Math.random() * 50) // Move down
        } : { x: 100, y: 100 }; 

        const newNode: Node = {
            id: newNodeId,
            data: { label: newNodeLabel },
            position,
            type: 'mindMapNode',
        };

        const newEdge: Edge = {
            id: `edge_${parentNodeId}-${newNodeId}`,
            source: parentNodeId,
            target: newNodeId,
            // type: 'smoothstep', // Optional edge type
        };

        setNodes((nds) => nds.concat(newNode));
        setEdges((eds) => eds.concat(newEdge));
        setMoves((m) => m + 1); // Increment moves count

        // Optionally, select the newly added node
        // Need to handle selection changes carefully if doing this
        // setSelectedNodeId(newNodeId);
    } else {
        // TODO: Show error message to user if connection is invalid
        console.log(`Connection from ${parentNodeId} to ${newNodeLabel} is invalid.`);
    }
  }, [nodes, setNodes, setEdges, onNodeAdded, setMoves]);


  return (
    <div style={{ height: '100%', width: '100%' }} className="bg-gradient-to-br from-blue-50 to-indigo-100">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect} // Can disable if only adding via form
        nodeTypes={nodeTypes}
        fitView // Zoom/pan to fit nodes initially
        // Pro options can hide attribution
        // proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
      {/* Return selectedNodeId to parent for InputForm */}
      {/* This isn't ideal state management - consider Zustand or Context later */}
      {/* We pass handleAddNode down instead */} 
      {/* <input type="hidden" value={selectedNodeId || ''} /> */} 
    </div>
  );
};

export default Gameboard; 