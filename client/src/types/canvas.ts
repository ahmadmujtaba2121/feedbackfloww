export type Point = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export type CanvasElement = {
  id: string;
  type: 'image' | 'drawing' | 'text';
  position: Point;
  size: Size;
  rotation: number;
  opacity: number;
  isDraggable: boolean;
  name?: string;
  url?: string;
  text?: string;
  color?: string;
};

export type DrawingData = {
  id: string;
  type: 'draw' | 'rectangle' | 'circle';
  layerId: string;
  color: string;
  size: number;
  opacity: number;
  points?: Point[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  createdAt: string;
  createdBy: string;
};

export type Layer = {
  id: string;
  name: string;
  visible: boolean;
};

export type Comment = {
  id: string;
  text: string;
  position: Point;
  createdAt: string;
  createdBy: string;
  createdByName: string;
};

export type Tool = 
  | 'select'
  | 'pan'
  | 'draw'
  | 'rectangle'
  | 'circle'
  | 'comment'
  | 'text'
  | 'eraser';

export type DrawingSettings = {
  color: string;
  size: number;
  opacity: number;
  isEraser: boolean;
}; 