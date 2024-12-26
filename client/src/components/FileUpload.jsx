import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { validateFileType, uploadFile } from '../services/userService';
import { uploadProjectFile } from '../services/projectService';

const FileUpload = ({ projectId, onUploadSuccess, fileType = 'images' }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const { currentUser } = useAuth();

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setError('');
      setUploading(true);

      // Validate file type
      if (!validateFileType(file, fileType)) {
        throw new Error(`Invalid file type. Please upload one of: ${ALLOWED_FILE_TYPES[fileType].join(', ')}`);
      }

      let uploadResult;
      if (projectId) {
        // Upload to project
        uploadResult = await uploadProjectFile(projectId, file, fileType, currentUser.email);
      } else {
        // Upload to user profile
        uploadResult = await uploadFile(file, fileType, currentUser.email);
      }

      onUploadSuccess(uploadResult);
      event.target.value = ''; // Reset file input
    } catch (err) {
      setError(err.message);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={ALLOWED_FILE_TYPES[fileType].join(',')}
      />
      
      <button
        onClick={handleClick}
        disabled={uploading}
        className="w-full px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Upload File</span>
          </>
        )}
      </button>
      
      {error && (
        <p className="mt-2 text-red-500 text-sm">
          {error}
        </p>
      )}
    </div>
  );
};

export default FileUpload;
