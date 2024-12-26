import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { useAuth } from '../contexts/AuthContext';
import ReviewPanel from './Canvas/ReviewPanel';
import { toast } from 'react-hot-toast';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Canvas({ projectId }) {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const { currentUser } = useAuth();
  const [projectData, setProjectData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch project data and check permissions
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!projectId || !currentUser) return;

      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);
        
        if (projectDoc.exists()) {
          const data = projectDoc.data();
          setProjectData(data);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching project:', error);
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId, currentUser]);

  const handleStatusChange = (newStatus) => {
    setProjectData(prev => ({
      ...prev,
      reviewStatus: newStatus
    }));
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 bg-white relative">
        <canvas ref={canvasRef} />
      </div>
      
      {/* Right Sidebar */}
      <div className="w-64 bg-[#1e1e1e] text-white p-4 flex flex-col">
        {/* Layers Section */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Layers</h2>
          <div className="flex gap-2">
            <button className="p-1 hover:bg-gray-700 rounded">⬇️</button>
            <button className="p-1 hover:bg-gray-700 rounded">➕</button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span>Layer 1</span>
          <div className="flex gap-2">
            <button className="p-1 hover:bg-gray-700 rounded">👁️</button>
            <button className="p-1 hover:bg-gray-700 rounded">🗑️</button>
          </div>
        </div>

        {/* Review Panel */}
        <div className="mb-4 border-t border-gray-700 pt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Project Review</h2>
          </div>
          <ReviewPanel 
            projectId={projectId}
            reviewStatus={projectData?.reviewStatus}
            reviewers={projectData?.viewers ? Object.keys(projectData.viewers) : []}
            onStatusChange={handleStatusChange}
          />
        </div>

        {/* Version History Section */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Version History</h2>
          <div className="flex gap-2">
            <button className="p-1 hover:bg-gray-700 rounded">🔍</button>
            <button className="p-1 hover:bg-gray-700 rounded">⏱️</button>
          </div>
        </div>

        <button className="mt-auto w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded transition-colors">
          Save Version
        </button>
      </div>
    </div>
  );
} 