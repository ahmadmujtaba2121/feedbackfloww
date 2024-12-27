import { db } from '../firebase/firebase';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

interface Invite {
  id: string;
  projectId: string;
  creatorEmail: string;
  createdAt: string;
  inviteLink: string;
  used?: boolean;
  usedBy?: string;
  role: 'viewer' | 'editor';
}

export const createProjectInvite = async (
  projectId: string,
  creatorEmail: string,
  inviteType: 'view' | 'team'
): Promise<{ inviteLink: string }> => {
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
      used: false
    };

    // Add invite to the appropriate array based on type
    if (inviteType === 'view') {
      await updateDoc(projectRef, {
        viewerLinks: arrayUnion({
          ...invite,
          role: 'viewer'
        }),
        activityLog: arrayUnion({
          type: 'invite_created',
          user: creatorEmail,
          inviteType: 'viewer',
          timestamp: new Date().toISOString()
        })
      });
    } else {
      await updateDoc(projectRef, {
        editorLinks: arrayUnion({
          ...invite,
          role: 'editor'
        }),
        activityLog: arrayUnion({
          type: 'invite_created',
          user: creatorEmail,
          inviteType: 'editor',
          timestamp: new Date().toISOString()
        })
      });
    }

    const inviteLink = `${window.location.origin}/invite/${projectId}/${invite.id}`;
    return { inviteLink };
  } catch (error) {
    console.error('Error creating invite:', error);
    throw error;
  }
};

export const validateInvite = async (projectId: string, inviteId: string): Promise<Invite> => {
  const projectRef = doc(db, 'projects', projectId);
  const projectDoc = await getDoc(projectRef);

  if (!projectDoc.exists()) {
    throw new Error('Project not found');
  }

  const data = projectDoc.data();
  const viewerLinks = data.viewerLinks || [];
  const editorLinks = data.editorLinks || [];
  const invite = [...viewerLinks, ...editorLinks].find((invite: Invite) => invite.id === inviteId);

  if (!invite) {
    throw new Error('Invalid or expired invite link');
  }

  if (invite.used) {
    throw new Error('This invite link has already been used');
  }

  return invite;
};

export const acceptInvite = async (projectId: string, inviteId: string, userEmail: string): Promise<{ redirect: string }> => {
  const invite = await validateInvite(projectId, inviteId);
  const projectRef = doc(db, 'projects', projectId);
  const projectDoc = await getDoc(projectRef);

  if (!projectDoc.exists()) {
    throw new Error('Project not found');
  }

  const projectData = projectDoc.data();
  const isViewerInvite = projectData.viewerLinks?.some(link => link.id === inviteId) ?? false;

  // Update the invite to mark it as used
  const inviteArrayField = isViewerInvite ? 'viewerLinks' : 'editorLinks';
  const inviteLinks = [...(projectData[inviteArrayField] || [])];
  const inviteIndex = inviteLinks.findIndex(link => link.id === inviteId);

  if (inviteIndex !== -1) {
    inviteLinks[inviteIndex] = {
      ...inviteLinks[inviteIndex],
      used: true,
      usedBy: userEmail,
      usedAt: new Date().toISOString()
    };
  }

  // Add user to the appropriate role
  if (isViewerInvite) {
    await updateDoc(projectRef, {
      [`viewers.${userEmail.replace(/\./g, ',')}`]: {
        role: 'viewer',
        joinedAt: serverTimestamp(),
        email: userEmail
      },
      viewerLinks: inviteLinks,
      activityLog: arrayUnion({
        type: 'viewer_joined',
        user: userEmail,
        timestamp: new Date().toISOString()
      })
    });
  } else {
    await updateDoc(projectRef, {
      [`editors.${userEmail.replace(/\./g, ',')}`]: {
        role: 'editor',
        joinedAt: serverTimestamp(),
        email: userEmail
      },
      editorLinks: inviteLinks,
      activityLog: arrayUnion({
        type: 'editor_joined',
        user: userEmail,
        timestamp: new Date().toISOString()
      })
    });
  }

  return { redirect: `/project/${projectId}` };
};