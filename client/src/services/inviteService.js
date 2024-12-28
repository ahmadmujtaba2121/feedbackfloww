import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { v4 as uuidv4 } from 'uuid';

export const validateInvite = async (projectId, inviteId) => {
  if (!projectId || !inviteId) {
    throw new Error('Invalid invite parameters');
  }

  try {
    console.log('Validating invite:', { projectId, inviteId });
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }

    const data = projectDoc.data();
    console.log('Project data:', {
      hasInvites: !!data.invites,
      invitesCount: (data.invites || []).length
    });

    const invites = data.invites || [];
    if (!invites.includes(inviteId)) {
      throw new Error('Invalid or expired invite link');
    }

    return {
      projectId,
      inviteId,
      role: 'viewer'
    };
  } catch (error) {
    console.error('Validate invite error:', error);
    throw error;
  }
};

export const createProjectInvite = async (projectId, creatorEmail) => {
  if (!projectId || !creatorEmail) {
    throw new Error('Invalid parameters for creating invite');
  }

  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }

    const inviteId = uuidv4();
    console.log('Creating invite:', { projectId, inviteId, creatorEmail });

    await updateDoc(projectRef, {
      invites: arrayUnion(inviteId),
      [`lastActivity.${creatorEmail.replace(/\./g, '_')}`]: serverTimestamp()
    });

    const inviteLink = `${window.location.origin}/invite/${projectId}/${inviteId}`;
    console.log('Invite created:', { inviteId, inviteLink });

    return { inviteId, inviteLink };
  } catch (error) {
    console.error('Create invite error:', error);
    throw error;
  }
};

export const acceptInvite = async (projectId, inviteId, userEmail) => {
  if (!projectId || !inviteId || !userEmail) {
    throw new Error('Invalid parameters for accepting invite');
  }

  try {
    console.log('Accepting invite:', { projectId, inviteId, userEmail });
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }

    const data = projectDoc.data();
    console.log('Project data for accept:', {
      hasMembers: !!data.members,
      membersCount: (data.members || []).length,
      hasInvites: !!data.invites,
      invitesCount: (data.invites || []).length
    });

    // Check if user is already a member
    const members = data.members || [];
    if (members.some(member => member.email === userEmail)) {
      console.log('User is already a member');
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
    const updates = {
      members: arrayUnion(memberData),
      invites: data.invites.filter(id => id !== inviteId),
      [`lastActivity.${userEmail.replace(/\./g, '_')}`]: serverTimestamp()
    };

    console.log('Updating project with:', updates);
    await updateDoc(projectRef, updates);

    console.log('Invite accepted successfully');
    return { redirect: `/project/${projectId}` };
  } catch (error) {
    console.error('Accept invite error:', error);
    throw error;
  }
}; 