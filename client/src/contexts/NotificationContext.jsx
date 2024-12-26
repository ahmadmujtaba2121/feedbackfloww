import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) return;

        const notificationsRef = collection(db, 'notifications');
        const q = query(
            notificationsRef,
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newNotifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setNotifications(newNotifications);

            // Show toast for new notifications
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added' && change.doc.data().createdAt) {
                    const notification = change.doc.data();
                    if (notification.recipientId === currentUser.email) {
                        toast(notification.message, {
                            icon: '🔔',
                            duration: 5000
                        });
                    }
                }
            });
        });

        return () => unsubscribe();
    }, [currentUser]);

    const createNotification = async ({ recipientId, message, type, projectId, taskId }) => {
        try {
            await addDoc(collection(db, 'notifications'), {
                recipientId,
                message,
                type,
                projectId,
                taskId,
                createdAt: serverTimestamp(),
                read: false,
                createdBy: currentUser?.email
            });
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    };

    const value = {
        notifications,
        createNotification
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext; 