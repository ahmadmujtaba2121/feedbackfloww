import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { initializePayPalScript, createSubscription, getSubscription } from '../../services/paypalService';
import { FaCheck } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const SubscriptionPlan = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState(null);
    const [paypalLoaded, setPaypalLoaded] = useState(false);

    useEffect(() => {
        const loadPayPalScript = async () => {
            const script = initializePayPalScript();
            script.onload = () => {
                setPaypalLoaded(true);
                initializePayPalButton();
            };
        };

        const fetchSubscription = async () => {
            if (currentUser) {
                const userSubscription = await getSubscription(currentUser.uid);
                setSubscription(userSubscription);
            }
            setLoading(false);
        };

        loadPayPalScript();
        fetchSubscription();
    }, [currentUser]);

    const initializePayPalButton = () => {
        if (window.paypal) {
            window.paypal.Buttons({
                style: {
                    layout: 'vertical',
                    color: 'blue',
                    shape: 'rect',
                    label: 'subscribe'
                },
                createSubscription: function (data, actions) {
                    return actions.subscription.create({
                        'plan_id': import.meta.env.VITE_PAYPAL_PLAN_ID
                    });
                },
                onApprove: async function (data, actions) {
                    try {
                        const now = new Date();
                        const trialEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days trial
                        const nextPaymentDate = new Date(now.getTime() + 37 * 24 * 60 * 60 * 1000); // 7 days trial + 30 days

                        await createSubscription(currentUser.uid, {
                            subscriptionId: data.subscriptionID,
                            planId: import.meta.env.VITE_PAYPAL_PLAN_ID,
                            status: 'TRIAL',
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

                        setSubscription({
                            status: 'TRIAL',
                            subscriptionId: data.subscriptionID,
                            trialEndDate: trialEndDate,
                            nextPaymentDate: nextPaymentDate
                        });

                        toast.success('Trial started successfully! You now have access to all Pro features.');
                    } catch (error) {
                        console.error('Error processing subscription:', error);
                        toast.error('Failed to process subscription. Please try again.');
                    }
                }
            }).render('#paypal-button-container');
        }
    };

    const features = [
        'Unlimited team members',
        'Unlimited projects',
        'Advanced collaboration tools',
        'Premium support',
        'Custom branding',
        'Advanced analytics',
        'API access',
        'Priority updates'
    ];

    if (loading) {
        return <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>;
    }

    return (
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl m-4">
            <div className="p-8">
                <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
                    FeedbackFlow Pro
                </div>
                <div className="block mt-1 text-lg leading-tight font-medium text-black">
                    $12/month
                </div>
                <p className="mt-2 text-gray-500">
                    First 10 days free trial, then $12/month
                </p>

                {subscription?.status === 'ACTIVE' ? (
                    <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        <p className="font-bold">Active Subscription</p>
                        <p className="text-sm">Your subscription is active and you have access to all premium features.</p>
                    </div>
                ) : (
                    <div className="mt-4">
                        <div id="paypal-button-container"></div>
                    </div>
                )}

                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Premium Features</h3>
                    <ul className="space-y-3">
                        {features.map((feature, index) => (
                            <li key={index} className="flex items-center space-x-3">
                                <FaCheck className="flex-shrink-0 w-5 h-5 text-green-500" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPlan; 