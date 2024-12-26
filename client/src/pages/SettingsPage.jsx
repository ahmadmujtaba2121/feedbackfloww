import { useState, useRef, useEffect } from 'react';
import { auth, db } from '../firebase/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { FiCamera } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Cloudinary configuration
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';
const CLOUDINARY_CLOUD_NAME = 'dxgl4eyhq';

// Helper function to get username from email
const getUsernameFromEmail = (email) => {
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const fileInputRef = useRef(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [settings, setSettings] = useState({
    displayName: '',
    email: '',
    photoURL: '',
    notifications: {
      email: true,
      desktop: true
    }
  });

  // Fetch user settings from Firestore
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!auth.currentUser) {
        navigate('/signin');
        return;
      }
      
      try {
        const username = getUsernameFromEmail(auth.currentUser.email);
        const userDoc = await getDoc(doc(db, 'users', username));
        
        // Initialize user document if it doesn't exist
        if (!userDoc.exists()) {
          const initialUserData = {
            displayName: auth.currentUser.displayName || '',
            email: auth.currentUser.email || '',
            photoURL: auth.currentUser.photoURL || '',
            notifications: {
              email: true,
              desktop: true
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          await setDoc(doc(db, 'users', username), initialUserData);
          setSettings(initialUserData);
        } else {
          const userData = userDoc.data();
          setSettings(prev => ({
            ...prev,
            ...userData,
            displayName: auth.currentUser?.displayName || userData.displayName || '',
            photoURL: auth.currentUser?.photoURL || userData.photoURL || '',
            email: auth.currentUser?.email || userData.email || ''
          }));
        }
      } catch (error) {
        console.error('Error fetching user settings:', error);
        toast.error('Failed to load user settings');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUserSettings();
  }, [navigate]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary error:', errorData);
        throw new Error(errorData.error?.message || 'Failed to upload image');
      }

      const data = await response.json();
      console.log('Cloudinary response:', data);
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image to Cloudinary: ' + error.message);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: 'Image size should be less than 5MB', type: 'error' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage({ text: 'Please upload an image file', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      setMessage({ text: 'Uploading image...', type: 'info' });
      
      const photoURL = await uploadToCloudinary(file);
      await updateProfile(auth.currentUser, { photoURL });
      
      const username = getUsernameFromEmail(auth.currentUser.email);
      const userRef = doc(db, 'users', username);
      await updateDoc(userRef, {
        photoURL,
        updatedAt: new Date().toISOString()
      });

      setSettings(prev => ({ ...prev, photoURL }));
      setMessage({ text: 'Profile picture updated successfully!', type: 'success' });
    } catch (error) {
      console.error('Error updating profile picture:', error);
      setMessage({ text: error.message || 'Failed to update profile picture', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!settings.displayName.trim()) {
      setMessage({ text: 'Display name cannot be empty', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      setMessage({ text: 'Updating profile...', type: 'info' });
      
      await updateProfile(auth.currentUser, {
        displayName: settings.displayName
      });
      
      const username = getUsernameFromEmail(auth.currentUser.email);
      const userRef = doc(db, 'users', username);
      await updateDoc(userRef, {
        displayName: settings.displayName,
        notifications: settings.notifications,
        updatedAt: new Date().toISOString()
      });

      setMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ text: error.message || 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="pt-24 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

          {initialLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
            </div>
          ) : (
            <>
              {message.text && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg mb-6 ${
                    message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {message.text}
                </motion.div>
              )}

              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 mb-8">
                <h2 className="text-xl font-semibold text-white mb-6">Profile Settings</h2>
                
                {/* Profile Picture */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div 
                      onClick={handleImageClick}
                      className="w-24 h-24 rounded-full overflow-hidden cursor-pointer group relative"
                    >
                      {settings.photoURL ? (
                        <img 
                          src={settings.photoURL} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-violet-500/20 flex items-center justify-center">
                          <span className="text-2xl text-violet-500">
                            {settings.displayName?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <FiCamera className="text-white text-xl" />
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={settings.displayName}
                      onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={settings.email}
                      disabled
                      className="w-full px-4 py-3 bg-slate-900 text-slate-500 rounded-lg border border-slate-700 cursor-not-allowed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </button>
                </form>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 mb-8">
                <h2 className="text-xl font-semibold text-white mb-6">Notifications</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300">Email Notifications</label>
                    <button
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          email: !prev.notifications.email
                        }
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.notifications.email ? 'bg-violet-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.notifications.email ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300">Desktop Notifications</label>
                    <button
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          desktop: !prev.notifications.desktop
                        }
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.notifications.desktop ? 'bg-violet-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.notifications.desktop ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
