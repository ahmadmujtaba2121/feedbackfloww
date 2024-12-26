import { db, storage } from '../firebase/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  updateDoc,
  arrayUnion,
  deleteDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { validateFileType } from './userService';
import { toast } from 'react-hot-toast';

// Helper function to get username from email
const getUsernameFromEmail = (email) => {
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Helper function to generate project ID
const generateProjectId = (username, projectName) => {
  const sanitizedProjectName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now();
  return `${username}_${sanitizedProjectName}_${timestamp}`;
};

export const PROJECT_FORMATS = [
  'PNG',
  'JPEG',
  'SVG',
  'PSD',
  'AI'
];

export const PROJECT_ROLES = {
  OWNER: {
    title: 'Project Owner (Freelancer/Creator)',
    responsibilities: [
      'Upload files for feedback',
      'Share project links with clients/reviewers',
      'Manage feedback',
      'View project status'
    ],
    permissions: [
      'Can add or remove reviewers',
      'Can mark feedback as resolved',
      'Can delete or archive projects'
    ]
  },
  REVIEWER: {
    title: 'Reviewer (Client/Stakeholder)',
    responsibilities: [
      'View uploaded files',
      'Provide comments and feedback',
      'Approve or reject the project'
    ],
    permissions: [
      'Can comment directly on files',
      'Can approve or reject the file/project',
      'Cannot delete or edit the project'
    ]
  }
};

export const createProject = async (projectData, ownerEmail) => {
  try {
    const username = getUsernameFromEmail(ownerEmail);
    const projectId = generateProjectId(username, projectData.name);
    const projectRef = doc(db, 'projects', projectId);
    const timestamp = new Date();

    const projectInfo = {
      ...projectData,
      id: projectId,
      owner: ownerEmail,
      ownerUsername: username,
      collaborators: [ownerEmail],
      createdAt: timestamp,
      updatedAt: timestamp,
      files: [],
      comments: [],
      status: 'active'
    };

    // Create project document
    await setDoc(projectRef, projectInfo);

    // Add project to user's projects
    const userRef = doc(db, 'users', username);
    await updateDoc(userRef, {
      [`projects.${projectId}`]: {
        name: projectData.name,
        createdAt: timestamp,
        role: 'owner'
      }
    });

    return projectInfo;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

export const uploadProjectFile = async (projectId, file, type, userEmail) => {
  try {
    // Validate file type
    if (!validateFileType(file, type)) {
      throw new Error(`Invalid file type for ${type}`);
    }

    // Upload file to storage
    const timestamp = Date.now();
    const fileName = `projects/${projectId}/${timestamp}_${file.name}`;
    const fileRef = ref(storage, fileName);
    
    const snapshot = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Update project document
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      files: arrayUnion({
        name: file.name,
        type: type,
        url: downloadURL,
        path: fileName,
        uploadedBy: userEmail,
        uploadedAt: new Date(),
        version: 1
      }),
      updatedAt: new Date()
    });

    return {
      url: downloadURL,
      path: fileName
    };
  } catch (error) {
    console.error('Error uploading project file:', error);
    throw error;
  }
};

export const getProjectById = async (projectId) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      throw new Error('Project not found');
    }

    return {
      id: projectSnap.id,
      ...projectSnap.data()
    };
  } catch (error) {
    console.error('Error getting project:', error);
    throw error;
  }
};

export const getUserProjects = async (userEmail) => {
  try {
    const projectsRef = collection(db, 'projects');
    const q = query(
      projectsRef, 
      where('collaborators', 'array-contains', userEmail)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting user projects:', error);
    throw error;
  }
};

export const updateProject = async (projectId, data) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      ...data,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

export const deleteProject = async (projectId, ownerEmail) => {
  try {
    console.log('Starting project deletion:', { projectId, ownerEmail });
    
    // Get project data first
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      throw new Error('Project not found');
    }
    
    const project = projectSnap.data();
    console.log('Project data:', project);

    // Verify owner
    if (project.owner !== ownerEmail) {
      throw new Error('Unauthorized to delete project');
    }

    // Get owner's UID from auth
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', ownerEmail));
    const userSnap = await getDocs(q);
    
    if (userSnap.empty) {
      throw new Error('User not found');
    }

    const ownerDoc = userSnap.docs[0];
    const ownerUid = ownerDoc.id;

    // Delete all project files from storage
    if (project.files && project.files.length > 0) {
      console.log('Deleting files:', project.files);
      for (const file of project.files) {
        if (file.url) {
          try {
            // Extract public ID from Cloudinary URL
            const urlParts = file.url.split('/');
            const publicId = urlParts[urlParts.length - 1].split('.')[0];
            
            // Delete from Cloudinary
            const response = await fetch('https://api.cloudinary.com/v1_1/dysa2jeyb/delete_by_token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                public_id: publicId,
                api_key: import.meta.env.VITE_CLOUDINARY_API_KEY
              })
            });
            
            if (!response.ok) {
              console.error('Failed to delete file from Cloudinary:', file.url);
            }
          } catch (error) {
            console.error('Error deleting file:', file.url, error);
          }
        }
      }
    }

    // Delete from owner's projects subcollection
    console.log('Deleting from owner projects:', ownerUid, projectId);
    const ownerProjectRef = doc(db, 'users', ownerUid, 'projects', projectId);
    await deleteDoc(ownerProjectRef);

    // Delete from collaborators' projects subcollections
    if (project.collaborators && project.collaborators.length > 0) {
      console.log('Removing from collaborators:', project.collaborators);
      for (const collaboratorEmail of project.collaborators) {
        if (collaboratorEmail === ownerEmail) continue; // Skip owner

        try {
          // Get collaborator's UID
          const collabQuery = query(usersRef, where('email', '==', collaboratorEmail));
          const collabSnap = await getDocs(collabQuery);
          
          if (!collabSnap.empty) {
            const collabDoc = collabSnap.docs[0];
            const collabUid = collabDoc.id;
            
            // Delete from collaborator's projects
            const collabProjectRef = doc(db, 'users', collabUid, 'projects', projectId);
            await deleteDoc(collabProjectRef);
          }
        } catch (error) {
          console.error(`Error removing project from collaborator ${collaboratorEmail}:`, error);
        }
      }
    }

    // Delete the main project document
    console.log('Deleting main project document');
    await deleteDoc(projectRef);
    
    toast.success('Project deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    toast.error(error.message || 'Failed to delete project');
    throw error;
  }
};
