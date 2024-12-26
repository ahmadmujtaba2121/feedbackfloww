import { FiImage, FiFileText, FiCode, FiLayers, FiBox } from 'react-icons/fi';

export const PROJECT_FORMATS = {
  PNG: {
    icon: '🖼️',
    label: 'PNG Image'
  },
  JPG: {
    icon: '📸',
    label: 'JPEG Image'
  },
  PDF: {
    icon: '📄',
    label: 'PDF Document'
  },
  FIGMA: {
    icon: '🎨',
    label: 'Figma Design'
  },
  SKETCH: {
    icon: '✏️',
    label: 'Sketch Design'
  },
  XD: {
    icon: '🎯',
    label: 'Adobe XD'
  }
};

export const PROJECT_ROLES = {
  OWNER: {
    label: 'Owner',
    color: 'text-primary',
    permissions: ['edit', 'delete', 'invite', 'review']
  },
  REVIEWER: {
    label: 'Reviewer',
    color: 'text-accent',
    permissions: ['review', 'comment']
  },
  VIEWER: {
    label: 'Viewer',
    color: 'text-muted-foreground',
    permissions: ['view', 'comment']
  }
};

export const TOOLS = {
  SELECT: 'select',
  TEXT: 'text',
  IMAGE: 'image',
  REVIEW: 'review'
};

export const REVIEW_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed'
};

export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed'
}; 