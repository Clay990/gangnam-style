
import React from 'react';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface ChatHistoryProps {
  chatHistory: ChatMessage[];
  isChatLoading: boolean;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ chatHistory, isChatLoading }) => {
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatLoading]);

  return (
    <div className="flex-grow overflow-y-auto space-y-4 pr-2">
      {chatHistory.map((msg, index) => (
        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-[80%] rounded-lg px-4 py-2 ${
              msg.role === 'user' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-200'
            }`}
          >
            {msg.role === 'model' ? (
              <div className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            ) : (
              <p className="whitespace-pre-wrap break-words">{msg.text}</p>
            )}
          </div>
        </div>
      ))}
      {isChatLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-700 text-gray-400 rounded-lg px-4 py-2">
            <span className="animate-pulse">Thinking...</span>
          </div>
        </div>
      )}
      <div ref={chatEndRef} />
    </div>
  );
};

export default ChatHistory;
