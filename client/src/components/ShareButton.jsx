import React, { useState } from 'react';
import { FiShare2 } from 'react-icons/fi';
import ShareModal from './ShareModal';

const ShareButton = ({ projectId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-[#2DD4BF] text-[#0A1628] rounded-lg hover:bg-[#14B8A6] transition-colors flex items-center space-x-2 font-medium"
      >
        <FiShare2 className="w-5 h-5" />
        <span>Share</span>
      </button>

      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
      />
    </>
  );
};

export default ShareButton; 