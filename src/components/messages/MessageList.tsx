import React from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  messagesEndRef
}) => {
  // Group messages by date
  const groupedMessages: { [date: string]: Message[] } = {};
  
  messages.forEach(message => {
    const date = new Date(message.created_at).toLocaleDateString('de-DE');
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-400">
            <p>Keine Nachrichten</p>
            <p className="text-sm mt-1">Schreibe eine Nachricht, um die Konversation zu beginnen</p>
          </div>
        </div>
      ) : (
        Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date} className="space-y-3">
            <div className="flex justify-center">
              <div className="bg-white/10 px-3 py-1 rounded-full text-xs text-gray-300">
                {date === new Date().toLocaleDateString('de-DE') 
                  ? 'Heute' 
                  : date === new Date(Date.now() - 86400000).toLocaleDateString('de-DE')
                    ? 'Gestern'
                    : date}
              </div>
            </div>
            
            {dateMessages.map((message, index) => {
              const isSender = message.sender_id === currentUserId;
              const showTimestamp = index === dateMessages.length - 1 || 
                dateMessages[index + 1].sender_id !== message.sender_id;
              
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isSender
                        ? 'bg-purple-600 text-white rounded-tr-none'
                        : 'bg-white/10 text-white rounded-tl-none'
                    }`}
                  >
                    <p className="break-words">{message.content}</p>
                    {showTimestamp && (
                      <div className={`flex items-center justify-end text-xs mt-1 ${
                        isSender ? 'text-purple-200' : 'text-gray-400'
                      }`}>
                        {format(new Date(message.created_at), 'HH:mm', { locale: de })}
                        {isSender && message.is_read && (
                          <Check size={12} className="ml-1 text-blue-400" />
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;