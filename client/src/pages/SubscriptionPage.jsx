import React from 'react';
import SubscriptionPlan from '../components/subscription/SubscriptionPlan';

const SubscriptionPage = () => {
    return (
        <div className="min-h-screen bg-slate-900 pt-20 pb-12 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Upgrade to FeedbackFlow Pro
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Get access to premium features and take your design feedback to the next level
                    </p>
                </div>
                <SubscriptionPlan />
            </div>
        </div>
    );
};

export default SubscriptionPage;
