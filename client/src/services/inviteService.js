import { collection, doc, setDoc, serverTimestamp, getDoc, updateDoc, arrayUnion, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { v4 as uuidv4 } from 'uuid';

export const createProjectInvite = async (projectId, creatorEmail, type = 'view') => {
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

    // Store the full invite object in the invites array
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

    console.log('Created invite:', { projectId, inviteId: invite.id }); // Debug log

    return {
      inviteId: invite.id,
      inviteLink
    };
  } catch (error) {
    console.error('Error creating invite:', error);
    throw error;
  }
};

export const validateInvite = async (inviteId, projectId) => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  const tryFetchProject = async (attempt = 1) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);

      console.log('Project fetch attempt', attempt, 'result:', {
        exists: projectDoc.exists(),
        id: projectDoc.id,
        path: projectRef.path
      });

      return projectDoc;
    } catch (error) {
      console.error(`Fetch attempt ${attempt} failed:`, error);
      if (attempt < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return tryFetchProject(attempt + 1);
      }
      throw error;
    }
  };

  try {
    console.log('Starting invite validation:', { projectId, inviteId });

    // Check if Firestore is initialized
    if (!db) {
      console.error('Firestore not initialized');
      throw new Error('Database connection error');
    }

    // Try to fetch the project with retries
    const projectDoc = await tryFetchProject();

    if (!projectDoc.exists()) {
      console.log('Project not found by ID:', projectId);
      throw new Error('Project not found');
    }

    const projectData = projectDoc.data();
    if (!projectData) {
      console.error('Project data is null');
      throw new Error('Invalid project data');
    }

    console.log('Project data retrieved:', {
      id: projectDoc.id,
      invitesCount: projectData.invites?.length || 0,
      hasInvites: !!projectData.invites
    });

    // Find the invite
    const invites = projectData.invites || [];
    console.log(`Searching for invite ${inviteId} in ${invites.length} invites`);

    const invite = invites.find(link => link.id === inviteId);
    if (!invite) {
      console.log('Available invites:', invites.map(i => ({ id: i.id, role: i.role })));
      throw new Error('Invite not found');
    }

    console.log('Found invite:', {
      id: invite.id,
      projectId: invite.projectId,
      role: invite.role,
      status: invite.status,
      createdAt: invite.createdAt
    });

    // Validate invite
    const now = new Date();
    const expiresAt = new Date(invite.expiresAt);

    if (now > expiresAt) {
      throw new Error('Invite has expired');
    }

    if (invite.status !== 'active') {
      throw new Error('Invite is no longer active');
    }

    // Return validation result
    const result = {
      isValid: true,
      type: invite.role === 'editor' ? 'team' : 'view',
      projectId: projectDoc.id
    };

    console.log('Validation successful:', result);
    return result;

  } catch (error) {
    console.error('Validation error details:', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      projectId,
      inviteId
    });
    throw error;
  }
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