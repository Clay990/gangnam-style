
import React from 'react';

type AIModel = 'flash' | 'pro';

interface ModelSelectorProps {
  selectedModel: AIModel;
  setSelectedModel: (model: AIModel) => void;
  isChatLoading: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, setSelectedModel, isChatLoading }) => {
  return (
    <div className="mt-4 sm:mt-6 flex justify-center items-center space-x-2">
      <button
        onClick={() => setSelectedModel('flash')}
        disabled={isChatLoading}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
          selectedModel === 'flash'
            ? 'bg-red-600 text-white shadow-lg'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        Gamma (Free)
      </button>
      <button
        onClick={() => setSelectedModel('pro')}
        disabled={isChatLoading}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
          selectedModel === 'pro'
            ? 'bg-red-600 text-white shadow-lg'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        Gemini 2.5 Pro (1 Credit)
      </button>
    </div>
  );
};

export default ModelSelector;
