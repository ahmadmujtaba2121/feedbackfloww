import React, { useState, useRef, useEffect } from 'react';
import { useAI } from '../../contexts/AIContext';
import { FiSend, FiX, FiMaximize2, FiMinimize2, FiHelpCircle, FiClock, FiList, FiActivity, FiMessageSquare, FiCheckSquare, FiTrendingUp, FiBarChart2, FiMessageCircle, FiFileText, FiCpu } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const QuickAction = ({ icon: Icon, label, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm ${disabled
            ? 'opacity-50 cursor-not-allowed bg-[#1B2B44]/50 text-[#94A3B8]'
            : 'bg-[#1B2B44] text-[#E5E9F0] hover:bg-[#2B3B54]'
            }`}
    >
        <Icon className="w-4 h-4" />
        {label}
    </button>
);

const MessageTemplate = ({ template, onSelect }) => (
    <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full text-left p-3 bg-[#1B2B44] hover:bg-[#2B3B54] text-[#E5E9F0] rounded-lg transition-colors"
        onClick={() => onSelect(template)}
    >
        <h4 className="font-medium mb-1">{template.title}</h4>
        <p className="text-sm text-[#94A3B8]">{template.description}</p>
    </motion.button>
);

const AIChat = ({ projectId }) => {
    const [message, setMessage] = useState('');
    const [showTemplates, setShowTemplates] = useState(false);
    const [templates, setTemplates] = useState(null);
    const chatContainerRef = useRef(null);
    const {
        sendMessage,
        chatHistory,
        isLoading,
        clearHistory
    } = useAI();

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim() || isLoading) return;

        const userMessage = message;
        setMessage('');
        await sendMessage(userMessage, projectId);
    };

    return (
        <div className="flex flex-col h-[600px]">
            {/* Chat Messages */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-4"
            >
                {chatHistory.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg p-3 ${msg.role === 'user'
                                ? 'bg-[#2DD4BF] text-[#0A1628]'
                                : 'bg-[#1B2B44] text-[#E5E9F0]'
                                }`}
                        >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-[#1B2B44] text-[#E5E9F0] rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-[#2DD4BF] rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-[#2DD4BF] rounded-full animate-bounce delay-100" />
                                <div className="w-2 h-2 bg-[#2DD4BF] rounded-full animate-bounce delay-200" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-[#1B2B44] bg-[#0A1628]">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ask anything... Press Enter to send, Shift + Enter for new line"
                        className="flex-1 bg-[#1B2B44] text-[#E5E9F0] placeholder-[#94A3B8] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] border border-[#2B3B54]"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !message.trim()}
                        className={`p-2 rounded-lg transition-colors ${isLoading || !message.trim()
                            ? 'bg-[#1B2B44]/50 text-[#94A3B8] cursor-not-allowed'
                            : 'bg-[#2DD4BF] text-[#0A1628] hover:bg-[#14B8A6]'
                            }`}
                    >
                        <FiSend className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AIChat; 