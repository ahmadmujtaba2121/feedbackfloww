// Project Formats with icons and labels
export const PROJECT_FORMATS = {
  'PNG': {
    icon: '🖼️',
    extension: '.png',
    mimeType: 'image/png'
  },
  'JPEG': {
    icon: '📸',
    extension: '.jpg,.jpeg',
    mimeType: 'image/jpeg'
  },
  'SVG': {
    icon: '🎨',
    extension: '.svg',
    mimeType: 'image/svg+xml'
  },
  'PDF': {
    icon: '📄',
    extension: '.pdf',
    mimeType: 'application/pdf'
  },
  'FIGMA': {
    icon: '🎯',
    extension: '.fig',
    mimeType: 'application/figma'
  },
  'AI': {
    icon: '🎨',
    extension: '.ai',
    mimeType: 'application/illustrator'
  }
};

// Project Status with labels and colors
export const PROJECT_STATUS = {
  'PENDING': {
    label: 'Pending Review',
    color: 'text-accent',
    icon: '⏳'
  },
  'APPROVED': {
    label: 'Approved',
    color: 'text-primary',
    icon: '✅'
  },
  'REJECTED': {
    label: 'Rejected',
    color: 'text-red-400',
    icon: '❌'
  },
  'IN_PROGRESS': {
    label: 'In Progress',
    color: 'text-primary',
    icon: '🔄'
  }
};

// Project Roles
export const PROJECT_ROLES = {
  'OWNER': {
    label: 'Project Owner',
    permissions: ['edit', 'delete', 'invite', 'review']
  },
  'COLLABORATOR': {
    label: 'Collaborator',
    permissions: ['edit', 'comment']
  },
  'REVIEWER': {
    label: 'Reviewer',
    permissions: ['comment', 'review']
  },
  'VIEWER': {
    label: 'Viewer',
    permissions: ['view']
  }
};

// User Roles
export const USER_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  REVIEWER: 'reviewer',
  VIEWER: 'viewer'
};

// File Categories
export const FILE_CATEGORIES = {
  DESIGN: 'design',
  REFERENCE: 'reference',
  FEEDBACK: 'feedback',
  REVISION: 'revision'
};

// Maximum file sizes (in bytes)
export const MAX_FILE_SIZES = {
  DESIGN: 50 * 1024 * 1024, // 50MB
  IMAGE: 10 * 1024 * 1024,  // 10MB
  DOCUMENT: 20 * 1024 * 1024, // 20MB
  PROTOTYPE: 50 * 1024 * 1024 // 50MB
};

// API Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'You are not authorized to perform this action',
  NOT_FOUND: 'The requested resource was not found',
  INVALID_FILE: 'Invalid file type or size',
  UPLOAD_FAILED: 'Failed to upload file',
  PROJECT_CREATE_FAILED: 'Failed to create project',
  PROJECT_UPDATE_FAILED: 'Failed to update project',
  PROJECT_DELETE_FAILED: 'Failed to delete project'
};

export const TOOLS = {
  SELECT: 'select',
  PAN: 'pan',
  DRAW: 'draw',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  TEXT: 'text',
  COMMENT: 'comment'
};

export const COLORS = {
  PRIMARY: 'var(--primary)',
  SECONDARY: 'var(--secondary)',
  ACCENT: 'var(--accent)',
  ERROR: '#ef4444',
  SUCCESS: '#22c55e'
};

export const DEFAULT_DRAWING_SETTINGS = {
  color: COLORS.PRIMARY,
  size: 2,
  opacity: 1
};

export const DEFAULT_TEXT_SETTINGS = {
  fontFamily: 'Arial',
  fontSize: 16,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  textAlign: 'left',
  color: COLORS.PRIMARY,
  backgroundColor: 'transparent'
};
