// components/IDImageViewer.jsx
import React from "react";

const IDImageViewer = ({ imageUrl, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-4xl max-h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Valid ID Image</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="flex justify-center">
          <img
            src={imageUrl}
            alt="Valid ID"
            className="max-w-full max-h-96 object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default IDImageViewer;
