import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiX, FiSend, FiUser } from 'react-icons/fi';
import { db } from '../../firebase/firebase';
import { doc, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const ChatPanel = ({ projectId, members = [] }) => {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const messageInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to messages
  useEffect(() => {
    if (!projectId) return;

    const messagesRef = collection(db, 'projects', projectId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'), limit(100));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse();
      
      setMessages(newMessages);
      setIsLoading(false);
      scrollToBottom();
    }, (error) => {
      console.error('Error loading messages:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [projectId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    setNewMessage(text);

    // Handle @mentions
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = text.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const searchText = textBeforeCursor.slice(lastAtIndex + 1);
      setMentionSearch(searchText);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const handleMention = (member) => {
    const textBeforeCursor = newMessage.slice(0, messageInputRef.current.selectionStart);
    const textAfterCursor = newMessage.slice(messageInputRef.current.selectionStart);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    const newText = textBeforeCursor.slice(0, lastAtIndex) + 
      '@' + member + ' ' + 
      textAfterCursor;
    
    setNewMessage(newText);
    setShowMentions(false);
    messageInputRef.current.focus();
  };

  const extractMentions = (text) => {
    const mentions = text.match(/@[\w.-]+@[\w.-]+/g) || [];
    return mentions.map(mention => mention.slice(1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const mentions = extractMentions(newMessage);
      const messageData = {
        content: newMessage,
        author: currentUser.email,
        authorName: currentUser.displayName || currentUser.email.split('@')[0],
        timestamp: serverTimestamp(),
        mentions
      };

      // Add message to Firestore
      const messagesRef = collection(db, 'projects', projectId, 'messages');
      await addDoc(messagesRef, messageData);

      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredMembers = members.filter(member =>
    member.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-violet-500 text-white rounded-full shadow-lg hover:bg-violet-600 transition-colors"
      >
        <FiMessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-96 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-slate-700 flex items-center justify-between">
              <h3 className="text-white font-medium">Project Chat</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-violet-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.author === currentUser.email ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.author === currentUser.email
                          ? 'bg-violet-500 text-white'
                          : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <FiUser className="w-4 h-4" />
                        <span className="text-sm font-medium">{message.authorName}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <span className="text-xs opacity-75 mt-1 block">
                        {message.timestamp ? formatDistanceToNow(message.timestamp.toDate(), { addSuffix: true }) : 'Just now'}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 bg-slate-700">
              <div className="relative">
                <textarea
                  ref={messageInputRef}
                  value={newMessage}
                  onChange={handleInputChange}
                  placeholder="Type a message... Use @ to mention someone"
                  className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  rows="2"
                />
                {showMentions && filteredMembers.length > 0 && (
                  <div className="absolute bottom-full left-0 w-full bg-slate-800 border border-slate-600 rounded-lg mt-1 max-h-40 overflow-y-auto">
                    {filteredMembers.map(member => (
                      <button
                        key={member}
                        type="button"
                        onClick={() => handleMention(member)}
                        className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 focus:outline-none"
                      >
                        {member.split('@')[0]}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  type="submit"
                  className="absolute right-2 bottom-2 p-2 text-violet-500 hover:text-violet-400 transition-colors"
                >
                  <FiSend className="w-5 h-5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPanel; 