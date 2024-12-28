import { collection, doc, setDoc, serverTimestamp, getDoc, updateDoc, arrayUnion, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { v4 as uuidv4 } from 'uuid';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryOperation = async (operation, retries = MAX_RETRIES, delay = RETRY_DELAY) => {
  let lastError;

  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (i < retries - 1) {
        await wait(delay * (i + 1));
      }
    }
  }

  throw lastError;
};

export const validateInvite = async (inviteId, projectId) => {
  if (!inviteId || !projectId) {
    throw new Error('Invalid invite parameters');
  }

  return retryOperation(async () => {
    try {
      if (!db) {
        throw new Error('Database connection error');
      }

      // Direct query for the specific project
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);

      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const projectData = projectDoc.data();

      if (!projectData) {
        throw new Error('Project data is corrupted');
      }

      const invites = projectData.invites || [];
      const invite = invites.find(inv => inv.id === inviteId);

      if (!invite) {
        throw new Error('Invite not found');
      }

      if (invite.used) {
        throw new Error('Invite has already been used');
      }

      const currentTime = new Date();
      const expiryTime = new Date(invite.expiresAt);

      if (currentTime > expiryTime) {
        throw new Error('Invite has expired');
      }

      if (invite.status !== 'active') {
        throw new Error('Invite is no longer active');
      }

      return {
        projectData: {
          id: projectDoc.id,
          name: projectData.name,
          ownerId: projectData.ownerId,
          ...projectData
        },
        inviteData: invite
      };
    } catch (error) {
      console.error('Error validating invite:', error);

      // Rethrow specific errors that shouldn't be retried
      if (
        error.message.includes('not found') ||
        error.message.includes('expired') ||
        error.message.includes('already been used') ||
        error.message.includes('no longer active')
      ) {
        throw error;
      }

      // For other errors, allow retry
      throw new Error('Database connection error');
    }
  });
};

export const createProjectInvite = async (projectId, creatorEmail, type = 'view') => {
  return retryOperation(async () => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);

      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const invite = {
        id: uuidv4(),
        projectId,
        creatorEmail,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        used: false,
        status: 'active',
        role: type === 'view' ? 'viewer' : 'editor'
      };

      await updateDoc(projectRef, {
        invites: arrayUnion(invite),
        activityLog: arrayUnion({
          type: 'invite_created',
          user: creatorEmail,
          inviteType: invite.role,
          timestamp: new Date().toISOString()
        })
      });

      const inviteLink = `${window.location.origin}/invite/${projectId}/${invite.id}`;
      return { inviteId: invite.id, inviteLink };
    } catch (error) {
      console.error('Error creating invite:', error);
      throw error;
    }
  });
};

export const acceptInvite = async (projectId, inviteId, userEmail) => {
  try {
    console.log('Accepting invite:', { projectId, inviteId, userEmail }); // Debug log

    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }

    const projectData = projectDoc.data();
    console.log('Found project:', projectId); // Debug log

    // Find the invite in the invites array
    const invite = (projectData.invites || []).find(link => link.id === inviteId);

    if (!invite) {
      throw new Error('Invite not found');
    }

    console.log('Found invite:', invite); // Debug log

    // Verify that the invite belongs to this project
    if (invite.projectId !== projectId) {
      throw new Error('Invalid project ID');
    }

    // Check if invite is expired
    const now = new Date();
    const expiresAt = new Date(invite.expiresAt);
    if (now > expiresAt) {
      throw new Error('Invite has expired');
    }

    // Check if invite is still active
    if (invite.status !== 'active') {
      throw new Error('Invite is no longer active');
    }

    // Check if invite has already been used
    if (invite.used) {
      throw new Error('This invite has already been used');
    }

    // Update invite to mark it as used
    const updatedInvite = {
      ...invite,
      used: true,
      usedBy: userEmail,
      lastUsedAt: new Date().toISOString()
    };

    // Get current invites array
    const currentInvites = projectData.invites || [];
    // Remove the old invite and add the updated one
    const newInvites = [
      ...currentInvites.filter(i => i.id !== inviteId),
      updatedInvite
    ];

    // Add user based on invite role
    if (invite.role === 'editor') {
      await updateDoc(projectRef, {
        invites: newInvites,
        [`editors.${userEmail}`]: {
          role: 'editor',
          joinedAt: serverTimestamp(),
          inviteId: inviteId
        },
        activityLog: arrayUnion({
          type: 'member_joined',
          user: userEmail,
          role: 'editor',
          timestamp: new Date().toISOString()
        })
      });
    } else {
      await updateDoc(projectRef, {
        invites: newInvites,
        [`viewers.${userEmail}`]: {
          role: 'viewer',
          joinedAt: serverTimestamp(),
          inviteId: inviteId
        },
        activityLog: arrayUnion({
          type: 'viewer_joined',
          user: userEmail,
          role: 'viewer',
          timestamp: new Date().toISOString()
        })
      });
    }

    console.log('Successfully accepted invite'); // Debug log

    return {
      redirect: `/project/${projectId}`,
      type: invite.role === 'editor' ? 'team' : 'view'
    };
  } catch (error) {
    console.error('Error accepting invite:', error);
    throw error;
  }
}; 