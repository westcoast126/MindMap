import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

// Simple node component displaying the word/phrase
const MindMapNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-stone-400">
      <div className="text-center font-bold">{data.label}</div>
      {/* Handles for connecting edges */}
      {/* Allow connections from any side */}
      <Handle type="target" position={Position.Top} className="w-2 !bg-teal-500" />
      <Handle type="source" position={Position.Top} className="w-2 !bg-teal-500" />
      <Handle type="target" position={Position.Right} className="h-2 !bg-teal-500" />
      <Handle type="source" position={Position.Right} className="h-2 !bg-teal-500" />
      <Handle type="target" position={Position.Bottom} className="w-2 !bg-teal-500" />
      <Handle type="source" position={Position.Bottom} className="w-2 !bg-teal-500" />
      <Handle type="target" position={Position.Left} className="h-2 !bg-teal-500" />
      <Handle type="source" position={Position.Left} className="h-2 !bg-teal-500" />
    </div>
  );
};

export default memo(MindMapNode); 