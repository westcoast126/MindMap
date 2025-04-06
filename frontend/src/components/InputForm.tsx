import React, { useState } from 'react';

interface InputFormProps {
  selectedNodeId: string | null;
  onAddNode: (newNodeLabel: string, parentNodeId: string) => void;
}

const InputForm: React.FC<InputFormProps> = ({ selectedNodeId, onAddNode }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!inputValue.trim() || !selectedNodeId) return;

    // Call the parent function to add the new node and edge
    onAddNode(inputValue.trim(), selectedNodeId);
    setInputValue(''); // Clear input after adding
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-100 border-t">
      <label htmlFor="newNodeInput" className="block text-sm font-medium text-gray-700 mb-1">
        {selectedNodeId ? `Connect to "${selectedNodeId}"` : 'Select a word to connect to'}
      </label>
      <div className="flex space-x-2">
        <input
          type="text"
          id="newNodeInput"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter related word/phrase..."
          className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          disabled={!selectedNodeId} // Disable if no node is selected
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || !selectedNodeId}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Connect
        </button>
      </div>
       {/* TODO: Add validation feedback here (e.g., if connection is invalid based on backend response) */}
    </form>
  );
};

export default InputForm; 