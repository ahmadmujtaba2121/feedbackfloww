import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Canvas from '../components/Canvas';
import ProjectSidebar from '../components/ProjectSidebar';
import ReviewPanel from '../components/ReviewPanel';

export default function CanvasPage() {
  const { projectId } = useParams();
  const { currentUser } = useAuth();
  
  // Check if current user is the owner of the project
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const checkOwnership = async () => {
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (projectSnap.exists()) {
        setIsOwner(projectSnap.data().ownerId === currentUser.uid);
      }
    };

    checkOwnership();
  }, [projectId, currentUser]);

  return (
    <div className="flex h-screen">
      <ProjectSidebar
        projectId={projectId}
        isViewer={!isOwner}
      />
      <div className="flex-1 relative">
        <Canvas
          projectId={projectId}
          isViewer={!isOwner}
        />
        {/* Show ReviewPanel for everyone except the owner */}
        {!isOwner && (
          <div className="absolute top-4 right-4 z-50">
            <ReviewPanel projectId={projectId} />
          </div>
        )}
      </div>
    </div>
  );
} 