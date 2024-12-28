import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { v4 as uuidv4 } from 'uuid';

export const validateInvite = async (projectId, inviteId) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }

    const data = projectDoc.data();
    const invites = data.invites || [];

    if (!invites.includes(inviteId)) {
      throw new Error('Invalid or expired invite link');
    }

    return {
      projectId,
      inviteId,
      role: 'viewer' // Default role
    };
  } catch (error) {
    console.error('Validate invite error:', error);
    throw error;
  }
};

export const createProjectInvite = async (projectId, creatorEmail) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }

    // Generate a unique invite ID
    const inviteId = uuidv4();

    // Update project with new invite
    await updateDoc(projectRef, {
      invites: arrayUnion(inviteId),
      [`lastActivity.${creatorEmail.replace(/\./g, '_')}`]: serverTimestamp()
    });

    // Return the invite details
    return {
      inviteId,
      inviteLink: `${window.location.origin}/invite/${projectId}/${inviteId}`
    };
  } catch (error) {
    console.error('Create invite error:', error);
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

    const data = projectDoc.data();

    // Check if user is already a member
    const members = data.members || [];
    if (members.some(member => member.email === userEmail)) {
      return { redirect: `/project/${projectId}` };
    }

    // Add user to project members
    const memberData = {
      email: userEmail,
      role: 'viewer',
      addedAt: new Date().toISOString(),
      status: 'active'
    };

    // Update project document
    await updateDoc(projectRef, {
      members: arrayUnion(memberData),
      invites: data.invites.filter(id => id !== inviteId),
      [`lastActivity.${userEmail.replace(/\./g, '_')}`]: serverTimestamp()
    });

    return { redirect: `/project/${projectId}` };
  } catch (error) {
    console.error('Accept invite error:', error);
    throw error;
  }
}; 