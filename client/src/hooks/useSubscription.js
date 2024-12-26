import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export function useSubscription() {
    const { currentUser } = useAuth();
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchSubscription = () => {
        if (!currentUser) {
            setSubscription(null);
            setLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(
            doc(db, 'subscriptions', currentUser.uid),
            (doc) => {
                if (doc.exists()) {
                    setSubscription({
                        ...doc.data(),
                        // Convert Firestore Timestamps to Dates
                        startDate: doc.data().startDate?.toDate(),
                        updatedAt: doc.data().updatedAt?.toDate(),
                        cancelDate: doc.data().cancelDate?.toDate(),
                        lastPaymentDate: doc.data().lastPaymentDate?.toDate(),
                        nextPaymentDate: doc.data().lastPaymentDate ?
                            new Date(doc.data().lastPaymentDate.toDate().getTime() + 30 * 24 * 60 * 60 * 1000) :
                            null
                    });
                } else {
                    setSubscription(null);
                }
                setLoading(false);
            },
            (error) => {
                console.error('Error fetching subscription:', error);
                setLoading(false);
            }
        );

        return unsubscribe;
    };

    useEffect(() => {
        const unsubscribe = fetchSubscription();
        return () => unsubscribe?.();
    }, [currentUser]);

    return {
        subscription,
        loading,
        refetchSubscription: fetchSubscription
    };
}

export default useSubscription; 