import React, { useEffect } from 'react';

const loadConfetti = async () => {
  const confetti = (await import('canvas-confetti')).default;
  return confetti;
};

const celebrateApproval = async () => {
  const confetti = await loadConfetti();
  // Shoot confetti from the center
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#22c55e', '#4ade80', '#86efac']
  });

  // Shoot from both sides
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#22c55e', '#4ade80', '#86efac']
    });

    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#22c55e', '#4ade80', '#86efac']
    });
  }, 250);
};

const celebrateRejection = () => {
  // Create a subtle pulse effect for rejection
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
  overlay.style.zIndex = '9999';
  overlay.style.animation = 'pulse 0.5s ease-in-out';

  // Add keyframes for pulse animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { opacity: 0; }
      50% { opacity: 1; }
      100% { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(overlay);

  // Remove overlay after animation
  setTimeout(() => {
    document.body.removeChild(overlay);
    document.head.removeChild(style);
  }, 500);
};

export const useCelebrationEffect = (status, shouldTrigger = true) => {
  useEffect(() => {
    if (!shouldTrigger) return;

    if (status === 'approved') {
      celebrateApproval();
    } else if (status === 'rejected') {
      celebrateRejection();
    }
  }, [status, shouldTrigger]);
};

export const CelebrationEffects = ({ status, shouldTrigger = true }) => {
  useCelebrationEffect(status, shouldTrigger);
  return null;
};

export default CelebrationEffects;