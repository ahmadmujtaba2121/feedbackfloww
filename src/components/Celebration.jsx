import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';

export default function Celebration({ type, message, onClose }) {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const colors = type === 'approve' 
    ? ['#4CAF50', '#45a049', '#3d9142'] 
    : ['#f44336', '#e53935', '#d32f2f'];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      >
        {type === 'approve' && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            colors={colors}
            recycle={false}
            numberOfPieces={500}
          />
        )}
        <motion.div
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          className={`p-6 rounded-lg shadow-xl ${
            type === 'approve' ? 'bg-green-100' : 'bg-red-100'
          }`}
        >
          <h2 className={`text-2xl font-bold mb-4 ${
            type === 'approve' ? 'text-green-700' : 'text-red-700'
          }`}>
            {type === 'approve' ? '🎉 Approved!' : '❌ Rejected'}
          </h2>
          <p className="text-gray-700 mb-4">{message}</p>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded ${
              type === 'approve' 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-red-500 hover:bg-red-600'
            } text-white`}
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 