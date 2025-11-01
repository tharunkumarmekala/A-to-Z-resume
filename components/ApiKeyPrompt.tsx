import React from 'react';

interface ApiKeyPromptProps {
  onSelectKey: () => void;
  onDismiss: () => void;
}

export const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = ({ onSelectKey, onDismiss }) => {
  return (
    <div className="relative top-0 left-0 right-0 bg-red-600 text-white p-3 text-center shadow-lg z-50 flex flex-col sm:flex-row items-center justify-center text-sm">
      <p className="mb-2 sm:mb-0 sm:mr-4 text-center sm:text-left">
        There may be an issue with the API key or quota. You can switch to your own API key to continue. For more info, see the{' '}
        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline font-bold">
          Billing Documentation
        </a>.
      </p>
      <button
        onClick={onSelectKey}
        className="bg-white text-red-600 font-bold py-1 px-3 rounded hover:bg-red-100 transition-colors"
      >
        Select API Key
      </button>
      <button onClick={onDismiss} className="absolute top-1 right-2 sm:static sm:ml-2 text-2xl font-light hover:text-gray-200" aria-label="Dismiss">
        &times;
      </button>
    </div>
  );
};