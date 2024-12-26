import React, { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiX } from 'react-icons/fi';

const CommentPin = ({ comment, position = { x: 0, y: 0 }, isEditing = false, onComplete, onCancel, onDelete, scale = 1 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [commentText, setCommentText] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleComplete();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleComplete = () => {
    if (commentText.trim() && onComplete) {
      onComplete({
        content: commentText.trim()
      });
      setCommentText('');
    } else {
      handleCancel();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    setCommentText('');
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete && comment) {
      onDelete(comment.id);
    }
  };

  const pos = comment?.position || position;

  const x = pos?.x ?? 0;
  const y = pos?.y ?? 0;

  return (
    <div
      className="absolute"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: 'center',
        zIndex: isEditing ? 1000 : 50
      }}
    >
      {isEditing ? (
        <div className="flex flex-col bg-slate-800 rounded-lg p-3 shadow-lg border border-slate-700 min-w-[200px]">
          <textarea
            ref={inputRef}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment..."
            className="min-w-[200px] bg-slate-900/50 backdrop-blur-sm text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-violet-500 outline-none resize-none mb-3"
            rows={3}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleComplete}
              className="px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-colors text-sm"
            >
              Add Comment
            </button>
          </div>
        </div>
      ) : (
        <div
          className="relative group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Delete Button */}
          {!isEditing && comment && (
            <button
              onClick={handleDelete}
              className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              title="Delete comment"
            >
              <FiX className="w-3 h-3 text-white" />
            </button>
          )}

          {/* Comment Icon */}
          <div className="w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-violet-600 transition-colors">
            <FiMessageCircle className="w-4 h-4 text-white" />
          </div>

          {/* Comment Popup */}
          {isHovered && comment && (
            <div className="absolute left-8 top-0 bg-slate-800 rounded-lg p-3 shadow-lg border border-slate-700 min-w-[200px] whitespace-normal">
              <div className="text-sm text-slate-400 mb-1">
                {comment.author} • {new Date(comment.timestamp).toLocaleString()}
              </div>
              <div className="text-white whitespace-pre-wrap">{comment.content}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentPin; 