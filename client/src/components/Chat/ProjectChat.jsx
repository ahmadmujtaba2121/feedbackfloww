import React, { useState, useEffect, useRef } from 'react';
import { FiSend, FiPaperclip, FiSmile, FiCheck, FiX, FiSearch, FiUser } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { db, storage } from '../../firebase/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, doc, limit, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import EmojiPicker from 'emoji-picker-react';
import { toast } from 'react-hot-toast';

const ProjectChat = ({ projectId, isOpen, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [memberSuggestions, setMemberSuggestions] = useState([]);
    const [showMemberSuggestions, setShowMemberSuggestions] = useState(false);
    const [projectMembers, setProjectMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [mentionIndex, setMentionIndex] = useState(-1);
    const [mentionText, setMentionText] = useState('');
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const { currentUser } = useAuth();
    const { createNotification } = useNotification();
    const { theme } = useTheme();
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const chatContainerRef = useRef(null);
    const lastMessageRef = useRef(null);

    // Theme-based styles based on all 8 presets
    const themeStyles = {
        container: `fixed right-0 top-0 h-full w-[380px] shadow-2xl flex flex-col z-50 border-l 
            bg-background border-border`,
        header: `px-6 py-4 bg-card border-b border-border flex justify-between items-center`,
        messageArea: `flex-1 overflow-y-auto p-6 space-y-6 bg-background 
            scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent`,
        inputArea: `p-4 bg-card border-t border-border`,
        messageReceived: `bg-accent/90 text-accent-foreground shadow-sm`,
        messageSent: `bg-primary/90 text-primary-foreground shadow-sm`,
        inputField: `bg-input text-foreground placeholder-muted-foreground/70 
            border-border focus:border-primary focus:ring-primary/50`,
        iconButton: `text-muted-foreground hover:text-primary hover:bg-accent/10`,
        sendButton: `bg-primary text-primary-foreground hover:bg-primary/90`,
        mentionList: `bg-card border-border shadow-lg`,
        mentionItem: `hover:bg-accent/10 text-foreground`,
        mentionHighlight: `text-primary`,
        filePreview: `border-border/10`,
        loadingSpinner: `border-primary`
    };

    useEffect(() => {
        if (!projectId) return;

        // Fetch project members
        const projectRef = doc(db, 'projects', projectId);
        const unsubscribeMembers = onSnapshot(projectRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setProjectMembers(data.members || []);
            }
        });

        // Fetch messages with pagination
        const loadMessages = async () => {
            const messagesRef = collection(db, 'projects', projectId, 'messages');
            const q = query(
                messagesRef,
                orderBy('timestamp', 'desc'),
                limit(50)
            );

            const unsubscribeMessages = onSnapshot(q, (snapshot) => {
                const newMessages = snapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                    .reverse();
                setMessages(newMessages);
                scrollToBottom();
            });

            return unsubscribeMessages;
        };

        const unsubMessages = loadMessages();

        return () => {
            unsubscribeMembers();
            if (typeof unsubMessages === 'function') {
                unsubMessages();
            }
        };
    }, [projectId]);

    // Handle scroll to load more messages
    const handleScroll = async (e) => {
        const { scrollTop } = e.target;
        if (scrollTop === 0 && !isLoadingMore && hasMore) {
            setIsLoadingMore(true);
            const messagesRef = collection(db, 'projects', projectId, 'messages');
            const q = query(
                messagesRef,
                orderBy('timestamp', 'desc'),
                limit(50),
                where('timestamp', '<', messages[0]?.timestamp)
            );

            const snapshot = await getDocs(q);
            const newMessages = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .reverse();

            if (newMessages.length < 50) {
                setHasMore(false);
            }

            setMessages(prev => [...newMessages, ...prev]);
            setIsLoadingMore(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Unsupported file type. Please upload JPG, PNG, SVG or PDF files.');
            return;
        }

        try {
            setUploading(true);
            const storageRef = ref(storage, `projects/${projectId}/chat/${Date.now()}_${file.name}`);

            // Upload file to Firebase Storage
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // Add message with file to Firestore
            const messagesRef = collection(db, 'projects', projectId, 'messages');
            await addDoc(messagesRef, {
                sender: currentUser.email,
                senderName: currentUser.displayName || currentUser.email,
                content: '',
                fileUrl: downloadURL,
                fileName: file.name,
                fileType: file.type,
                timestamp: serverTimestamp(),
                seen: [],
                mentions: []
            });

            toast.success('File uploaded successfully');
            scrollToBottom();
        } catch (error) {
            console.error('Error uploading file:', error);
            toast.error('Failed to upload file');
        } finally {
            setUploading(false);
            // Clear the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleMention = (member) => {
        const beforeMention = newMessage.substring(0, newMessage.lastIndexOf('@'));
        const afterMention = newMessage.substring(newMessage.lastIndexOf('@') + mentionText.length + 1);
        setNewMessage(`${beforeMention}@${member.email} ${afterMention}`);
        setShowMemberSuggestions(false);
        setMentionText('');
    };

    const handleMessageChange = (e) => {
        const value = e.target.value;
        setNewMessage(value);

        // Handle mentions
        const lastAtIndex = value.lastIndexOf('@');
        if (lastAtIndex !== -1) {
            const textAfterAt = value.slice(lastAtIndex + 1);
            const spaceAfterAt = textAfterAt.indexOf(' ');
            const searchText = spaceAfterAt === -1 ? textAfterAt : textAfterAt.slice(0, spaceAfterAt);

            if (searchText) {
                setMentionText(searchText);
                const filtered = projectMembers.filter(member =>
                    member.email.toLowerCase().includes(searchText.toLowerCase()) ||
                    (member.displayName && member.displayName.toLowerCase().includes(searchText.toLowerCase()))
                );
                setMemberSuggestions(filtered);
                setShowMemberSuggestions(filtered.length > 0);
            } else {
                setShowMemberSuggestions(false);
            }
        } else {
            setShowMemberSuggestions(false);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() && !fileInputRef.current?.files[0]) return;

        try {
            const mentions = [];
            const mentionRegex = /@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
            let match;
            while ((match = mentionRegex.exec(newMessage)) !== null) {
                mentions.push(match[1]);
            }

            const messageData = {
                sender: currentUser.email,
                senderName: currentUser.displayName || currentUser.email,
                content: newMessage.trim(),
                timestamp: serverTimestamp(),
                seen: [],
                mentions
            };

            // Add message to Firestore
            const messagesRef = collection(db, 'projects', projectId, 'messages');
            await addDoc(messagesRef, messageData);

            // Send notifications for mentions
            mentions.forEach(async (mentionedEmail) => {
                if (mentionedEmail !== currentUser.email) {
                    await createNotification({
                        userId: mentionedEmail,
                        type: 'mention',
                        message: `${currentUser.displayName || currentUser.email} mentioned you in a message`,
                        projectId,
                        link: `/project/${projectId}`
                    });
                }
            });

            setNewMessage('');
            setShowEmojiPicker(false);
            scrollToBottom();
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        }
    };

    const onEmojiClick = (emojiObject) => {
        setNewMessage(prev => prev + emojiObject.emoji);
        setShowEmojiPicker(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, x: 300 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 300 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={themeStyles.container}
                >
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={themeStyles.header}
                    >
                        <div>
                            <h3 className="font-semibold text-primary text-lg">Project Chat</h3>
                            <p className="text-sm text-muted-foreground">Team Communication</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-accent/10 rounded-full transition-all duration-300 group"
                        >
                            <FiX className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </button>
                    </motion.div>

                    <div
                        ref={chatContainerRef}
                        onScroll={handleScroll}
                        className={themeStyles.messageArea}
                    >
                        {isLoadingMore && (
                            <div className="text-center py-2">
                                <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${themeStyles.loadingSpinner} mx-auto`}></div>
                            </div>
                        )}
                        {messages.map((message, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                key={message.id}
                                className={`flex flex-col ${message.sender === currentUser.email ? 'items-end' : 'items-start'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-foreground/90">
                                        {message.senderName}
                                    </span>
                                    <span className="text-xs text-foreground/70">
                                        {message.timestamp?.toDate().toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-lg ${message.sender === currentUser.email
                                        ? `${themeStyles.messageSent} rounded-tr-none`
                                        : `${themeStyles.messageReceived} rounded-tl-none`
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                    {message.fileUrl && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className={`mt-3 border-t pt-3 ${themeStyles.filePreview}`}
                                        >
                                            {message.fileType.startsWith('image/') ? (
                                                <img
                                                    src={message.fileUrl}
                                                    alt={message.fileName}
                                                    className="max-w-full rounded-lg shadow-md hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <a
                                                    href={message.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-sm bg-background/20 px-3 py-2 rounded-lg hover:bg-background/30 transition-all duration-300 group"
                                                >
                                                    <FiPaperclip className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                                    <span className="truncate group-hover:text-primary transition-colors">{message.fileName}</span>
                                                </a>
                                            )}
                                        </motion.div>
                                    )}
                                </motion.div>
                                <div className="flex items-center gap-1 mt-1 px-1">
                                    {message.seen.includes(currentUser.email) ? (
                                        <div className="flex">
                                            <FiCheck className="w-3.5 h-3.5 text-primary -mr-1" />
                                            <FiCheck className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                    ) : (
                                        <FiCheck className="w-3.5 h-3.5 text-muted-foreground" />
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Member Suggestions */}
                    {showMemberSuggestions && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`absolute bottom-[80px] left-0 w-full shadow-xl max-h-48 overflow-y-auto ${themeStyles.mentionList}`}
                        >
                            {memberSuggestions.map((member) => (
                                <motion.button
                                    whileHover={{ x: 4 }}
                                    key={member.email}
                                    onClick={() => handleMention(member)}
                                    className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-all duration-300 group ${themeStyles.mentionItem}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <FiUser className="w-4 h-4 text-primary-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <span className={`block font-medium text-foreground group-hover:text-primary transition-colors`}>
                                            {member.displayName || member.email.split('@')[0]}
                                        </span>
                                        <span className="text-sm text-foreground/70">{member.email}</span>
                                    </div>
                                </motion.button>
                            ))}
                        </motion.div>
                    )}

                    {/* Input Area */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={themeStyles.inputArea}
                    >
                        <div className="flex items-end gap-2">
                            <div className="flex-1 relative">
                                <textarea
                                    value={newMessage}
                                    onChange={handleMessageChange}
                                    placeholder="Type a message..."
                                    className={`w-full px-4 py-3 rounded-xl border resize-none text-sm transition-all duration-300 ${themeStyles.inputField}`}
                                    rows={1}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            sendMessage();
                                        }
                                    }}
                                />
                                {showEmojiPicker && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="absolute bottom-full right-0 mb-2"
                                    >
                                        <EmojiPicker
                                            theme={theme === 'light' ? 'light' : 'dark'}
                                            onEmojiClick={onEmojiClick}
                                            lazyLoadEmojis={true}
                                        />
                                    </motion.div>
                                )}
                            </div>
                            <div className="flex gap-1">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className={`p-3 rounded-xl transition-all duration-300 ${themeStyles.iconButton}`}
                                >
                                    <FiSmile className="w-5 h-5" />
                                </motion.button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    accept=".jpg,.jpeg,.png,.svg,.pdf"
                                />
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className={`p-3 rounded-xl transition-all duration-300 disabled:opacity-50 ${themeStyles.iconButton}`}
                                >
                                    <FiPaperclip className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={sendMessage}
                                    className={`p-3 rounded-xl hover:shadow-lg transition-all duration-300 ${themeStyles.sendButton}`}
                                >
                                    <FiSend className="w-5 h-5" />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ProjectChat; 