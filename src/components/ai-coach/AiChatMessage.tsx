import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dog, User } from 'lucide-react';

interface AiChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
  };
  isLastMessage: boolean;
}

const AiChatMessage: React.FC<AiChatMessageProps> = ({ message, isLastMessage }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const isAssistant = message.role === 'assistant';
  
  // Typing animation for assistant messages
  useEffect(() => {
    if (isAssistant && isLastMessage) {
      setIsTyping(true);
      let i = 0;
      const content = message.content;
      const typingInterval = setInterval(() => {
        if (i < content.length) {
          setDisplayedContent(content.substring(0, i + 1));
          i++;
        } else {
          clearInterval(typingInterval);
          setIsTyping(false);
        }
      }, 15); // Adjust speed as needed
      
      return () => clearInterval(typingInterval);
    } else {
      setDisplayedContent(message.content);
    }
  }, [message.content, isAssistant, isLastMessage]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
    >
      {isAssistant && (
        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3 flex-shrink-0">
          <Dog size={20} className="text-purple-400" />
        </div>
      )}
      
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isAssistant
            ? 'bg-white/10 text-white rounded-tl-none'
            : 'bg-purple-600 text-white rounded-tr-none'
        }`}
      >
        <div className="prose prose-invert max-w-none">
          {isAssistant ? (
            <div dangerouslySetInnerHTML={{ __html: displayedContent.replace(/\n/g, '<br>') }} />
          ) : (
            <p>{message.content}</p>
          )}
        </div>
        
        <div className={`text-xs mt-1 text-right ${
          isAssistant ? 'text-gray-400' : 'text-purple-200'
        }`}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {isTyping && <span className="ml-2">...</span>}
        </div>
      </div>
      
      {!isAssistant && (
        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center ml-3 flex-shrink-0">
          <User size={20} className="text-purple-400" />
        </div>
      )}
    </motion.div>
  );
};

export default AiChatMessage;