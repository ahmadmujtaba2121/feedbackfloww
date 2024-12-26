import React from 'react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { FiLock } from 'react-icons/fi';

export const PremiumBadge = () => {
    const { getSubscriptionBadge, loading } = useFeatureAccess();

    if (loading) return null;

    const badge = getSubscriptionBadge();
    if (!badge) return null;

    return (
        <div className={`flex items-center space-x-1 ${badge.color}`}>
            <span className="text-sm font-medium">{badge.text}</span>
        </div>
    );
};

export const PremiumFeature = ({ feature, children }) => {
    const { hasFeatureAccess } = useFeatureAccess();

    if (hasFeatureAccess(feature)) {
        return children;
    }

    return (
        <div className="relative">
            <div className="opacity-50 pointer-events-none">
                {children}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                <div className="text-center p-4">
                    <FiLock className="w-6 h-6 text-violet-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-300">
                        This is a premium feature. Upgrade to Pro to unlock.
                    </p>
                </div>
            </div>
        </div>
    );
};

export const TeamMemberLimit = ({ currentCount }) => {
    const { getMaxTeamMembers, isProPlan, loading } = useFeatureAccess();

    if (loading) {
        return (
            <div className="text-sm text-slate-400 animate-pulse">
                Loading team limits...
            </div>
        );
    }

    const maxMembers = getMaxTeamMembers();

    return (
        <div className="text-sm text-slate-400">
            {currentCount}/{maxMembers} team members
            {currentCount >= maxMembers && !isProPlan && (
                <div className="mt-1 text-yellow-500">
                    <a href="/pricing" className="hover:text-yellow-400">
                        Upgrade to Pro for more team members
                    </a>
                </div>
            )}
        </div>
    );
}; 