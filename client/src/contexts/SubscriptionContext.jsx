import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getSubscription } from '../services/paypalService';

const SubscriptionContext = createContext();

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};

export const SubscriptionProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSubscription = async () => {
            if (!currentUser) {
                setSubscription(null);
                setLoading(false);
                return;
            }

            try {
                const userSubscription = await getSubscription(currentUser.uid);
                setSubscription(userSubscription);
            } catch (err) {
                setError(err.message);
                console.error('Error fetching subscription:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSubscription();
    }, [currentUser]);

    const hasFeature = (featureName) => {
        if (!subscription || subscription.status !== 'ACTIVE') {
            return false;
        }
        return subscription.features?.[featureName] || false;
    };

    const isSubscriptionActive = () => {
        return subscription?.status === 'ACTIVE';
    };

    const isInTrialPeriod = () => {
        if (!subscription || !subscription.trialEndDate) {
            return false;
        }
        const trialEnd = new Date(subscription.trialEndDate);
        return trialEnd > new Date();
    };

    const value = {
        subscription,
        loading,
        error,
        hasFeature,
        isSubscriptionActive,
        isInTrialPeriod,
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export default SubscriptionContext;
