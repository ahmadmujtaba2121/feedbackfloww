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

const validateInvite = async (projectId: string, inviteId: string): Promise<Invite> => {
  const projectRef = doc(db, 'projects', projectId);
  const projectDoc = await getDoc(projectRef);

  if (!projectDoc.exists()) {
    throw new Error('Project not found');
  }

  const data = projectDoc.data();
  const invite = (data.inviteLinks || []).find((invite: Invite) => invite.id === inviteId);

  if (!invite) {
    throw new Error('Invalid or expired invite link');
  }

  if (!invite.role) {
    invite.role = 'viewer';
  }

  return invite;
};

const acceptInvite = async (projectId: string, inviteId: string, userEmail: string): Promise<{ redirect: string }> => {
  const invite = await validateInvite(projectId, inviteId);
  const projectRef = doc(db, 'projects', projectId);
  const projectDoc = await getDoc(projectRef);

  if (!projectDoc.exists()) {
    throw new Error('Project not found');
  }

  const projectData = projectDoc.data();

  // Get current inviteLinks array
  const inviteLinks = [...(projectData.inviteLinks || [])];
  const inviteIndex = inviteLinks.findIndex(link => link.id === inviteId);

  if (inviteIndex !== -1) {
    // Update the specific invite in the array
    inviteLinks[inviteIndex] = {
      ...inviteLinks[inviteIndex],
      used: true,
      usedBy: userEmail,
      usedAt: new Date().toISOString()
    };
  }

  // Update the project document
  await updateDoc(projectRef, {
    [`activeUsers.${userEmail.replace(/\./g, ',')}`]: {
      displayName: userEmail.split('@')[0],
      lastActive: serverTimestamp(),
      email: userEmail,
      role: 'viewer'
    },
    inviteLinks: inviteLinks // Update the entire array
  });

  return { redirect: `/project/${projectId}/canvas` };
}; 