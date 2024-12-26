import { auth } from '../firebase/firebase';
import { handleError, ErrorTypes } from './errorHandler';
import { toast } from 'react-hot-toast';

// Security levels for different operations
export const SecurityLevels = {
  PUBLIC: 'public',
  PROTECTED: 'protected',
  PRIVATE: 'private',
  ADMIN: 'admin'
};

// Permission types
export const Permissions = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  ADMIN: 'admin'
};

// Role definitions
export const Roles = {
  ADMIN: 'admin',
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer'
};

// Role permissions mapping
const rolePermissions = {
  [Roles.ADMIN]: [Permissions.READ, Permissions.WRITE, Permissions.DELETE, Permissions.ADMIN],
  [Roles.OWNER]: [Permissions.READ, Permissions.WRITE, Permissions.DELETE],
  [Roles.EDITOR]: [Permissions.READ, Permissions.WRITE],
  [Roles.VIEWER]: [Permissions.READ]
};

// Check if user has required permission
export const hasPermission = (userRole, requiredPermission) => {
  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(requiredPermission);
};

// Validate user session
export const validateSession = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No active session');
    }

    // Check token expiration
    const token = await user.getIdTokenResult();
    const expirationTime = new Date(token.expirationTime).getTime();
    const currentTime = new Date().getTime();

    if (expirationTime <= currentTime) {
      await auth.signOut();
      throw new Error('Session expired');
    }

    return true;
  } catch (error) {
    handleError(error, ErrorTypes.AUTHENTICATION);
    return false;
  }
};

// Sanitize user input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim(); // Remove leading/trailing whitespace
};

// Validate file security
export const validateFile = (file) => {
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_FILE_TYPES = {
    'image/jpeg': true,
    'image/png': true,
    'image/gif': true,
    'image/webp': true,
    'application/pdf': true
  };

  if (!file) {
    throw new Error('No file provided');
  }

  if (!ALLOWED_FILE_TYPES[file.type]) {
    throw new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 50MB limit');
  }

  return true;
};

// Encrypt sensitive data
export const encryptData = (data) => {
  // This is a placeholder for actual encryption
  // In production, use a proper encryption library
  return btoa(JSON.stringify(data));
};

// Decrypt sensitive data
export const decryptData = (encryptedData) => {
  // This is a placeholder for actual decryption
  // In production, use a proper encryption library
  return JSON.parse(atob(encryptedData));
};

// Rate limiting for security-sensitive operations
const securityRateLimits = new Map();

export const checkSecurityRateLimit = (operationKey, maxAttempts = 5, windowMs = 300000) => {
  const now = Date.now();
  const attempts = securityRateLimits.get(operationKey) || [];
  
  // Remove old attempts
  const recentAttempts = attempts.filter(time => time > now - windowMs);
  
  if (recentAttempts.length >= maxAttempts) {
    const waitTime = Math.ceil((windowMs - (now - recentAttempts[0])) / 1000);
    throw new Error(`Too many attempts. Please try again in ${waitTime} seconds.`);
  }
  
  recentAttempts.push(now);
  securityRateLimits.set(operationKey, recentAttempts);
  
  return true;
};

// Validate project access
export const validateProjectAccess = (project, user, requiredPermission) => {
  if (!project || !user) {
    throw new Error('Invalid project or user');
  }

  const userRole = project.members?.find(member => member.email === user.email)?.role;
  
  if (!userRole) {
    throw new Error('User is not a member of this project');
  }

  if (!hasPermission(userRole, requiredPermission)) {
    throw new Error(`User doesn't have ${requiredPermission} permission`);
  }

  return true;
};

// Security logging
export const logSecurityEvent = (eventType, details) => {
  const event = {
    type: eventType,
    timestamp: new Date().toISOString(),
    user: auth?.currentUser?.email || 'anonymous',
    details,
    userAgent: navigator.userAgent,
    ip: 'Captured server-side'
  };

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.log('Security Event:', event);
  }

  // In production, send to security monitoring service
  // Implement actual security logging here
};

// Export security utilities
export const SecurityUtils = {
  validateSession,
  sanitizeInput,
  validateFile,
  encryptData,
  decryptData,
  checkSecurityRateLimit,
  validateProjectAccess,
  logSecurityEvent,
  hasPermission
}; 