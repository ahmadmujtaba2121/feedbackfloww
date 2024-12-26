// Add proper types for canvas state
export interface CanvasState {
  scale: number;
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  timestamp: Date;
  position: { x: number; y: number };
}

export interface Point {
  x: number;
  y: number;
}

export interface DrawingElement {
  id: string;
  type: 'drawing' | 'text';
  points?: Point[];
  content: string;
  position: Point;
  author: string;
  timestamp: Date;
}

export interface Layer {
  id: string;
  type: 'drawing' | 'file';
  name: string;
  content: any[];
  position?: Point;
  size?: {
    width: number;
    height: number;
  };
  visible: boolean;
  locked: boolean;
  elements: DrawingElement[];
} 