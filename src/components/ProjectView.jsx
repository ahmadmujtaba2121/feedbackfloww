import { useNavigate } from 'react-router-dom';

function ProjectView({ project }) {
  const navigate = useNavigate();

  const handleOpenCanvas = () => {
    navigate(`/canvas/${project.id}`);
  };

  return (
    <div>
      {/* ... other project view content ... */}
      <button
        onClick={handleOpenCanvas}
        className="inline-flex items-center px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-md shadow-sm"
        disabled={!project?.id}
      >
        <span>Open in Canvas</span>
      </button>
    </div>
  );
}

export default ProjectView; 