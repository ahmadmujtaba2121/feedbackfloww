export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface CanvasElement {
  id: string;
  type: 'drawing' | 'text' | 'image' | 'comment';
  position: Point;
  size?: Size;
  content: any;
  author: string;
  timestamp: Date;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  elements: CanvasElement[];
}

export interface CanvasState {
  scale: number;
  position: Point;
  dimensions: Size;
  layers: Layer[];
  activeLayerId: string | null;
  selectedElementId: string | null;
  tool: 'select' | 'pen' | 'rectangle' | 'text' | 'comment';
} 