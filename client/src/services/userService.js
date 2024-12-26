import { auth, db, storage } from '../firebase/firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  Timestamp,
  addDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// File type restrictions
export const FILE_TYPES = {
  design: {
    label: 'Design Files',
    types: {
      'image/png': '.png',
      'image/jpeg': '.jpg,.jpeg',
      'image/webp': '.webp',
      'application/figma': '.fig',
      'application/sketch': '.sketch',
      'application/x-xd': '.xd',
      'image/vnd.adobe.photoshop': '.psd',
      'application/illustrator': '.ai'
    }
  },
  document: {
    label: 'Documents',
    types: {
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
    }
  },
  image: {
    label: 'Images',
    types: {
      'image/png': '.png',
      'image/jpeg': '.jpg,.jpeg',
      'image/gif': '.gif',
      'image/webp': '.webp'
    }
  },
  prototype: {
    label: 'Prototypes',
    types: {
      'application/figma': '.fig',
      'application/x-xd': '.xd',
      'application/sketch': '.sketch'
    }
  }
};

export const getAcceptedFileTypes = (category) => {
  const typeMap = {
    image: '.jpg,.jpeg,.png,.gif,.webp',
    pdf: '.pdf',
    design: '.jpg,.jpeg,.png,.pdf,.fig,.psd,.ai,.xd,.sketch',
    document: '.pdf,.doc,.docx',
    all: '.jpg,.jpeg,.png,.gif,.webp,.pdf'
  };

  return typeMap[category] || '';
};

export const validateFileType = (file, category) => {
  const allowedTypes = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    pdf: ['application/pdf'],
    design: ['image/jpeg', 'image/png', 'application/pdf', '.fig', '.psd', '.ai', '.xd', '.sketch'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    all: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
  };

  return allowedTypes[category]?.includes(file.type) || false;
};

export const createUserProfile = async (user, additionalData = {}) => {
  if (!user) return;

  // Create a user document with email as ID
  const userRef = doc(db, 'users', user.email);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const { email, displayName, photoURL } = user;
    const createdAt = new Date();

    try {
      await setDoc(userRef, {
        email,
        displayName,
        photoURL,
        createdAt,
        updatedAt: createdAt,
        projects: {}, // Store projects as a nested object with project IDs as keys
        collaborations: {}, // Store collaborations similarly
        inviteLinks: {}, // Store all created invite links
        settings: {
          notifications: true,
          emailNotifications: true,
          theme: 'light'
        },
        profileComplete: false,
        ...additionalData
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  return userRef;
};

export const uploadProfilePicture = async (file, userEmail) => {
  if (!validateFileType(file, 'image')) {
    throw new Error('Invalid file type. Please upload a PNG, JPEG, or WebP image.');
  }

  const timestamp = Date.now();
  const fileName = `users/${userEmail}/profile/${timestamp}_${file.name}`;
  const fileRef = ref(storage, fileName);

  try {
    const snapshot = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Update user profile with new photo URL
    const userRef = doc(db, 'users', userEmail);
    await updateDoc(userRef, {
      photoURL: downloadURL,
      updatedAt: new Date()
    });

    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

export const createProject = async (projectData) => {
  try {
    // Create a URL-friendly slug from the project name
    const slug = projectData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Add timestamp to ensure uniqueness
    const timestamp = new Date().getTime();
    const friendlyId = `${slug}-${timestamp}`;

    // Create the basic project structure
    const newProject = {
      name: projectData.name,
      description: projectData.description,
      format: projectData.format,
      friendlyId,
      owner: projectData.owner,
      userId: projectData.userId,
      status: 'PENDING',
      members: [
        {
          uid: projectData.userId,
          email: projectData.owner,
          displayName: projectData.members[0]?.displayName || '',
          role: 'OWNER'
        }
      ],
      files: [],
      reviews: [],
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add the project to Firestore
    const projectRef = await addDoc(collection(db, 'projects'), newProject);
    console.log('Created project with ID:', projectRef.id); // Debug log
    return projectRef.id;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

export const updateProject = async (projectId, projectData) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      ...projectData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

export const deleteProject = async (projectId) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await deleteDoc(projectRef);
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

export const getProject = async (projectId) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (projectSnap.exists()) {
      return {
        id: projectSnap.id,
        ...projectSnap.data()
      };
    } else {
      throw new Error('Project not found');
    }
  } catch (error) {
    console.error('Error getting project:', error);
    throw error;
  }
};

export async function getUserProjects(userId) {
  try {
    const projectsQuery = query(
      collection(db, 'projects'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(projectsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting user projects:', error);
    throw error;
  }
}

export const uploadProjectFile = async (file, projectId, category) => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      throw new Error('Only images and PDFs are supported');
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ukecpfrg');
    formData.append('folder', `feedbackflow/projects/${projectId}`);

    // Handle images and PDFs differently
    if (file.type === 'application/pdf') {
      // For PDFs, use auto resource type and add delivery type
      formData.append('resource_type', 'auto');
      formData.append('flags', 'attachment');
    } else {
      // For images, optimize them
      formData.append('resource_type', 'image');
    }

    // Upload to Cloudinary
    const response = await fetch(
      'https://api.cloudinary.com/v1_1/dysa2jeyb/upload',
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    const data = await response.json();

    return {
      id: `file-${Date.now()}`,
      name: file.name,
      type: file.type,
      url: data.secure_url,
      publicId: data.public_id,
      uploadedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export async function updateProjectStatus(projectId, status) {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating project status:', error);
    throw error;
  }
}

export async function addProjectComment(projectId, comment) {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);
    
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }

    const comments = projectDoc.data().comments || [];
    comments.push({
      ...comment,
      createdAt: serverTimestamp()
    });

    await updateDoc(projectRef, { comments });
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}

export const createProjectInvite = async (projectId, userEmail) => {
  try {
    const inviteCode = Math.random().toString(36).substr(2, 9);
    const timestamp = new Date();
    
    // Get user document
    const userRef = doc(db, 'users', userEmail);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    
    // Verify project exists
    if (!userData.projects[projectId]) {
      throw new Error('Project not found');
    }
    
    // Create invite data
    const inviteData = {
      code: inviteCode,
      projectId,
      createdAt: timestamp,
      active: true,
      usedBy: null,
      usedAt: null
    };
    
    // Add invite to user's project
    await updateDoc(userRef, {
      [`projects.${projectId}.inviteLinks.${inviteCode}`]: inviteData,
      updatedAt: timestamp
    });
    
    return inviteCode;
  } catch (error) {
    console.error('Error creating invite:', error);
    throw error;
  }
};

export const acceptProjectInvite = async (inviteCode, userEmail) => {
  try {
    // Find the project with this invite code
    const usersRef = collection(db, 'users');
    const q = query(usersRef);
    const querySnapshot = await getDocs(q);
    
    let projectOwner = null;
    let projectId = null;
    let projectData = null;
    
    // Search through all users to find the invite
    for (const doc of querySnapshot.docs) {
      const userData = doc.data();
      for (const [pid, project] of Object.entries(userData.projects)) {
        if (project.inviteLinks?.[inviteCode]) {
          projectOwner = doc.id;
          projectId = pid;
          projectData = project;
          break;
        }
      }
      if (projectOwner) break;
    }
    
    if (!projectOwner) {
      throw new Error('Invalid invite code');
    }
    
    // Update invite status
    const ownerRef = doc(db, 'users', projectOwner);
    await updateDoc(ownerRef, {
      [`projects.${projectId}.inviteLinks.${inviteCode}.active`]: false,
      [`projects.${projectId}.inviteLinks.${inviteCode}.usedBy`]: userEmail,
      [`projects.${projectId}.inviteLinks.${inviteCode}.usedAt`]: new Date(),
      [`projects.${projectId}.collaborators.${userEmail}`]: {
        joined: new Date(),
        role: 'viewer'
      }
    });
    
    // Add to collaborator's collaborations
    const userRef = doc(db, 'users', userEmail);
    await updateDoc(userRef, {
      [`collaborations.${projectId}`]: {
        owner: projectOwner,
        projectName: projectData.name,
        joinedAt: new Date(),
        role: 'viewer'
      }
    });
    
    return {
      projectId,
      projectName: projectData.name,
      owner: projectOwner
    };
  } catch (error) {
    console.error('Error accepting invite:', error);
    throw error;
  }
};

export async function getProjectById(projectId) {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      throw new Error('Project not found');
    }

    return { id: projectSnap.id, ...projectSnap.data() };
  } catch (error) {
    console.error('Error getting project:', error);
    throw error;
  }
}

export async function addComment(projectId, comment) {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      throw new Error('Project not found');
    }

    const comments = projectSnap.data().comments || [];
    comments.push(comment);

    await updateDoc(projectRef, { comments });
    return comment;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}

export async function updateComment(projectId, commentId, updates) {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      throw new Error('Project not found');
    }

    const comments = projectSnap.data().comments || [];
    const commentIndex = comments.findIndex(c => c.id === commentId);

    if (commentIndex === -1) {
      throw new Error('Comment not found');
    }

    comments[commentIndex] = { ...comments[commentIndex], ...updates };
    await updateDoc(projectRef, { comments });
    return comments[commentIndex];
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
}

export async function deleteComment(projectId, commentId) {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      throw new Error('Project not found');
    }

    const comments = projectSnap.data().comments || [];
    const updatedComments = comments.filter(c => c.id !== commentId);

    await updateDoc(projectRef, { comments: updatedComments });
    return commentId;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}
