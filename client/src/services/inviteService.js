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
  try {
    // Get the specific project document
    const projectDoc = await getDoc(doc(db, 'projects', projectId));

    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }

    const projectData = projectDoc.data();
    const invite = (projectData.invites || []).find(link => link.id === inviteId);

    if (!invite) {
      throw new Error('Invite not found');
    }

    const now = new Date();
    const expiresAt = new Date(invite.expiresAt);

    if (now > expiresAt) {
      throw new Error('Invite has expired');
    }

    if (invite.status !== 'active') {
      throw new Error('Invite is no longer active');
    }

    return {
      isValid: true,
      type: invite.role === 'editor' ? 'team' : 'view',
      projectId: projectDoc.id
    };
  } catch (error) {
    console.error('Error validating invite:', error);
    throw error;
  }
};

export const acceptInvite = async (projectId, inviteId, userEmail) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }

    const projectData = projectDoc.data();

    // Find the invite in the invites array
    const invite = (projectData.invites || []).find(link => link.id === inviteId);

    if (!invite) {
      throw new Error('Invite not found');
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

    // Remove old invite and add updated one
    const newInvites = (projectData.invites || []).filter(link => link.id !== inviteId);
    newInvites.push(updatedInvite);

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

    return {
      redirect: `/project/${projectId}`,
      type: invite.role === 'editor' ? 'team' : 'view'
    };
  } catch (error) {
    console.error('Error accepting invite:', error);
    throw error;
  }
}; 