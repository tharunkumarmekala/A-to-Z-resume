
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';

// Let's define the message type here since it's specific to this component's needs
interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

// Basic markdown parsing for chat bubbles
const parseMarkdown = (text: string) => {
    let html = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-2 rounded-md text-sm"><code>$1</code></pre>');
    html = html.replace(/`(.*?)`/g, '<code class="bg-gray-200 px-1 rounded">$1</code>');
    html = html.replace(/(?:\r\n|\r|\n)/g, '<br />');
    return { __html: html };
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-gray-50 rounded-lg border overflow-hidden relative">
       {/* Message container now has padding at the bottom to avoid being obscured by the input bar */}
       <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-24">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-md lg:max-w-lg px-4 py-3 rounded-xl shadow-sm ${
                msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-900 border'
              }`}
            >
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={parseMarkdown(msg.content)} />
            </div>
          </div>
        ))}
        {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
             <div className="flex justify-start">
                <div className="max-w-lg px-4 py-2 rounded-xl bg-white text-gray-800 border flex items-center shadow-sm">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2 text-sm text-gray-600">AI is thinking...</span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area is absolutely positioned to "float" at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-2 border-t bg-white/80 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask for changes or refinements..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition bg-white text-gray-900 placeholder-gray-500"
            rows={1}
            disabled={isLoading}
          />
          <Button onClick={handleSend} isLoading={isLoading} disabled={!input.trim()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};
