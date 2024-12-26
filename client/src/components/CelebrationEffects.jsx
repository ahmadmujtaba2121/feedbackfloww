import React from 'react';
import { toast } from 'react-hot-toast';

export const celebrateApproval = async () => {
  try {
    const confetti = (await import('canvas-confetti')).default;
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2DD4BF', '#14B8A6', '#0D9488']
    });
  } catch (error) {
    console.error('Failed to load celebration effect:', error);
    // Fallback to a simple toast notification
    toast.success('🎉 Approved!', {
      style: {
        background: '#1E293B',
        color: '#E2E8F0',
      }
    });
  }
};

export default celebrateApproval;