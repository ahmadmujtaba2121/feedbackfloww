import { db } from '../firebase/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

export const SUBSCRIPTION_STATUS = {
    ACTIVE: 'ACTIVE',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED',
    TRIAL: 'TRIAL'
};

export const initializePayPalScript = () => {
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID}&vault=true&intent=subscription`;
    script.dataset.sdkIntegrationSource = 'button-factory';
    script.async = true;
    document.body.appendChild(script);
    return script;
};

export const createSubscription = async (userId, subscriptionData) => {
    try {
        const subscriptionRef = doc(db, 'subscriptions', userId);

        // Convert dates to Firestore Timestamps
        const now = new Date();
        const trialEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days trial
        const nextPaymentDate = new Date(now.getTime() + 37 * 24 * 60 * 60 * 1000); // 7 days trial + 30 days

        // Store the subscription data
        await setDoc(subscriptionRef, {
            subscriptionId: subscriptionData.subscriptionId,
            planId: subscriptionData.planId,
            status: SUBSCRIPTION_STATUS.TRIAL,
            startDate: now,
            createdAt: now,
            updatedAt: now,
            trialEndDate: trialEndDate,
            nextPaymentDate: nextPaymentDate,
            features: {
                text_tool: true,
                review_panel: true,
                team_members_5: true,
                premium_support: true,
                priority_updates: true,
                export_data: true,
                advanced_filters: true,
                bulk_actions: true
            }
        });

        return true;
    } catch (error) {
        console.error('Error creating subscription:', error);
        throw error;
    }
};

export const getSubscription = async (userId) => {
    try {
        const subscriptionRef = doc(db, 'subscriptions', userId);
        const subscriptionDoc = await getDoc(subscriptionRef);

        if (!subscriptionDoc.exists()) {
            return null;
        }

        const data = subscriptionDoc.data();

        // Convert Firestore Timestamps to Dates
        return {
            ...data,
            startDate: data.startDate?.toDate(),
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            trialEndDate: data.trialEndDate?.toDate(),
            nextPaymentDate: data.nextPaymentDate?.toDate()
        };
    } catch (error) {
        console.error('Error fetching subscription:', error);
        return null;
    }
};

export const updateSubscription = async (userId, updateData) => {
    try {
        const subscriptionRef = doc(db, 'subscriptions', userId);
        await updateDoc(subscriptionRef, {
            ...updateData,
            updatedAt: new Date()
        });
        return true;
    } catch (error) {
        console.error('Error updating subscription:', error);
        throw error;
    }
};

export const cancelSubscription = async (userId) => {
    try {
        const subscriptionRef = doc(db, 'subscriptions', userId);
        await updateDoc(subscriptionRef, {
            status: SUBSCRIPTION_STATUS.CANCELLED,
            cancelledAt: new Date(),
            updatedAt: new Date()
        });
        return true;
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        throw error;
    }
};