
import React from 'react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSend: () => void;
  isChatLoading: boolean;
  user: any; 
}

const ChatInput: React.FC<ChatInputProps> = ({ input, setInput, handleSend, isChatLoading, user }) => {
  return (
    <div className="mt-4 flex">
      <input
        type="text"
        placeholder={user ? "Ask me anything..." : "Please sign in to chat"}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !isChatLoading && handleSend()}
        disabled={!user || isChatLoading}
        className="flex-grow bg-gray-800 text-white rounded-l-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50"
      />
      <button
        onClick={handleSend}
        disabled={!user || isChatLoading || !input.trim()}
        className="bg-red-600 text-white px-6 rounded-r-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </div>
  );
};

export default ChatInput;
