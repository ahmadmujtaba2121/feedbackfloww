import React, { useState } from 'react';
import { FiMessageSquare } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import AIChat from './AIChat';

const AIButton = ({ projectContext }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-4 right-4 w-12 h-12 bg-violet-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-violet-700 transition-colors"
            >
                <FiMessageSquare className="w-6 h-6" />
            </motion.button>

            <AnimatePresence>
                {isOpen && <AIChat projectContext={projectContext} />}
            </AnimatePresence>
        </>
    );
};

export default AIButton; 