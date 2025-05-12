import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { User } from 'lucide-react';

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  updated_at: string;
  other_user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unread_count: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  currentUserId: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  currentUserId
}) => {
  return (
    <div className="overflow-y-auto">
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          onClick={() => onSelectConversation(conversation)}
          className={`w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors ${
            selectedConversation?.id === conversation.id ? 'bg-white/10' : ''
          }`}
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              {conversation.other_user.avatar_url ? (
                <img
                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${conversation.other_user.avatar_url}`}
                  alt={conversation.other_user.username}
                  className="w-full h-full rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <User size={20} className="text-purple-400" />
              )}
            </div>
            {conversation.unread_count > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {conversation.unread_count}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold truncate">
                {conversation.other_user.username}
              </h3>
              {conversation.last_message && (
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(conversation.last_message.created_at), {
                    addSuffix: true,
                    locale: de
                  })}
                </span>
              )}
            </div>
            {conversation.last_message ? (
              <p className={`text-sm truncate ${conversation.unread_count > 0 ? 'font-medium text-white' : 'text-gray-400'}`}>
                {conversation.last_message.sender_id === currentUserId ? 'Du: ' : ''}
                {conversation.last_message.content}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">Keine Nachrichten</p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};

export default ConversationList;