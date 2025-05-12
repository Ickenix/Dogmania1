import React, { useState } from 'react';
import { MoreVertical, Flag, Ban, Trash2 } from 'lucide-react';
import ReportUserModal from './ReportUserModal';
import BlockUserModal from './BlockUserModal';
import DeleteChatModal from './DeleteChatModal';

interface ChatOptionsProps {
  userId: string;
  username: string;
  conversationId: string;
  onConversationDeleted: () => void;
}

const ChatOptions: React.FC<ChatOptionsProps> = ({ 
  userId, 
  username, 
  conversationId,
  onConversationDeleted
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        aria-label="Chat options"
      >
        <MoreVertical size={20} />
      </button>
      
      {showOptions && (
        <div className="absolute right-0 mt-2 w-48 bg-blue-900/90 backdrop-blur-lg rounded-lg shadow-lg overflow-hidden z-10">
          <button
            onClick={() => {
              setShowOptions(false);
              setShowReportModal(true);
            }}
            className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center space-x-2 text-red-400"
          >
            <Flag size={16} />
            <span>Nutzer melden</span>
          </button>
          <button
            onClick={() => {
              setShowOptions(false);
              setShowBlockModal(true);
            }}
            className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center space-x-2 text-red-400"
          >
            <Ban size={16} />
            <span>Nutzer blockieren</span>
          </button>
          <button
            onClick={() => {
              setShowOptions(false);
              setShowDeleteModal(true);
            }}
            className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center space-x-2"
          >
            <Trash2 size={16} />
            <span>Chat löschen</span>
          </button>
        </div>
      )}
      
      {showReportModal && (
        <ReportUserModal
          userId={userId}
          username={username}
          onClose={() => setShowReportModal(false)}
        />
      )}
      
      {showBlockModal && (
        <BlockUserModal
          userId={userId}
          username={username}
          onClose={() => setShowBlockModal(false)}
          onBlock={() => {
            // In a real app, you would handle the blocking logic
            onConversationDeleted();
          }}
        />
      )}
      
      {showDeleteModal && (
        <DeleteChatModal
          conversationId={conversationId}
          onClose={() => setShowDeleteModal(false)}
          onDelete={onConversationDeleted}
        />
      )}
    </div>
  );
};

export default ChatOptions;