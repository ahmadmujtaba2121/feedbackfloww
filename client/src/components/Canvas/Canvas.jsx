import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { auth } from '../../firebase/firebase';
import { toast } from 'react-hot-toast';
import { db } from '../../firebase/firebase';
import { doc, updateDoc, serverTimestamp, deleteDoc, setDoc, onSnapshot, arrayUnion, getDoc } from 'firebase/firestore';
import { useNotification } from '../../contexts/NotificationContext';
import TextEditor from './TextEditor';
import CommentPin from './CommentPin';
import { FiUpload, FiCheck, FiX, FiTrash2, FiMove, FiCornerRightDown, FiAlertCircle } from 'react-icons/fi';
import ReviewPanel from './ReviewPanel';
import ReviewList from './ReviewList';
import { uploadProjectFile } from '../../services/userService';
import Modal from '../Modal';
import { debounce } from 'lodash';
import DraggableFile from './DraggableFile';
import PDFObject from './PDFObject';
import CodeBlock from './CodeBlock';
import { uploadFileToSupabase } from '../../lib/supabase';
import { PremiumFeature } from '../PremiumFeature';

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

const Canvas = ({ layers = [], setLayers, activeTool, activeLayerId, scale = 1, setScale, drawingSettings = {}, projectId, onFileUpload, currentUser }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingStart, setDrawingStart] = useState(null);
  const [currentPath, setCurrentPath] = useState(null);
  const [textInput, setTextInput] = useState(null);
  const [commentInput, setCommentInput] = useState(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [reviewers, setReviewers] = useState([]);
  const [projectOwner, setProjectOwner] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [reviewStatus, setReviewStatus] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isReviewPanelOpen, setIsReviewPanelOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [isReviewer, setIsReviewer] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [projectStatus, setProjectStatus] = useState(null);
  const { createNotification } = useNotification();
  const [showChangeRequestModal, setShowChangeRequestModal] = useState(false);
  const [changeRequestText, setChangeRequestText] = useState('');
  const [projectChangesRequested, setProjectChangesRequested] = useState([]);

  // Add safety check for currentUser
  if (!currentUser) {
    return (
      <div className="flex-1 bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  useEffect(() => {
    if (!projectId || !currentUser) return;

    const unsubscribe = onSnapshot(
      doc(db, 'projects', projectId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          // Update reviewers list
          const reviewersList = data.reviewers || [];
          setReviewers(reviewersList);
          setProjectOwner(data.owner || null);
          setProjectName(data.name || 'Untitled Project');
          setReviews(data.reviews || []);

          // Update permission checks
          setIsOwner(currentUser?.email === data.owner);
          setIsReviewer(reviewersList.includes(currentUser?.email) || currentUser?.email === data.owner);

          // Automatically set user as reviewer if they're not the owner
          if (!reviewersList.includes(currentUser.email) && currentUser.email !== data.owner) {
            const projectRef = doc(db, 'projects', projectId);
            updateDoc(projectRef, {
              reviewers: arrayUnion(currentUser.email)
            }).then(() => {
              console.log('Added current user as reviewer');
            }).catch(error => {
              console.error('Error adding reviewer:', error);
            });
          }

          setProjectStatus(data.status || null);
          setProjectChangesRequested(data.changesRequested || []);
        }
      }
    );

    return () => unsubscribe();
  }, [projectId, currentUser]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    redrawLayers();
  }, []);

  useEffect(() => {
    if (!Array.isArray(layers)) return;
    redrawLayers();
  }, [layers]);

  useEffect(() => {
    const loadProjectFiles = async () => {
      if (!projectId) return;

      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectSnap = await getDoc(projectRef);

        if (projectSnap.exists()) {
          const data = projectSnap.data();
          const existingFiles = data.files || [];

          // Create layers for files that don't have layers yet
          const newLayers = existingFiles.map(file => {
            // Check if a layer already exists for this file
            const existingLayer = layers.find(layer =>
              layer.content?.some(item =>
                item.type === 'file' && item.name === file.name
              )
            );

            if (existingLayer) return null;

            return {
              id: `layer-${Date.now()}-${Math.random()}`,
              name: file.name,
              visible: true,
              locked: false,
              content: [{
                id: `file-${Date.now()}-${Math.random()}`,
                type: 'file',
                fileType: file.type,
                name: file.name,
                content: file.url,
                position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
                size: { width: 300, height: 300 }
              }]
            };
          }).filter(Boolean);

          if (newLayers.length > 0) {
            const updatedLayers = [...layers, ...newLayers];
            setLayers(updatedLayers);

            // Update Firestore with the new layers
            await updateDoc(projectRef, {
              layers: updatedLayers,
              lastModified: serverTimestamp()
            });
          }
        }
      } catch (error) {
        console.error('Error loading project files:', error);
        toast.error('Failed to load project files');
      }
    };

    loadProjectFiles();
  }, [projectId]);

  const getCanvasPoint = (e) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / (scale || 1),
      y: (e.clientY - rect.top) / (scale || 1)
    };
  };

  const handleMouseDown = (e) => {
    const point = getCanvasPoint(e);
    if (!point) return;

    // Handle other tools
    if (!activeLayerId) {
      toast.error('Please select a layer first');
      return;
    }

    setIsDrawing(true);
    setDrawingStart(point);
    setCurrentPath({
      id: Date.now().toString(),
      type: activeTool,
      points: [point],
      color: drawingSettings.color || '#000000',
      width: drawingSettings.width || 2,
      opacity: drawingSettings.opacity || 1,
      fill: drawingSettings.fill === true
    });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !currentPath || !drawingStart) return;

    const currentPoint = getCanvasPoint(e);
    if (!currentPoint) return;

    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    redrawLayers();

    drawPath(ctx, { ...currentPath, points: [...currentPath.points, currentPoint] });

    setCurrentPath(prev => ({
      ...prev,
      points: [...prev.points, currentPoint]
    }));
  };

  const drawPath = (ctx, path) => {
    if (!path || !path.points || path.points.length === 0) return;

    ctx.beginPath();
    ctx.strokeStyle = path.color || '#000000';
    ctx.fillStyle = path.color || '#000000';
    ctx.lineWidth = path.width || 2;
    ctx.globalAlpha = path.opacity || 1;

    switch (path.type) {
      case 'pen':
        if (path.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(path.points[0].x, path.points[0].y);
        path.points.forEach(point => ctx.lineTo(point.x, point.y));
        ctx.stroke();
        break;

      case 'rectangle':
        if (path.points.length < 2) return;
        const [rectStart, rectEnd] = [path.points[0], path.points[path.points.length - 1]];
        const width = rectEnd.x - rectStart.x;
        const height = rectEnd.y - rectStart.y;
        ctx.beginPath();
        ctx.rect(rectStart.x, rectStart.y, width, height);
        if (path.fill) {
          ctx.fill();
        }
        ctx.stroke();
        break;

      case 'circle':
        if (path.points.length < 2) return;
        const [center, radiusPoint] = [path.points[0], path.points[path.points.length - 1]];
        const radius = Math.sqrt(
          Math.pow(radiusPoint.x - center.x, 2) +
          Math.pow(radiusPoint.y - center.y, 2)
        );
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        if (path.fill) {
          ctx.fill();
        }
        ctx.stroke();
        break;

      case 'arrow':
        if (path.points.length < 2) return;
        const [arrowStart, arrowEnd] = [path.points[0], path.points[path.points.length - 1]];
        const dx = arrowEnd.x - arrowStart.x;
        const dy = arrowEnd.y - arrowStart.y;
        const angle = Math.atan2(dy, dx);
        const headLength = 20;

        ctx.beginPath();
        ctx.moveTo(arrowStart.x, arrowStart.y);
        ctx.lineTo(arrowEnd.x, arrowEnd.y);
        ctx.stroke();

        // Draw arrow head
        ctx.beginPath();
        ctx.moveTo(arrowEnd.x, arrowEnd.y);
        ctx.lineTo(
          arrowEnd.x - headLength * Math.cos(angle - Math.PI / 6),
          arrowEnd.y - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          arrowEnd.x - headLength * Math.cos(angle + Math.PI / 6),
          arrowEnd.y - headLength * Math.sin(angle + Math.PI / 6)
        );
        if (path.fill) {
          ctx.closePath();
          ctx.fill();
        }
        ctx.stroke();
        break;
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentPath || !activeLayerId) return;

    const updatedLayers = layers.map(layer => {
      if (layer.id === activeLayerId) {
        return {
          ...layer,
          content: [...(layer.content || []), { ...currentPath, points: [...currentPath.points] }]
        };
      }
      return layer;
    });

    setLayers(updatedLayers);
    const projectRef = doc(db, 'projects', projectId);
    updateDoc(projectRef, {
      layers: updatedLayers,
      lastModified: serverTimestamp()
    }).catch(error => {
      console.error('Error saving drawing:', error);
      toast.error('Failed to save drawing');
    });

    setIsDrawing(false);
    setDrawingStart(null);
    setCurrentPath(null);
  };

  const handleCanvasClick = (e) => {
    if (!activeLayerId) {
      toast.error('Please select a layer first');
      return;
    }

    const point = getCanvasPoint(e);
    if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') return;

    if (activeTool === 'text') {
      setTextInput({ x: point.x, y: point.y });
    } else if (activeTool === 'comment') {
      setCommentInput({ x: point.x, y: point.y });
    }
  };

  const handleTextComplete = (textData) => {
    if (!textData || !activeLayerId || !textInput) {
      setTextInput(null);
      return;
    }

    const textElement = {
      id: Date.now().toString(),
      type: 'text',
      position: {
        x: textInput.x,
        y: textInput.y
      },
      content: textData.content,
      style: textData.style
    };

    const updatedLayers = layers.map(layer => {
      if (layer.id === activeLayerId) {
        return {
          ...layer,
          content: [...(layer.content || []), textElement]
        };
      }
      return layer;
    });

    setLayers(updatedLayers);
    const projectRef = doc(db, 'projects', projectId);
    setDoc(projectRef, {
      layers: updatedLayers,
      lastModified: serverTimestamp()
    }, { merge: true }).catch(error => {
      console.error('Error saving text:', error);
      toast.error('Failed to save text');
    });

    setTextInput(null);
  };

  const handleTextCancel = () => {
    setTextInput(null);
  };

  const handleFileUpload = async (files) => {
    if (!projectId || !files.length) return;

    try {
      const file = files[0]; // Handle one file at a time

      // Check for allowed file types
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          <div className="text-sm">
            <p className="font-medium mb-1">Unsupported file type</p>
            <p className="text-slate-200">As a solo developer project, we currently only support PNG, JPG, and SVG files to keep costs manageable.</p>
            <p className="text-slate-300 mt-1">Thank you for understanding! 🙏</p>
          </div>,
          { duration: 5000 }
        );
        return;
      }

      let uploadResult;

      if (file.type === 'image/svg+xml') {
        // Use Supabase for SVGs
        uploadResult = await uploadFileToSupabase(file, projectId);
      } else {
        // Use Cloudinary for PNG/JPG
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'ukecpfrg');
        formData.append('folder', `feedbackflow/projects/${projectId}`);

        const response = await fetch(
          'https://api.cloudinary.com/v1_1/dysa2jeyb/upload',
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Upload failed');
        }

        const data = await response.json();
        uploadResult = {
          url: data.secure_url,
          path: data.public_id,
          name: file.name,
          type: file.type,
          size: file.size
        };
      }

      // Create a new layer for the file
      const newLayer = {
        id: `layer-${Date.now()}`,
        name: file.name,
        type: file.type === 'image/svg+xml' ? 'svg' : 'image',
        visible: true,
        locked: false,
        content: [{
          id: `file-${Date.now()}`,
          type: file.type === 'image/svg+xml' ? 'svg' : 'image',
          name: file.name,
          content: uploadResult.url,
          position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
          size: {
            width: file.type === 'image/svg+xml' ? 400 : 300,
            height: file.type === 'image/svg+xml' ? 400 : 300
          },
          scale: 1,
          rotation: 0
        }]
      };

      const updatedLayers = [...layers, newLayer];
      setLayers(updatedLayers);
      setSelectedFile(newLayer.content[0].id);
      setActiveLayerId(newLayer.id);

      const fileData = {
        id: `file-${Date.now()}`,
        name: file.name,
        type: file.type,
        url: uploadResult.url,
        path: uploadResult.path,
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser?.email,
        storage: file.type === 'image/svg+xml' ? 'supabase' : 'cloudinary'
      };

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        files: arrayUnion(fileData),
        layers: updatedLayers,
        lastModified: serverTimestamp()
      });

      toast.success(`${file.type === 'image/svg+xml' ? 'SVG' : 'Image'} uploaded successfully`);
    } catch (error) {
      handleError(error, ErrorTypes.FILE_OPERATION);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const files = e.dataTransfer.files;
    await handleFileUpload(files);
  };

  // Add file input for manual upload
  const fileInputRef = useRef(null);

  const handleFileInputChange = async (e) => {
    const files = e.target.files;
    await handleFileUpload(files);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteLayer = async (layerId) => {
    try {
      // Optimistic update
      setLayers(prevLayers => prevLayers.filter(layer => layer.id !== layerId));

      // Delete from Firestore
      const projectRef = doc(db, 'projects', projectId);
      const updatedLayers = layers.filter(layer => layer.id !== layerId);

      // Set the entire layers array directly
      await setDoc(projectRef, {
        layers: updatedLayers,
        lastModified: serverTimestamp()
      }, { merge: true });

    } catch (error) {
      console.error('Error deleting layer:', error);
      toast.error('Failed to delete layer');
      // Revert on error
      setLayers(layers);
    }
  };

  const handleFileDelete = async (fileId) => {
    try {
      const fileLayer = layers.find(layer =>
        layer.content?.some(item => item.id === fileId)
      );

      if (!fileLayer) return;

      const file = fileLayer.content.find(item => item.id === fileId);
      if (!file) return;

      // Delete from storage
      if (file.storage === 'supabase') {
        const { error } = await supabase.storage
          .from('documents')
          .remove([file.path]);

        if (error) {
          console.error('Error deleting from Supabase:', error);
          throw error;
        }
      } else if (file.storage === 'cloudinary') {
        // Delete from Cloudinary
        const response = await fetch('/api/delete-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ publicId: file.path }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to delete file from Cloudinary');
        }
      }

      // Update layers
      const updatedLayers = layers.filter(layer => layer.id !== fileLayer.id);
      setLayers(updatedLayers);

      // Update Firestore
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        layers: updatedLayers,
        lastModified: serverTimestamp()
      });

      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const redrawLayers = () => {
    if (!canvasRef.current || !Array.isArray(layers)) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    layers.forEach(layer => {
      if (!layer?.visible || !Array.isArray(layer?.content)) return;
      layer.content.forEach(item => {
        if (item.type === 'pen' || item.type === 'rectangle' || item.type === 'circle' || item.type === 'arrow') {
          drawPath(ctx, item);
        }
      });
    });
  };

  const handleZoom = (direction) => {
    if (direction === 'in') {
      setScale(prevScale => Math.min(prevScale + 0.1, 3));
    } else {
      setScale(prevScale => Math.max(prevScale - 0.1, 0.1));
    }
  };

  const handleCommentComplete = (commentData) => {
    if (!commentData || !activeLayerId || !commentInput) {
      setCommentInput(null);
      return;
    }

    const commentElement = {
      id: Date.now().toString(),
      type: 'comment',
      position: {
        x: commentInput.x,
        y: commentInput.y
      },
      content: commentData.content,
      author: currentUser?.displayName || currentUser?.email || 'Anonymous',
      timestamp: new Date().toISOString()
    };

    const updatedLayers = layers.map(layer => {
      if (layer.id === activeLayerId) {
        return {
          ...layer,
          content: [...(layer.content || []), commentElement]
        };
      }
      return layer;
    });

    setLayers(updatedLayers);
    const projectRef = doc(db, 'projects', projectId);
    setDoc(projectRef, {
      layers: updatedLayers,
      lastModified: serverTimestamp()
    }, { merge: true }).catch(error => {
      console.error('Error saving comment:', error);
      toast.error('Failed to save comment');
    });

    setCommentInput(null);
  };

  const handleCommentCancel = () => {
    setCommentInput(null);
  };

  const handleCommentDelete = async (commentId) => {
    try {
      // Optimistic update
      const updatedLayers = layers.map(layer => ({
        ...layer,
        content: layer.content?.filter(item =>
          item.type !== 'comment' || item.id !== commentId
        ) || []
      }));

      setLayers(updatedLayers);

      // Update Firestore
      const projectRef = doc(db, 'projects', projectId);
      await setDoc(projectRef, {
        layers: updatedLayers,
        lastModified: serverTimestamp()
      }, { merge: true });

      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
      // Revert on error
      setLayers(layers);
    }
  };

  const handleReview = async (status) => {
    if (!isReviewer || isOwner) {
      toast.error('You do not have permission to review this project');
      return;
    }

    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        reviewStatus: status,
        lastReviewedAt: new Date(),
        lastReviewedBy: currentUser?.email,
        [`reviewHistory.${new Date().toISOString()}`]: {
          status,
          reviewer: currentUser?.email
        }
      });

      toast.success(`Project marked as ${status}`);
    } catch (error) {
      console.error('Error updating review status:', error);
      toast.error('Failed to update review status');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      // Optimistic update
      setLayers(prevLayers => prevLayers.filter(layer => layer.id !== fileToDelete.id));

      // Delete from Firestore
      const projectRef = doc(db, 'projects', projectId);
      const updatedLayers = layers.filter(layer => layer.id !== fileToDelete.id);

      // Set the entire layers array directly
      await setDoc(projectRef, {
        layers: updatedLayers,
        lastModified: serverTimestamp()
      }, { merge: true });

      toast.success('File deleted');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
      // Revert on error
      setLayers(layers);
    } finally {
      setShowDeleteModal(false);
      setFileToDelete(null);
    }
  };

  const handleStatusChange = async (result) => {
    if (result.success) {
      setSelectedReview(prev => ({
        ...prev,
        status: result.newStatus,
        lastStatusUpdate: result.timestamp,
        lastUpdatedBy: result.statusUpdate.updatedBy,
        statusHistory: [...(prev.statusHistory || []), result.statusUpdate]
      }));

      // Update the review in the reviews list
      setReviews(prevReviews =>
        prevReviews.map(review =>
          review.id === selectedReview.id
            ? {
              ...review,
              status: result.newStatus,
              lastStatusUpdate: result.timestamp,
              lastUpdatedBy: result.statusUpdate.updatedBy,
              statusHistory: [...(review.statusHistory || []), result.statusUpdate]
            }
            : review
        )
      );

      // Send notification to reviewers
      if (isOwner && selectedReview) {
        // Get task content and create shortened version
        const taskContent = selectedReview.content || selectedReview.description || 'Untitled';
        const shortenedContent = taskContent.length > 20
          ? `${taskContent.substring(0, 20)}...`
          : taskContent;

        reviewers.forEach(reviewerId => {
          if (reviewerId !== currentUser?.email) {
            createNotification({
              recipientId: reviewerId,
              message: `[${projectName}] Task "${shortenedContent}" status updated to ${result.newStatus} by ${currentUser?.email}`,
              type: 'status_update',
              projectId: projectId,
              taskId: selectedReview.id
            });
          }
        });
      }
    }
  };

  const handleSelectReview = (review) => {
    setSelectedReview(review);
    setIsReviewPanelOpen(true);
  };

  const handleAddReview = async (reviewData) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        reviews: arrayUnion(reviewData)
      });
      toast.success('Review added successfully');
    } catch (error) {
      console.error('Error adding review:', error);
      toast.error('Failed to add review');
    }
  };

  // Add optimized debounced save function
  const debouncedUpdateLayers = useCallback(
    debounce(async (updatedLayers) => {
      try {
        const projectRef = doc(db, 'projects', projectId);
        await setDoc(projectRef, {
          layers: updatedLayers,
          lastModified: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error('Error updating layers:', error);
        toast.error('Failed to update file position');
      }
    }, 1000), // Increased debounce time for better performance
    [projectId]
  );

  // File content rendering helper
  const renderFileContent = useCallback((item) => {
    if (item.type === 'file' || item.type === 'image' || item.type === 'svg') {
      return (
        <DraggableFile
          key={item.id}
          file={item}
          scale={scale}
          onUpdate={(updatedFile) => {
            // Optimistic local update for smooth UI
            const updatedLayers = layers.map(layer => ({
              ...layer,
              content: layer.content?.map(content =>
                content.id === item.id
                  ? { ...content, ...updatedFile }
                  : content
              )
            }));

            // Update local state immediately for smooth rendering
            setLayers(updatedLayers);

            // Debounced update to Firestore
            debouncedUpdateLayers(updatedLayers);
          }}
          isSelected={selectedFileId === item.id}
          onSelect={() => setSelectedFileId(item.id)}
        />
      );
    }
    return null;
  }, [layers, scale, selectedFileId, debouncedUpdateLayers]);

  // Optimize layer rendering with memoization
  const renderedLayers = React.useMemo(() => {
    if (!Array.isArray(layers)) return null;

    return layers.map(layer => {
      if (!layer?.visible || !Array.isArray(layer?.content)) return null;

      return layer.content.map(item => {
        // Skip code blocks as they're rendered separately
        if (item.type === 'code') return null;
        return renderFileContent(item);
      });
    });
  }, [layers, renderFileContent]);

  const handleProjectStatusChange = async (newStatus) => {
    if (!projectId || !currentUser || !isReviewer || isOwner) return;

    try {
      const projectRef = doc(db, 'projects', projectId);

      if (newStatus === 'CHANGES_REQUESTED') {
        setShowChangeRequestModal(true);
        return;
      }

      // Update both project status and project card status
      await updateDoc(projectRef, {
        status: newStatus,
        projectStatus: newStatus, // Add this for project card
        lastStatusUpdate: serverTimestamp(),
        lastUpdatedBy: currentUser.email
      });

      // Send notification to project owner
      if (projectOwner) {
        createNotification({
          recipientId: projectOwner,
          message: `[${projectName}] Project status updated to ${newStatus} by ${currentUser.email}`,
          type: 'project_status_update',
          projectId: projectId
        });
      }

      toast.success(`Project marked as ${newStatus}`);
      setProjectStatus(newStatus);
    } catch (error) {
      console.error('Error updating project status:', error);
      toast.error('Failed to update project status');
    }
  };

  const handleChangeRequestSubmit = async () => {
    if (!changeRequestText.trim()) {
      toast.error('Please describe the requested changes');
      return;
    }

    try {
      const projectRef = doc(db, 'projects', projectId);
      const changeRequest = {
        id: Date.now().toString(),
        text: changeRequestText,
        requestedBy: currentUser.email,
        requestedAt: new Date().toISOString(),
        status: 'pending'
      };

      // Update both project status and project card status
      await updateDoc(projectRef, {
        status: 'CHANGES_REQUESTED',
        projectStatus: 'CHANGES_REQUESTED', // Add this for project card
        lastStatusUpdate: serverTimestamp(),
        lastUpdatedBy: currentUser.email,
        changesRequested: arrayUnion(changeRequest)
      });

      // Send notification to project owner
      if (projectOwner) {
        createNotification({
          recipientId: projectOwner,
          message: `[${projectName}] Changes requested by ${currentUser.email}: "${changeRequestText.substring(0, 50)}${changeRequestText.length > 50 ? '...' : ''}"`,
          type: 'changes_requested',
          projectId: projectId
        });
      }

      toast.success('Changes requested successfully');
      setProjectStatus('CHANGES_REQUESTED');
      setShowChangeRequestModal(false);
      setChangeRequestText('');
    } catch (error) {
      console.error('Error requesting changes:', error);
      toast.error('Failed to request changes');
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-900">
      <div className="flex h-screen">
        <div className="flex-1 relative">
          {/* Status buttons */}
          {isReviewer && !isOwner && (
            <div className="absolute top-4 right-4 z-[100] flex gap-2">
              <button
                onClick={() => handleProjectStatusChange('APPROVED')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                title="Approve Project"
              >
                <FiCheck className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => handleProjectStatusChange('REJECTED')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                title="Reject Project"
              >
                <FiX className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={() => setShowChangeRequestModal(true)}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                title="Request Changes"
              >
                <FiAlertCircle className="w-4 h-4" />
                Request Changes
              </button>
            </div>
          )}

          {/* Canvas container */}
          <div
            ref={containerRef}
            className="absolute inset-0 overflow-auto bg-slate-950 p-8"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Zoom Display */}
            <div className="absolute top-4 left-4 z-50">
              <div className="flex items-center justify-center px-3 py-2 bg-slate-800 text-white rounded-lg">
                {Math.round(scale * 100)}%
              </div>
            </div>

            {/* Review List */}
            <ReviewList
              reviews={reviews}
              onSelectReview={handleSelectReview}
              selectedReview={selectedReview}
              projectId={projectId}
              currentUser={currentUser}
              isReviewer={isReviewer}
              isOwner={isOwner}
              onAddReview={handleAddReview}
              layers={layers}
              setLayers={setLayers}
            />

            <div className="flex">
              <div
                className={`relative mx-auto bg-slate-800 rounded-lg shadow-2xl ${isDraggingFile ? 'ring-2 ring-violet-500' : ''}`}
                style={{
                  width: `${CANVAS_WIDTH}px`,
                  height: `${CANVAS_HEIGHT}px`,
                  transform: `scale(${scale})`,
                  transformOrigin: 'center center'
                }}
              >
                {/* Canvas element */}
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="absolute inset-0"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onClick={handleCanvasClick}
                  style={{
                    cursor: activeTool === 'text' ? 'text' :
                      activeTool === 'comment' ? 'crosshair' :
                        activeTool === 'select' ? 'default' : 'crosshair'
                  }}
                />

                {/* Render code blocks */}
                {layers.map(layer => {
                  if (!layer?.visible || !Array.isArray(layer?.content)) return null;
                  return layer.content.map(item => {
                    if (item.type === 'code') {
                      return (
                        <DraggableFile
                          key={item.id}
                          file={item}
                          scale={scale}
                          isSelected={selectedFileId === item.id}
                          onSelect={() => setSelectedFileId(item.id)}
                          onUpdate={(updatedItem) => {
                            const updatedLayers = layers.map(l => {
                              if (l.id === layer.id) {
                                return {
                                  ...l,
                                  content: l.content.map(c =>
                                    c.id === item.id ? updatedItem : c
                                  )
                                };
                              }
                              return l;
                            });
                            setLayers(updatedLayers);
                          }}
                          renderContent={() => (
                            <CodeBlock
                              file={item}
                              onUpdate={(updatedItem) => {
                                const updatedLayers = layers.map(l => {
                                  if (l.id === layer.id) {
                                    return {
                                      ...l,
                                      content: l.content.map(c =>
                                        c.id === item.id ? updatedItem : c
                                      )
                                    };
                                  }
                                  return l;
                                });
                                setLayers(updatedLayers);
                              }}
                            />
                          )}
                        />
                      );
                    }
                    return null;
                  });
                })}

                {/* Use memoized rendered layers */}
                {renderedLayers}

                {/* Render existing text and comments */}
                {Array.isArray(layers) && layers.map(layer => {
                  if (!layer?.visible || !Array.isArray(layer?.content)) return null;
                  return layer.content.map((item, index) => {
                    if (item.type === 'text') {
                      return (
                        <div
                          key={item.id || index}
                          className="absolute"
                          style={{
                            left: `${item.position?.x ?? 0}px`,
                            top: `${item.position?.y ?? 0}px`,
                            transform: `scale(${scale})`,
                            transformOrigin: 'top left'
                          }}
                        >
                          <div
                            className="text-white"
                            style={item.style}
                          >
                            {item.content}
                          </div>
                        </div>
                      );
                    }
                    if (item.type === 'comment') {
                      return (
                        <CommentPin
                          key={item.id || index}
                          comment={{
                            id: item.id,
                            content: item.content,
                            author: item.author,
                            timestamp: item.timestamp,
                            position: item.position
                          }}
                          scale={scale}
                          onDelete={() => handleCommentDelete(item.id)}
                        />
                      );
                    }
                    return null;
                  });
                })}

                {/* Text Input */}
                {textInput && typeof textInput.x === 'number' && typeof textInput.y === 'number' && (
                  <PremiumFeature
                    feature="text_tool"
                    fallback={
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-700">
                        <p className="text-white text-center mb-3">Text Tool is a Pro Feature</p>
                        <a
                          href="/pricing"
                          className="inline-block w-full text-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                        >
                          Upgrade to Pro
                        </a>
                      </div>
                    }
                  >
                    <TextEditor
                      position={textInput}
                      onComplete={handleTextComplete}
                      onCancel={handleTextCancel}
                      scale={scale}
                    />
                  </PremiumFeature>
                )}

                {/* Comment Input */}
                {commentInput && typeof commentInput.x === 'number' && typeof commentInput.y === 'number' && (
                  <CommentPin
                    position={commentInput}
                    isEditing={true}
                    onComplete={handleCommentComplete}
                    onCancel={handleCommentCancel}
                    scale={scale}
                  />
                )}

                {/* File Drop Overlay */}
                {isDraggingFile && (
                  <div className="absolute inset-0 bg-violet-500/20 flex items-center justify-center">
                    <div className="bg-slate-800 rounded-lg p-4 shadow-xl border border-violet-500">
                      <p className="text-white">Drop files here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Change Request Modal */}
          {showChangeRequestModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
              <div className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-2xl mx-4">
                <h2 className="text-xl font-semibold text-white mb-4">Request Changes</h2>
                <textarea
                  value={changeRequestText}
                  onChange={(e) => setChangeRequestText(e.target.value)}
                  placeholder="Describe the changes you'd like to request..."
                  className="w-full h-40 px-4 py-3 bg-slate-700 text-white rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none resize-none"
                  autoFocus
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => {
                      setShowChangeRequestModal(false);
                      setChangeRequestText('');
                    }}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangeRequestSubmit}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Show changes requested for owner */}
          {isOwner && projectChangesRequested.length > 0 && (
            <div className="absolute top-4 right-4 z-50">
              <div className="bg-slate-800 p-4 rounded-lg shadow-lg max-w-md">
                <h3 className="text-lg font-semibold text-white mb-2">Requested Changes</h3>
                {projectChangesRequested.map((change) => (
                  <div key={change.id} className="mb-3 last:mb-0 p-3 bg-slate-700 rounded-lg">
                    <p className="text-white text-sm mb-1">{change.text}</p>
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>By: {change.requestedBy}</span>
                      <span>{new Date(change.requestedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Panel */}
          <PremiumFeature
            feature="review_panel"
            fallback={
              isReviewPanelOpen && (
                <div className="fixed right-0 top-0 bottom-0 w-80 bg-slate-800 border-l border-slate-700 p-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-white mb-4">Review Panel</h3>
                    <p className="text-slate-400 mb-6">
                      The Review Panel is a Pro feature that allows you to manage and track feedback in one place.
                    </p>
                    <a
                      href="/pricing"
                      className="inline-block px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                    >
                      Upgrade to Pro
                    </a>
                    <button
                      onClick={() => setIsReviewPanelOpen(false)}
                      className="mt-4 w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )
            }
          >
            <ReviewPanel
              isOpen={isReviewPanelOpen}
              onClose={() => setIsReviewPanelOpen(false)}
              selectedReview={selectedReview}
              projectId={projectId}
              onStatusChange={handleStatusChange}
              currentUser={currentUser}
              isOwner={isOwner}
              isReviewer={isReviewer}
            />
          </PremiumFeature>
        </div>
      </div>
    </div>
  );
};

export default Canvas;  
