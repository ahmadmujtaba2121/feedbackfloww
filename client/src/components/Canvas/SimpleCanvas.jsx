import React from 'react';
import { Stage, Layer, Rect } from 'react-konva';

const SimpleCanvas = () => {
  return (
    <div>
      <h1 style={{ color: 'white' }}>Test Canvas</h1>
      <div style={{ border: '1px solid white', margin: '20px', display: 'inline-block' }}>
        <Stage width={200} height={200}>
          <Layer>
            <Rect
              x={20}
              y={20}
              width={50}
              height={50}
              fill="red"
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default SimpleCanvas; 