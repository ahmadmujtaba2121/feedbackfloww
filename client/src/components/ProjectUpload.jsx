import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

const ProjectUpload = ({ onFileSelect, selectedCategory }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const { currentUser } = useAuth();

  const acceptedTypes = {
    design: '.fig,.psd,.ai,.xd,.sketch,.png,.jpg,.jpeg',
    document: '.pdf,.doc,.docx',
    image: '.png,.jpg,.jpeg,.gif,.webp',
    prototype: '.fig,.xd,.sketch'
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const validateAndProcessFile = (file) => {
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    const acceptedExtensions = acceptedTypes[selectedCategory].split(',');
    
    if (!acceptedExtensions.includes(fileExtension)) {
      alert(`Invalid file type. Please upload one of: ${acceptedTypes[selectedCategory]}`);
      return;
    }

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    onFileSelect(file);
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept={acceptedTypes[selectedCategory]}
        className="hidden"
      />

      <motion.div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          ${isDragging ? 'border-violet-500 bg-violet-50' : 'border-gray-300 hover:border-violet-500'}
          transition-colors duration-200`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {preview ? (
          <div className="relative">
            <img 
              src={preview} 
              alt="File preview" 
              className="max-h-48 mx-auto rounded-lg shadow-md"
            />
            <p className="mt-2 text-sm text-gray-500">Click or drag to change file</p>
          </div>
        ) : (
          <>
            <div className="mx-auto w-12 h-12 mb-3">
              <svg className="text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
              </svg>
            </div>
            <p className="text-gray-600 mb-1">
              Drag and drop your file here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Accepted formats: {acceptedTypes[selectedCategory]}
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ProjectUpload;
