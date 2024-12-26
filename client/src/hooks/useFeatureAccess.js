import { useSubscription } from './useSubscription';

export const useFeatureAccess = () => {
    const { subscription } = useSubscription();

    // Temporarily allow all features
    const hasFeatureAccess = () => true;

    const getSubscriptionBadge = () => {
        if (!subscription) return null;

        const now = new Date();
        const trialEndDate = subscription.trialEndDate?.toDate();
        const nextPaymentDate = subscription.nextPaymentDate?.toDate();

        if (subscription.status === 'TRIAL' && trialEndDate > now) {
            return {
                text: 'Trial',
                color: 'text-yellow-500 bg-yellow-100'
            };
        }

        if (subscription.status === 'ACTIVE' && nextPaymentDate > now) {
            return {
                text: 'Pro',
                color: 'text-blue-500 bg-blue-100'
            };
        }

        return null;
    };

    return {
        hasFeatureAccess,
        getSubscriptionBadge
    };
}; 