import React, { useEffect, useRef } from 'react';
import rough from 'roughjs';

const DrawingRenderer = ({ drawing, width, height }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!drawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const roughCanvas = rough.canvas(canvas);

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = drawing.color;
    ctx.fillStyle = drawing.color;
    ctx.lineWidth = drawing.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = drawing.opacity;

    if (drawing.style === 'dashed') {
      ctx.setLineDash([15, 5]);
    } else if (drawing.style === 'dotted') {
      ctx.setLineDash([2, 2]);
    } else {
      ctx.setLineDash([]);
    }

    switch (drawing.type) {
      case 'pen':
        if (Array.isArray(drawing.points) && drawing.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(drawing.points[0].x, drawing.points[0].y);
          
          if (drawing.smoothing) {
            // Smooth curve through points
            for (let i = 1; i < drawing.points.length - 2; i++) {
              const xc = (drawing.points[i].x + drawing.points[i + 1].x) / 2;
              const yc = (drawing.points[i].y + drawing.points[i + 1].y) / 2;
              ctx.quadraticCurveTo(drawing.points[i].x, drawing.points[i].y, xc, yc);
            }
            // Curve through the last two points
            if (drawing.points.length > 2) {
              const last = drawing.points.length - 1;
              ctx.quadraticCurveTo(
                drawing.points[last - 1].x,
                drawing.points[last - 1].y,
                drawing.points[last].x,
                drawing.points[last].y
              );
            }
          } else {
            // Straight lines between points
            drawing.points.forEach((point, i) => {
              if (i > 0) ctx.lineTo(point.x, point.y);
            });
          }
          ctx.stroke();
        }
        break;

      case 'rectangle':
        if (drawing.points?.[0] && drawing.end) {
          const startPoint = drawing.points[0];
          if (drawing.roughness > 0) {
            roughCanvas.rectangle(
              startPoint.x,
              startPoint.y,
              drawing.end.x - startPoint.x,
              drawing.end.y - startPoint.y,
              {
                stroke: drawing.color,
                strokeWidth: drawing.width,
                roughness: drawing.roughness,
                fill: drawing.fill ? drawing.color : undefined,
                fillStyle: drawing.fill ? 'solid' : undefined
              }
            );
          } else {
            ctx.beginPath();
            ctx.rect(
              startPoint.x,
              startPoint.y,
              drawing.end.x - startPoint.x,
              drawing.end.y - startPoint.y
            );
            if (drawing.fill) {
              ctx.fill();
            }
            ctx.stroke();
          }
        }
        break;

      case 'circle':
        if (drawing.points?.[0] && drawing.end) {
          const startPoint = drawing.points[0];
          const radius = Math.sqrt(
            Math.pow(drawing.end.x - startPoint.x, 2) +
            Math.pow(drawing.end.y - startPoint.y, 2)
          );
          if (drawing.roughness > 0) {
            roughCanvas.circle(startPoint.x, startPoint.y, radius * 2, {
              stroke: drawing.color,
              strokeWidth: drawing.width,
              roughness: drawing.roughness,
              fill: drawing.fill ? drawing.color : undefined,
              fillStyle: drawing.fill ? 'solid' : undefined
            });
          } else {
            ctx.beginPath();
            ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
            if (drawing.fill) {
              ctx.fill();
            }
            ctx.stroke();
          }
        }
        break;

      case 'arrow':
        if (drawing.points?.[0] && drawing.end) {
          const startPoint = drawing.points[0];
          const dx = drawing.end.x - startPoint.x;
          const dy = drawing.end.y - startPoint.y;
          const angle = Math.atan2(dy, dx);
          const headLength = 20;

          // Draw the main line
          ctx.beginPath();
          ctx.moveTo(startPoint.x, startPoint.y);
          ctx.lineTo(drawing.end.x, drawing.end.y);
          ctx.stroke();

          // Draw the arrow head
          ctx.beginPath();
          ctx.moveTo(drawing.end.x, drawing.end.y);
          ctx.lineTo(
            drawing.end.x - headLength * Math.cos(angle - Math.PI / 6),
            drawing.end.y - headLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(drawing.end.x, drawing.end.y);
          ctx.lineTo(
            drawing.end.x - headLength * Math.cos(angle + Math.PI / 6),
            drawing.end.y - headLength * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        }
        break;

      default:
        break;
    }
  }, [drawing, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none"
    />
  );
};

export default DrawingRenderer; 