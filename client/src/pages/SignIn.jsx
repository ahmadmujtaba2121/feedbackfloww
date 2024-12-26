import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc, updateDoc, arrayUnion, setDoc, serverTimestamp } from 'firebase/firestore';
import { FcGoogle } from 'react-icons/fc';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  // Get projectId from URL if it's an invite link
  const searchParams = new URLSearchParams(location.search);
  const inviteProjectId = searchParams.get('projectId');

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Create or update user document
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastSignIn: serverTimestamp(),
      }, { merge: true });

      // If this is an invite link, validate and handle it
      if (inviteProjectId) {
        try {
          const inviteRef = doc(db, 'invites', inviteProjectId);
          const inviteDoc = await getDoc(inviteRef);

          if (!inviteDoc.exists()) {
            toast.error('Invalid invite link');
            navigate('/dashboard');
            return;
          }

          const inviteData = inviteDoc.data();
          const now = new Date();
          const expiresAt = inviteData.expiresAt.toDate();

          if (now > expiresAt) {
            toast.error('This invite link has expired');
            navigate('/dashboard');
            return;
          }

          if (inviteData.status !== 'active') {
            toast.error('This invite link is no longer active');
            navigate('/dashboard');
            return;
          }

          const projectRef = doc(db, 'projects', inviteData.projectId);
          const projectDoc = await getDoc(projectRef);

          if (!projectDoc.exists()) {
            toast.error('Project not found');
            navigate('/dashboard');
            return;
          }

          // Add user based on invite type
          if (inviteData.type === 'team') {
            // Add as team member
            await updateDoc(projectRef, {
              [`editors.${user.email}`]: {
                role: 'editor',
                joinedAt: serverTimestamp(),
                inviteId: inviteProjectId
              },
              activityLog: arrayUnion({
                type: 'member_joined',
                user: user.email,
                role: 'editor',
                timestamp: new Date().toISOString()
              })
            });

            // Update invite document
            await updateDoc(inviteRef, {
              usedBy: arrayUnion(user.email)
            });

            toast.success('Successfully joined the project team!');
          } else {
            // Add as viewer
            await updateDoc(projectRef, {
              [`viewers.${user.email}`]: {
                role: 'viewer',
                joinedAt: serverTimestamp(),
                inviteId: inviteProjectId
              }
            });

            // Update invite document
            await updateDoc(inviteRef, {
              usedBy: arrayUnion(user.email)
            });

            toast.success('Successfully gained view access to the project!');
          }

          navigate(`/project/${inviteData.projectId}`);
        } catch (error) {
          console.error('Error handling invite:', error);
          toast.error('Failed to process invite');
          navigate('/dashboard');
        }
      } else {
        toast.success('Signed in successfully');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      toast.error(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">
            <span className="text-primary">Feedback</span>
            <span className="text-secondary-foreground">Flow</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            {inviteProjectId
              ? "Sign in to join the project"
              : "Sign in to continue"}
          </p>
        </div>

        <div className="bg-foreground/95 backdrop-blur-lg rounded-lg shadow-xl p-8 border border-border">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center px-4 py-3 rounded-lg shadow-sm bg-muted text-secondary-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform hover:scale-105"
          >
            <FcGoogle className="h-6 w-6" />
            <span className="ml-3 text-lg">Continue with Google</span>
          </button>

          {inviteProjectId && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              You'll be added to the project after signing in
            </p>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
