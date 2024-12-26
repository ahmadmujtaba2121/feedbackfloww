import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { db, auth } from "../firebase/firebase";
import { doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { toast } from "react-hot-toast";
import {
  FiZoomIn,
  FiZoomOut,
  FiMaximize,
  FiLayers,
  FiMessageSquare,
  FiType,
  FiUsers,
} from "react-icons/fi";

const Canvas = () => {
  const { projectId } = useParams();
  const location = useLocation();
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const { files, projectName } = location.state || {};

  // Core Canvas States
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [currentTool, setCurrentTool] = useState("select");

  // Collaborative Features States
  const [layers, setLayers] = useState([]);
  const [comments, setComments] = useState([]);
  const [cursors, setCursors] = useState({});
  const [annotations, setAnnotations] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    initializeCanvas();
    setupRealtimeListeners();
    joinSession();
    return () => leaveSession();
  }, [projectId]);

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 2;
    canvas.height = window.innerHeight * 2;
    const context = canvas.getContext("2d");
    context.scale(2, 2);
    context.lineCap = "round";
    contextRef.current = context;
  };

  const setupRealtimeListeners = () => {
    const projectRef = doc(db, "projects", projectId);

    onSnapshot(projectRef, (snapshot) => {
      const data = snapshot.data();
      setLayers(data.layers || []);
      setComments(data.comments || []);
      setAnnotations(data.annotations || []);
      setActiveUsers(data.activeUsers || []);
    });
  };

  const joinSession = async () => {
    const userInfo = {
      id: auth.currentUser.uid,
      email: auth.currentUser.email,
      cursor: { x: 0, y: 0 },
      lastActive: new Date().toISOString(),
    };

    await updateDoc(doc(db, "projects", projectId), {
      activeUsers: arrayUnion(userInfo),
    });

    // Broadcast cursor position
    window.addEventListener("mousemove", broadcastCursorPosition);
  };

  const leaveSession = async () => {
    const updatedUsers = activeUsers.filter(
      (user) => user.id !== auth.currentUser.uid
    );
    await updateDoc(doc(db, "projects", projectId), {
      activeUsers: updatedUsers,
    });
  };

  const broadcastCursorPosition = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    updateDoc(doc(db, "projects", projectId), {
      [`cursors.${auth.currentUser.uid}`]: { x, y },
    });
  };

  const handleDraw = (e) => {
    if (!isDrawing || currentTool !== "draw") return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();

    // Broadcast drawing data
    updateDoc(doc(db, "projects", projectId), {
      drawings: arrayUnion({
        points: [{ x, y }],
        color: contextRef.current.strokeStyle,
        width: contextRef.current.lineWidth,
        timestamp: new Date().toISOString(),
        userId: auth.currentUser.uid,
      }),
    });
  };

  const addComment = async (x, y, text) => {
    const comment = {
      id: Date.now().toString(),
      x,
      y,
      text,
      userId: auth.currentUser.uid,
      timestamp: new Date().toISOString(),
    };

    await updateDoc(doc(db, "projects", projectId), {
      comments: arrayUnion(comment),
    });
  };

  const addLayer = async (content) => {
    const layer = {
      id: Date.now().toString(),
      content,
      visible: true,
      locked: false,
      userId: auth.currentUser.uid,
      timestamp: new Date().toISOString(),
    };

    await updateDoc(doc(db, "projects", projectId), {
      layers: arrayUnion(layer),
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      restoreCanvas(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      restoreCanvas(history[historyIndex + 1]);
    }
  };

  const restoreCanvas = (imageData) => {
    const context = contextRef.current;
    context.putImageData(imageData, 0, 0);
  };

  const saveCurrentState = () => {
    const imageData = contextRef.current.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    setHistory([...history.slice(0, historyIndex + 1), imageData]);
    setHistoryIndex(historyIndex + 1);
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col">
      <div className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setScale((s) => Math.min(s * 1.2, 5))}
            className="tool-button"
          >
            <FiZoomIn />
          </button>
          <button
            onClick={() => setScale((s) => Math.max(s / 1.2, 0.1))}
            className="tool-button"
          >
            <FiZoomOut />
          </button>
          <button onClick={() => setScale(1)} className="tool-button">
            <FiMaximize />
          </button>
          <span className="text-slate-400">{Math.round(scale * 100)}%</span>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentTool("draw")}
            className="tool-button"
          >
            Draw
          </button>
          <button
            onClick={() => setCurrentTool("comment")}
            className="tool-button"
          >
            <FiMessageSquare />
          </button>
          <button
            onClick={() => setCurrentTool("text")}
            className="tool-button"
          >
            <FiType />
          </button>
          <div className="relative">
            <button className="tool-button">
              <FiUsers />
              <span className="ml-2">{activeUsers.length}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: currentTool === "draw" ? "crosshair" : "default",
          }}
          onMouseDown={() => setIsDrawing(true)}
          onMouseUp={() => setIsDrawing(false)}
          onMouseMove={handleDraw}
        />

        {/* Render other users' cursors */}
        {Object.entries(cursors).map(
          ([userId, cursor]) =>
            userId !== auth.currentUser.uid && (
              <div
                key={userId}
                className="absolute w-4 h-4 bg-violet-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: cursor.x * scale + position.x,
                  top: cursor.y * scale + position.y,
                }}
              />
            )
        )}
      </div>

      {/* Layers Panel */}
      <div className="absolute right-0 top-16 bottom-0 w-64 bg-slate-800 border-l border-slate-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Layers</h3>
          <button onClick={() => addLayer()} className="tool-button">
            <FiLayers />
          </button>
        </div>
        <div className="space-y-2">
          {layers.map((layer) => (
            <div
              key={layer.id}
              className="flex items-center justify-between p-2 bg-slate-700 rounded"
            >
              <span className="text-slate-300">{layer.id}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Canvas;
