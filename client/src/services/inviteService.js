import { collection, doc, setDoc, serverTimestamp, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export const createProjectInvite = async (projectId, creatorEmail, type = 'view') => {
  try {
    const inviteRef = doc(collection(db, 'invites'));
    const inviteId = inviteRef.id;

    await setDoc(inviteRef, {
      projectId,
      creatorEmail,
      type,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'active',
      usedBy: []
    });

    const inviteLink = `${window.location.origin}/invite/${projectId}/${inviteId}`;

    return {
      inviteId,
      inviteLink
    };
  } catch (error) {
    console.error('Error creating invite:', error);
    throw error;
  }
};

export const validateInvite = async (inviteId) => {
  try {
    const inviteRef = doc(db, 'invites', inviteId);
    const inviteDoc = await getDoc(inviteRef);

    if (!inviteDoc.exists()) {
      throw new Error('Invite not found');
    }

    const inviteData = inviteDoc.data();
    const now = new Date();
    const expiresAt = inviteData.expiresAt.toDate();

    if (now > expiresAt) {
      throw new Error('Invite has expired');
    }

    if (inviteData.status !== 'active') {
      throw new Error('Invite is no longer active');
    }

    return {
      isValid: true,
      type: inviteData.type,
      projectId: inviteData.projectId
    };
  } catch (error) {
    console.error('Error validating invite:', error);
    throw error;
  }
};

export const acceptInvite = async (projectId, inviteId, userEmail) => {
  try {
    const inviteRef = doc(db, 'invites', inviteId);
    const inviteDoc = await getDoc(inviteRef);

    if (!inviteDoc.exists()) {
      throw new Error('Invite not found');
    }

    const inviteData = inviteDoc.data();

    // Check if invite is expired
    const now = new Date();
    const expiresAt = inviteData.expiresAt.toDate();
    if (now > expiresAt) {
      throw new Error('Invite has expired');
    }

    // Check if invite is still active
    if (inviteData.status !== 'active') {
      throw new Error('Invite is no longer active');
    }

    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }

    // Update invite document to track usage
    await updateDoc(inviteRef, {
      usedBy: arrayUnion(userEmail),
      lastUsedAt: serverTimestamp()
    });

    // Add user based on invite type
    if (inviteData.type === 'team') {
      await updateDoc(projectRef, {
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
      type: inviteData.type
    };
  } catch (error) {
    console.error('Error accepting invite:', error);
    throw error;
  }
}; 