const PricingPage = () => {
    const { currentUser } = useAuth();
    const { subscription, loading } = useSubscription();
    const { canAccessPayPalButton } = useFeatureAccess();

    const freeFeatures = [
        'Unlimited Projects',
        'Basic Project Management',
        'Up to 3 team members',
        'Basic Canvas Tools',
        'File Upload Support (PNG, JPEG, PDF)',
        'Basic Comments',
        'Project Invites',
        'Version History (7 days)',
        'Email Notifications',
        'Community Support'
    ];

    const proFeatures = [
        'Everything in Free, plus:',
        'Unlimited Team Members',
        'Advanced Canvas Tools',
        'AI-Powered Feedback Analysis',
        'Advanced Project Analytics',
        'Custom Branding Options',
        'Priority Support',
        'Extended Version History',
        'Advanced Export Options',
        'Kanban Board View',
        'Calendar View',
        'Time Tracking',
        'Invoice Generation',
        'API Access',
        'Advanced Security Features',
        'Custom Integrations'
    ];

    // ... rest of the existing code ...

    return (
        <div className="min-h-screen bg-background pt-20 pb-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-secondary-foreground mb-4">
                        Choose Your Plan
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Start for free, upgrade when you need more features
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Free Plan */}
                    <div className="bg-foreground/95 backdrop-blur-lg rounded-xl p-8 border border-border">
                        <div className="text-center">
                            <h3 className="text-xl font-semibold text-secondary-foreground mb-2">Free Plan</h3>
                            <div className="text-4xl font-bold text-secondary-foreground mb-4">$0</div>
                            <p className="text-muted-foreground mb-6">Perfect for getting started</p>
                        </div>
                        <ul className="space-y-4 mb-8">
                            {freeFeatures.map((feature, index) => (
                                <li key={index} className="flex items-center text-secondary-foreground">
                                    <FiCheck className="w-5 h-5 text-primary mr-2" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <Link
                            to="/signup"
                            className="w-full py-3 px-4 bg-muted text-secondary-foreground rounded-lg hover:bg-accent transition-colors flex items-center justify-center"
                        >
                            Get Started Free
                            <FiArrowRight className="ml-2" />
                        </Link>
                    </div>

                    {/* Pro Plan */}
                    <div className="bg-foreground/95 backdrop-blur-lg rounded-xl p-8 border border-primary relative">
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                            <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                                Most Popular
                            </span>
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-semibold text-secondary-foreground mb-2">Pro Plan</h3>
                            <div className="text-4xl font-bold text-secondary-foreground mb-4">
                                <span className="text-2xl">$</span>12
                                <span className="text-xl text-muted-foreground">/month</span>
                            </div>
                            <p className="text-muted-foreground mb-6">For growing teams</p>
                        </div>
                        <ul className="space-y-4 mb-8">
                            {proFeatures.map((feature, index) => (
                                <li key={index} className="flex items-center text-secondary-foreground">
                                    <FiCheck className="w-5 h-5 text-primary mr-2" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => window.location.href = '/contact'}
                            className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-accent transition-colors flex items-center justify-center"
                        >
                            Contact for Pro Access
                            <FiArrowRight className="ml-2" />
                        </button>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-16 max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-secondary-foreground mb-8 text-center">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-secondary-foreground mb-2">
                                How does the free plan work?
                            </h3>
                            <p className="text-muted-foreground">
                                The free plan gives you access to all essential features with some limitations. You can create unlimited projects and invite up to 3 team members per project.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-secondary-foreground mb-2">
                                Can I upgrade or downgrade at any time?
                            </h3>
                            <p className="text-muted-foreground">
                                Yes, you can upgrade to Pro or downgrade to Free at any time. When downgrading, you'll maintain access to Pro features until the end of your billing period.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-secondary-foreground mb-2">
                                What payment methods do you accept?
                            </h3>
                            <p className="text-muted-foreground">
                                Currently, we accept manual payments. Contact us to discuss payment options for the Pro plan.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-secondary-foreground mb-2">
                                Is there a free trial for Pro features?
                            </h3>
                            <p className="text-muted-foreground">
                                Yes, you can try Pro features for free by contacting our support team for a trial period.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingPage; 