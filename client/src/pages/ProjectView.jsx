import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUpload, FiMaximize2, FiClock, FiUsers, FiFile, FiImage, FiTrash2, FiEye, FiList, FiCalendar, FiCheckSquare, FiZap, FiDollarSign } from 'react-icons/fi';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp, deleteDoc, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import ShareButton from '../components/ShareButton';
import TimeTracker from '../components/TimeTracking/TimeTracker';
import InvoiceGenerator from '../components/TimeTracking/InvoiceGenerator';
import ProjectSettings from '../components/ProjectSettings';
import { TaskProvider } from '../contexts/TaskContext';
import KanbanBoard from '../components/KanbanBoard';
import Calendar from '../components/Calendar';
import TeamSection from '../components/TeamSection';
import TaskAssignmentSection from '../components/TaskManagement/TaskAssignmentSection';
import InvoiceSection from '../components/TimeTracking/InvoiceSection';

const ProjectView = () => {
  const { projectId, inviteId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteFileModalOpen, setDeleteFileModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks');
  const isInviteView = Boolean(inviteId);
  const currentUser = auth.currentUser;
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    let unsubscribe;
    const loadProjectData = async () => {
      if (!projectId) return;

      try {
        const projectRef = doc(db, 'projects', projectId);
        unsubscribe = onSnapshot(projectRef,
          (doc) => {
            if (doc.exists()) {
              const data = doc.data();
              data.tasks = Array.isArray(data.tasks) ? data.tasks : [];
              data.reviews = Array.isArray(data.reviews) ? data.reviews : [];
              data.reviews = data.reviews.map(review => ({
                ...review,
                timestamp: review.timestamp?.toDate?.() || new Date(review.timestamp),
                status: (review.status || 'pending').toUpperCase()
              }));
              data.status = (data.status || 'PENDING').toUpperCase();
              setProject(data);

              // Find user's role from members array
              const member = data.members?.find(m => m.email === currentUser?.email);
              setUserRole(member?.role || 'VIEWER');
            } else {
              toast.error('Project not found');
              navigate('/dashboard');
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error loading project:', error);
            toast.error('Failed to load project');
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('Error loading project:', error);
        toast.error('Failed to load project');
        setLoading(false);
      }
    };

    loadProjectData();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [projectId, navigate]);

  const projectData = useMemo(() => ({
    ...project,
    id: projectId,
    userRole
  }), [project, projectId, userRole]);

  const canEdit = userRole === 'OWNER' || userRole === 'EDITOR';
  const canView = userRole === 'VIEWER' || canEdit;

  if (!canView) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-red-500/10 text-red-400 p-4 rounded-lg border border-red-500/20">
          You don't have permission to view this project
        </div>
      </div>
    );
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ukecpfrg');
      formData.append('folder', `feedbackflow/${project.format.toLowerCase()}`);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dysa2jeyb/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Upload failed');

      const newFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: data.secure_url,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: auth.currentUser?.email || 'unknown',
        status: 'pending'
      };

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        files: arrayUnion(newFile),
        lastModified: serverTimestamp(),
        lastModifiedBy: auth.currentUser?.email || 'unknown',
        activityLog: arrayUnion({
          type: 'file_upload',
          user: auth.currentUser?.email || 'unknown',
          fileName: file.name,
          timestamp: new Date().toISOString()
        })
      });

      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteClick = (file) => {
    setFileToDelete(file);
    setDeleteFileModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;

    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);

      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const files = projectDoc.data().files || [];
      const updatedFiles = files.filter(f => f.id !== fileToDelete.id);

      await updateDoc(projectRef, {
        files: updatedFiles,
        lastModified: serverTimestamp(),
        lastModifiedBy: auth.currentUser?.email || 'unknown'
      });

      toast.success('File deleted successfully');
      setFileToDelete(null);
      setDeleteFileModalOpen(false);
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleDeleteProject = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteProject = async () => {
    try {
      setLoading(true);
      const projectRef = doc(db, 'projects', projectId);
      await deleteDoc(projectRef);
      toast.success('Project deleted successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleOpenCanvas = () => {
    navigate(`/project/${projectId}/canvas`, {
      state: {
        project: projectData,
        canEdit: canEdit
      }
    });
  };

  const handleOpenKanban = () => {
    navigate(`/project/${projectId}/kanban`, {
      state: {
        project: projectData,
        canEdit: canEdit
      }
    });
  };

  const handleOpenCalendar = () => {
    navigate(`/project/${projectId}/calendar`, {
      state: {
        project: projectData,
        canEdit: canEdit
      }
    });
  };

  const handleOpenAIAssistant = () => {
    navigate(`/project/${projectId}/ai-assistant`, {
      state: {
        project: projectData,
        canEdit: canEdit
      }
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'tasks':
        return (
          <TaskProvider projectId={projectId}>
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-secondary-foreground">Project Tasks</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => isInviteView ? navigate(`/invite/${projectId}/${inviteId}/kanban`) : navigate(`/project/${projectId}/kanban`)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-accent transition-colors flex items-center space-x-2"
                  >
                    <FiList className="w-5 h-5" />
                    <span>View All Tasks</span>
                  </button>
                </div>
              </div>
              <TaskAssignmentSection projectId={projectId} members={project?.members || []} />
            </div>
          </TaskProvider>
        );
      case 'files':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-secondary-foreground">Project Files</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {project.files?.map((file) => (
                <div
                  key={file.id}
                  className="bg-muted rounded-lg p-4 border border-border"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <FiImage className="w-5 h-5 text-primary mr-2" />
                      <span className="text-secondary-foreground font-medium">{file.name}</span>
                    </div>
                    {userRole !== 'VIEWER' && (
                      <button
                        onClick={() => handleDeleteClick(file)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Uploaded by {file.uploadedBy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'team':
        return <TeamSection members={project.members || []} />;
      case 'time':
        return (
          <div className="space-y-6">
            <TimeTracker projectId={projectId} />
          </div>
        );
      case 'calendar':
        return (
          <div className="bg-card rounded-lg p-6">
            <Calendar project={project} />
          </div>
        );
      case 'ai-assistant':
        return (
          <div className="bg-card rounded-lg p-6">
            <div className="text-center text-muted-foreground">
              <p>AI Assistant feature is coming soon!</p>
            </div>
          </div>
        );
      case 'invoice':
        return <InvoiceSection projectId={projectId} />;
      default:
        return null;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!project) {
    return null;
  }

  return (
    <TaskProvider>
      <div className="min-h-screen bg-background pt-16 sm:pt-20 pb-8 sm:pb-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="bg-foreground/95 backdrop-blur-lg rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-border">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="w-full sm:w-auto">
                <h1 className="text-2xl sm:text-3xl font-bold text-secondary-foreground mb-2 break-words">{project.name}</h1>
                <p className="text-sm sm:text-base text-muted-foreground break-words">{project.description}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${userRole === 'OWNER' ? 'bg-primary/20 text-primary' :
                    userRole === 'EDITOR' ? 'bg-primary/10 text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                    <FiEye className="mr-1 h-3 w-3" />
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
                {userRole === 'OWNER' && !isInviteView && <ShareButton projectId={projectId} />}
                <button
                  onClick={handleOpenCalendar}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-accent transition-colors flex items-center justify-center space-x-2 font-medium text-sm sm:text-base"
                >
                  <FiCalendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Calendar</span>
                </button>
                <button
                  onClick={handleOpenKanban}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-accent transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <FiList className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Kanban Board</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-4">
              <button
                onClick={handleOpenCanvas}
                disabled={!project?.files?.length}
                className={`flex items-center px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${project?.files?.length
                  ? 'bg-primary text-primary-foreground hover:bg-accent'
                  : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
                  }`}
              >
                <FiMaximize2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Open Canvas
              </button>

              {userRole !== 'VIEWER' && (
                <label className="flex items-center px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-accent transition-colors cursor-pointer text-sm sm:text-base">
                  <FiUpload className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Upload File
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf"
                    disabled={uploading}
                  />
                </label>
              )}

              {userRole === 'OWNER' && (
                <button
                  onClick={handleDeleteProject}
                  className="flex items-center px-3 sm:px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-medium text-sm sm:text-base"
                >
                  <FiTrash2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Delete Project
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex space-x-2 sm:space-x-4 mb-4 sm:mb-6 border-b border-border min-w-max">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-3 sm:px-4 py-2 font-medium transition-colors text-sm sm:text-base ${activeTab === 'tasks'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-secondary-foreground'
                  }`}
              >
                <FiList className="w-4 h-4 sm:w-5 sm:h-5 inline-block mr-2" />
                Tasks
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`px-3 sm:px-4 py-2 font-medium transition-colors text-sm sm:text-base ${activeTab === 'files'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-secondary-foreground'
                  }`}
              >
                <FiFile className="w-4 h-4 sm:w-5 sm:h-5 inline-block mr-2" />
                Files
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`px-3 sm:px-4 py-2 font-medium transition-colors text-sm sm:text-base ${activeTab === 'team'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-secondary-foreground'
                  }`}
              >
                <FiUsers className="w-4 h-4 sm:w-5 sm:h-5 inline-block mr-2" />
                Team
              </button>
              <button
                onClick={() => setActiveTab('time')}
                className={`px-3 sm:px-4 py-2 font-medium transition-colors text-sm sm:text-base ${activeTab === 'time'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-secondary-foreground'
                  }`}
              >
                <FiClock className="w-4 h-4 sm:w-5 sm:h-5 inline-block mr-2" />
                Time Tracking
              </button>
              <button
                onClick={handleOpenCalendar}
                className={`px-3 sm:px-4 py-2 font-medium transition-colors text-sm sm:text-base ${activeTab === 'calendar'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-secondary-foreground'
                  }`}
              >
                <FiCalendar className="w-4 h-4 sm:w-5 sm:h-5 inline-block mr-2" />
                Calendar
              </button>
              <button
                onClick={handleOpenAIAssistant}
                className={`px-3 sm:px-4 py-2 font-medium transition-colors text-sm sm:text-base ${activeTab === 'ai-assistant'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-secondary-foreground'
                  }`}
              >
                <FiMaximize2 className="w-4 h-4 sm:w-5 sm:h-5 inline-block mr-2" />
                AI Assistant
              </button>
              <button
                onClick={() => setActiveTab('invoice')}
                className={`px-3 sm:px-4 py-2 font-medium transition-colors text-sm sm:text-base ${activeTab === 'invoice'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-secondary-foreground'
                  }`}
              >
                <FiDollarSign className="w-4 h-4 sm:w-5 sm:h-5 inline-block mr-2" />
                Invoice
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-foreground/95 backdrop-blur-lg rounded-lg border border-border p-3 sm:p-6">
            {renderContent()}
          </div>
        </div>

        {/* Delete File Modal */}
        <Modal
          isOpen={deleteFileModalOpen}
          onClose={() => setDeleteFileModalOpen(false)}
          title="Delete File"
        >
          <div className="p-6">
            <p className="text-secondary-foreground mb-4">
              Are you sure you want to delete this file? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setDeleteFileModalOpen(false)}
                className="px-4 py-2 text-muted-foreground hover:text-secondary-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>

        {/* Delete Project Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Project"
        >
          <div className="p-6">
            <p className="text-secondary-foreground mb-4">
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-muted-foreground hover:text-secondary-foreground"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProject}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete Project
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </TaskProvider>
  );
};

export default ProjectView;
