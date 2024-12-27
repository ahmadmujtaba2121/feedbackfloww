import React, { useState, useEffect, useRef } from 'react';
import { FiClock, FiSave, FiRotateCcw, FiX, FiTrash2, FiTag, FiFilter } from 'react-icons/fi';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import { toast } from 'react-hot-toast';
import { formatTimestamp } from '../../../utils/dateUtils';

// Predefined tags with colors
const PREDEFINED_TAGS = {
  'Final': { color: 'bg-green-500', textColor: 'text-green-500' },
  'Draft': { color: 'bg-yellow-500', textColor: 'text-yellow-500' },
  'Review': { color: 'bg-blue-500', textColor: 'text-blue-500' },
  'Approved': { color: 'bg-emerald-500', textColor: 'text-emerald-500' },
  'Rejected': { color: 'bg-red-500', textColor: 'text-red-500' },
  'In Progress': { color: 'bg-violet-500', textColor: 'text-violet-500' },
};

const VersionDescriptionModal = ({ onSave, onClose }) => {
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTagSelector, setShowTagSelector] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      description: description || `Version ${new Date().toLocaleString()}`,
      tags: selectedTags
    });
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-96 shadow-xl border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Save Version</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
          >
            <FiX className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter version description (optional)"
            className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none mb-4"
            autoFocus
          />
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">Tags</span>
              <button
                type="button"
                onClick={() => setShowTagSelector(!showTagSelector)}
                className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
              >
                <FiTag className="w-4 h-4" />
              </button>
            </div>
            {selectedTags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selectedTags.map(tag => (
                  <span
                    key={tag}
                    className={`${PREDEFINED_TAGS[tag].color} px-2 py-0.5 rounded-full text-white text-xs flex items-center gap-1`}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="hover:bg-white/20 rounded-full p-0.5"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No tags selected</p>
            )}
            {showTagSelector && (
              <div className="mt-2 grid grid-cols-2 gap-1 p-2 bg-slate-700 rounded-lg">
                {Object.entries(PREDEFINED_TAGS).map(([tag, { color, textColor }]) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2 py-1 rounded text-sm flex items-center space-x-1 ${selectedTags.includes(tag) ? color + ' text-white' : 'hover:bg-slate-600 ' + textColor
                      }`}
                  >
                    <FiTag className="w-3 h-3" />
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              Save Version
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ConfirmationModal = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-96 shadow-xl border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
          >
            <FiX className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <p className="text-slate-300 mb-6">{message}</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const VersionPanel = ({ projectId, layers, setLayers }) => {
  const [versions, setVersions] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState(null);
  const [filterTag, setFilterTag] = useState(null);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const versionsEndRef = useRef(null);

  // Load versions
  useEffect(() => {
    const loadVersions = async () => {
      if (!projectId) return;

      try {
        const docRef = doc(db, 'projects', projectId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setVersions(data.versions || []);
        } else {
          console.error('Project document does not exist');
          toast.error('Could not load version history');
        }
      } catch (error) {
        console.error('Error loading versions:', error);
        toast.error('Failed to load version history');
      }
    };
    loadVersions();
  }, [projectId]);

  // Auto-scroll to bottom when new version is added
  useEffect(() => {
    if (versionsEndRef.current) {
      versionsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [versions.length]);

  const createVersion = async ({ description = '', tags = [] }) => {
    if (!projectId) {
      toast.error('No project ID provided');
      return;
    }

    try {
      const docRef = doc(db, 'projects', projectId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        toast.error('Project not found');
        return;
      }

      const newVersion = {
        id: `v${Date.now()}`,
        timestamp: new Date().toISOString(),
        description,
        tags,
        layers: JSON.parse(JSON.stringify(layers))
      };

      const updatedVersions = [...versions, newVersion];

      await updateDoc(docRef, {
        versions: updatedVersions,
        lastModified: serverTimestamp()
      });

      setVersions(updatedVersions);
      toast.success('Version saved successfully');
    } catch (error) {
      console.error('Error creating version:', error);
      toast.error('Failed to save version: ' + error.message);
    }
  };

  const deleteVersion = async (version) => {
    if (!projectId) {
      toast.error('No project ID provided');
      return;
    }

    try {
      const docRef = doc(db, 'projects', projectId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        toast.error('Project not found');
        return;
      }

      const updatedVersions = versions.filter(v => v.id !== version.id);

      await updateDoc(docRef, {
        versions: updatedVersions,
        lastModified: serverTimestamp()
      });

      setVersions(updatedVersions);
      if (selectedVersion?.id === version.id) {
        setSelectedVersion(null);
      }
      toast.success('Version deleted successfully');
    } catch (error) {
      console.error('Error deleting version:', error);
      toast.error('Failed to delete version: ' + error.message);
    }
  };

  const restoreVersion = async (version) => {
    if (!projectId) {
      toast.error('No project ID provided');
      return;
    }

    try {
      const docRef = doc(db, 'projects', projectId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        toast.error('Project not found');
        return;
      }

      setLayers(JSON.parse(JSON.stringify(version.layers)));

      await updateDoc(docRef, {
        layers: version.layers,
        lastModified: serverTimestamp()
      });

      toast.success('Version restored successfully');
    } catch (error) {
      console.error('Error restoring version:', error);
      toast.error('Failed to restore version: ' + error.message);
    }
  };

  const filteredVersions = filterTag
    ? versions.filter(version => version.tags?.includes(filterTag))
    : versions;

  return (
    <>
      <div className="w-64 bg-slate-800 border-l border-slate-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Version History</h3>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <button
                onClick={() => setShowTagFilter(!showTagFilter)}
                className={`p-1 hover:bg-slate-700 rounded transition-colors ${filterTag ? 'text-violet-500' : 'text-slate-400'
                  }`}
                title="Filter by tag"
              >
                <FiFilter className="w-5 h-5" />
              </button>
              {showTagFilter && (
                <div className="absolute right-0 top-full mt-1 bg-slate-800 rounded-lg shadow-xl border border-slate-700 p-2 z-50">
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setFilterTag(null);
                        setShowTagFilter(false);
                      }}
                      className="w-full text-left px-2 py-1 text-sm text-slate-400 hover:bg-slate-700 rounded"
                    >
                      Show All
                    </button>
                    {Object.entries(PREDEFINED_TAGS).map(([tag, { textColor }]) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setFilterTag(tag);
                          setShowTagFilter(false);
                        }}
                        className={`w-full text-left px-2 py-1 text-sm hover:bg-slate-700 rounded flex items-center space-x-2 ${textColor}`}
                      >
                        <FiTag className="w-3 h-3" />
                        <span>{tag}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
            >
              <FiClock className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto">
            {/* Save Version Button */}
            <div className="p-4 border-b border-slate-700">
              <button
                onClick={() => setShowModal(true)}
                className="w-full px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
              >
                <FiSave className="w-4 h-4" />
                <span>Save Version</span>
              </button>
            </div>

            {/* Version List */}
            <div className="p-4 space-y-3">
              {filteredVersions.map((version) => (
                <div
                  key={version.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedVersion?.id === version.id ? 'bg-slate-700' : 'hover:bg-slate-700/50'
                    }`}
                  onClick={() => setSelectedVersion(version)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">
                      {version.description}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatTimestamp(version.timestamp)}
                    </span>
                  </div>
                  {version.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {version.tags.map(tag => (
                        <span
                          key={tag}
                          className={`${PREDEFINED_TAGS[tag].color} px-2 py-0.5 rounded-full text-white text-xs`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmationModal({
                          title: 'Restore Version',
                          message: 'Are you sure you want to restore this version? Current changes will be lost.',
                          onConfirm: () => {
                            restoreVersion(version);
                            setConfirmationModal(null);
                          }
                        });
                      }}
                      className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-600 transition-colors"
                      title="Restore this version"
                    >
                      <FiRotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmationModal({
                          title: 'Delete Version',
                          message: 'Are you sure you want to delete this version? This action cannot be undone.',
                          onConfirm: () => {
                            deleteVersion(version);
                            setConfirmationModal(null);
                          }
                        });
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-slate-600 transition-colors"
                      title="Delete this version"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div ref={versionsEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Version Description Modal */}
      {showModal && (
        <VersionDescriptionModal
          onSave={(versionData) => {
            createVersion(versionData);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Confirmation Modal */}
      {confirmationModal && (
        <ConfirmationModal
          title={confirmationModal.title}
          message={confirmationModal.message}
          onConfirm={confirmationModal.onConfirm}
          onCancel={() => setConfirmationModal(null)}
        />
      )}
    </>
  );
};

export default VersionPanel; 