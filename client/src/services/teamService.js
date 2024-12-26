import { db } from '../firebase/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer'
};

export const teamService = {
  // Add team member
  async addTeamMember(projectId, memberEmail, role = ROLES.MEMBER) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const memberData = {
        email: memberEmail,
        role,
        addedAt: new Date().toISOString(),
        status: 'pending'
      };

      await updateDoc(projectRef, {
        members: arrayUnion(memberData),
        lastModified: serverTimestamp()
      });

      // Create notification for the new member
      const notificationRef = doc(db, 'notifications', memberEmail);
      await setDoc(notificationRef, {
        notifications: arrayUnion({
          type: 'team_invite',
          projectId,
          projectName: projectDoc.data().name,
          role,
          timestamp: new Date().toISOString(),
          read: false
        })
      }, { merge: true });

      return memberData;
    } catch (error) {
      console.error('Error adding team member:', error);
      throw error;
    }
  },

  // Remove team member
  async removeTeamMember(projectId, memberEmail) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const members = projectDoc.data().members || [];
      const memberToRemove = members.find(m => m.email === memberEmail);

      if (!memberToRemove) {
        throw new Error('Member not found');
      }

      await updateDoc(projectRef, {
        members: arrayRemove(memberToRemove),
        lastModified: serverTimestamp()
      });

      // Notify the removed member
      const notificationRef = doc(db, 'notifications', memberEmail);
      await setDoc(notificationRef, {
        notifications: arrayUnion({
          type: 'team_removal',
          projectId,
          projectName: projectDoc.data().name,
          timestamp: new Date().toISOString(),
          read: false
        })
      }, { merge: true });

    } catch (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
  },

  // Update member role
  async updateMemberRole(projectId, memberEmail, newRole) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const members = projectDoc.data().members || [];
      const updatedMembers = members.map(member => {
        if (member.email === memberEmail) {
          return {
            ...member,
            role: newRole,
            lastModified: new Date().toISOString()
          };
        }
        return member;
      });

      await updateDoc(projectRef, {
        members: updatedMembers,
        lastModified: serverTimestamp()
      });

      // Notify the member of role change
      const notificationRef = doc(db, 'notifications', memberEmail);
      await setDoc(notificationRef, {
        notifications: arrayUnion({
          type: 'role_change',
          projectId,
          projectName: projectDoc.data().name,
          newRole,
          timestamp: new Date().toISOString(),
          read: false
        })
      }, { merge: true });

    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  },

  // Get team members
  async getTeamMembers(projectId) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      return projectDoc.data().members || [];
    } catch (error) {
      console.error('Error getting team members:', error);
      throw error;
    }
  },

  // Check member permissions
  async checkPermission(projectId, userEmail, requiredRole) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        return false;
      }

      const members = projectDoc.data().members || [];
      const member = members.find(m => m.email === userEmail);

      if (!member) {
        return false;
      }

      const roleHierarchy = {
        [ROLES.OWNER]: 4,
        [ROLES.ADMIN]: 3,
        [ROLES.MEMBER]: 2,
        [ROLES.VIEWER]: 1
      };

      return roleHierarchy[member.role] >= roleHierarchy[requiredRole];
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  },

  // Get member activity
  async getMemberActivity(projectId, memberEmail) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const activityRef = doc(db, 'activity', `${projectId}_${memberEmail}`);
      
      const [projectDoc, activityDoc] = await Promise.all([
        getDoc(projectRef),
        getDoc(activityRef)
      ]);

      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      return activityDoc.exists() ? activityDoc.data().activities || [] : [];
    } catch (error) {
      console.error('Error getting member activity:', error);
      throw error;
    }
  },

  // Track member activity
  async trackActivity(projectId, memberEmail, activity) {
    try {
      const activityRef = doc(db, 'activity', `${projectId}_${memberEmail}`);
      
      await setDoc(activityRef, {
        activities: arrayUnion({
          ...activity,
          timestamp: new Date().toISOString()
        })
      }, { merge: true });

    } catch (error) {
      console.error('Error tracking activity:', error);
      // Don't throw error for activity tracking
      console.warn('Activity tracking failed:', error.message);
    }
  }
}; 