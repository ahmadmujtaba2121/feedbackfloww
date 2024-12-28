import { collection, doc, setDoc, serverTimestamp, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { v4 as uuidv4 } from 'uuid';

export const validateInvite = async (inviteId, projectId) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }

    const projectData = projectDoc.data();
    const invites = projectData.invites || [];
    const invite = invites.find(inv => inv.id === inviteId);

    if (!invite) {
      throw new Error('Invite not found');
    }

    if (invite.used) {
      throw new Error('This invite has already been used');
    }

    const now = new Date();
    const expiresAt = new Date(invite.expiresAt);
    if (now > expiresAt) {
      throw new Error('This invite has expired');
    }

    return {
      projectData: {
        id: projectDoc.id,
        ...projectData
      },
      inviteData: invite
    };
  } catch (error) {
    console.error('Error validating invite:', error);
    throw error;
  }
};

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
};

export const acceptInvite = async (projectId, inviteId, userEmail) => {
  try {
    // First validate the invite
    const { projectData, inviteData } = await validateInvite(inviteId, projectId);

    // Update invite to mark it as used
    const projectRef = doc(db, 'projects', projectId);

    // Get current invites array
    const currentInvites = projectData.invites || [];
    // Remove the old invite and add the updated one
    const newInvites = [
      ...currentInvites.filter(i => i.id !== inviteId),
      {
        ...inviteData,
        used: true,
        usedBy: userEmail,
        usedAt: new Date().toISOString()
      }
    ];

    // Update project with new invites array and add user based on role
    if (inviteData.role === 'editor') {
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
      redirect: inviteData.role === 'editor'
        ? `/project/${projectId}/canvas`
        : `/project/${projectId}`
    };
  } catch (error) {
    console.error('Error accepting invite:', error);
    throw error;
  }
}; 