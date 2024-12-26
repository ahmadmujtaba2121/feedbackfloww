import React, { useEffect, useRef } from 'react';

const WatermarkedImage = ({ src, watermark, className = '' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the image
      ctx.drawImage(img, 0, 0);

      // Add watermark
      ctx.save();
      
      // Semi-transparent background pattern
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '16px Inter';
      const text = watermark;
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      const textHeight = 16;
      const spacing = 150;

      // Rotate and repeat watermark
      ctx.rotate(-30 * Math.PI / 180);
      for (let y = -canvas.height; y < canvas.height * 2; y += spacing) {
        for (let x = -canvas.width; x < canvas.width * 2; x += spacing) {
          ctx.fillText(text, x, y);
        }
      }

      ctx.restore();

      // Add border watermark
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '14px Inter';
      ctx.fillText(watermark, 20, canvas.height - 20);
      ctx.restore();

      // Prevent right-click
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    };

    img.src = src;
  }, [src, watermark]);

  return (
    <canvas
      ref={canvasRef}
      className={`${className} select-none`}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
};

export default WatermarkedImage; 