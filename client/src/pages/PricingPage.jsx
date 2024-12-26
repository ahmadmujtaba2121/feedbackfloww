import React, { useEffect } from 'react';
import { FiCheck, FiCpu, FiUsers, FiLayers, FiShield, FiMessageSquare, FiCalendar, FiGrid, FiImage, FiFile, FiCode } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { toast } from 'react-hot-toast';
import { useFeatureAccess } from '../hooks/useFeatureAccess';

const PricingPage = () => {
  const { currentUser } = useAuth();
  const { subscription, loading } = useSubscription();
  const { canAccessPayPalButton } = useFeatureAccess();

  const freeFeatures = [
    'Basic AI-Powered Feedback',
    'Real-time Collaboration (up to 3 members)',
    'Basic Version Control',
    'Basic Smart Comments',
    'Basic Kanban Board',
    'Basic Calendar View',
    'Basic Asset Management',
    'Standard Security',
    'Support for PNG, JPEG, SVG files',
    'Basic Code File Support',
  ];

  const proFeatures = [
    'Advanced AI-Powered Feedback & Analysis',
    'Unlimited Team Members',
    'Advanced Version Control & Branching',
    'Advanced Smart Comments & Annotations',
    'Advanced Kanban Board with Custom Fields',
    'Advanced Calendar with Timeline View',
    'Advanced Asset Management & Organization',
    'Enterprise-Grade Security',
    'Support for All File Types (Including PDF, PSD, AI - Coming Soon)',
    'Advanced Code File Support with Syntax Highlighting',
    'Priority Support',
    'Custom Branding',
    'Advanced Analytics',
    'API Access',
    'Priority Updates'
  ];

  const renderPayPalButton = () => {
    if (!currentUser) {
      return (
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Sign in to subscribe to Pro Plan</p>
          <a
            href="/signin"
            className="inline-block w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-accent transition-colors text-center"
          >
            Sign In
          </a>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="text-center">
          <p className="text-muted-foreground">Loading subscription status...</p>
        </div>
      );
    }

    // Show subscription status if exists
    if (subscription?.status) {
      let buttonText = '';
      let buttonColor = '';
      let isDisabled = true;
      let description = '';
      const showPayPalButton = canAccessPayPalButton();

      switch (subscription.status) {
        case 'ACTIVE':
          buttonText = 'Active Subscription';
          buttonColor = 'bg-green-500';
          description = 'Your subscription is active and will renew automatically';
          break;
        case 'TRIAL':
          const trialEnd = subscription.trialEndDate?.toDate();
          const daysLeft = trialEnd ? Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24)) : 0;
          buttonText = `Trial Active - ${daysLeft} days left`;
          buttonColor = 'bg-blue-500';
          description = daysLeft <= 2 ? 'Your trial is ending soon. Subscribe to continue access.' : 'Enjoying your trial? Subscribe to continue access after trial ends.';
          break;
        case 'CANCELLED':
          buttonText = 'Subscription Cancelled';
          buttonColor = 'bg-red-500';
          description = 'Your subscription will end at the end of the billing period';
          break;
        case 'PAYMENT_FAILED':
          buttonText = 'Update Payment Method';
          buttonColor = 'bg-orange-500';
          isDisabled = false;
          description = 'Please update your payment method to continue your subscription';
          break;
        case 'EXPIRED':
          buttonText = 'Subscription Expired';
          buttonColor = 'bg-gray-500';
          description = 'Your subscription has expired. Please resubscribe to access premium features';
          break;
        default:
          buttonText = 'Contact Support';
          buttonColor = 'bg-gray-500';
          description = 'Please contact support for assistance with your subscription';
      }

      return (
        <div className="space-y-2">
          <button
            className={`w-full py-3 px-4 ${buttonColor} text-white rounded-lg cursor-default`}
            disabled={isDisabled}
          >
            {buttonText}
          </button>
          <p className="text-sm text-muted-foreground text-center">{description}</p>
          {subscription.status === 'ACTIVE' && subscription.nextPaymentDate && (
            <p className="text-sm text-green-400 text-center">
              Next payment: {new Date(subscription.nextPaymentDate).toLocaleDateString()}
            </p>
          )}
          {showPayPalButton && (
            <div className="mt-4">
              <form action="https://www.sandbox.paypal.com/cgi-bin/webscr" method="post" target="_top" className="w-full">
                <input type="hidden" name="cmd" value="_xclick-subscriptions" />
                <input type="hidden" name="business" value="sb-o9xik34975694@business.example.com" />
                <input type="hidden" name="lc" value="US" />
                <input type="hidden" name="item_name" value="FeedbackFlow Pro Plan" />
                <input type="hidden" name="item_number" value="pro_monthly" />
                <input type="hidden" name="no_note" value="1" />
                <input type="hidden" name="src" value="1" />
                <input type="hidden" name="a3" value="12.00" />
                <input type="hidden" name="p3" value="1" />
                <input type="hidden" name="t3" value="M" />
                <input type="hidden" name="currency_code" value="USD" />
                <input type="hidden" name="bn" value="PP-SubscriptionsBF:btn_subscribeCC_LG.gif:NonHostedGuest" />
                <input type="hidden" name="custom" value={currentUser.uid} />
                <input type="hidden" name="return" value={`${window.location.origin}/pricing?success=true`} />
                <input type="hidden" name="cancel_return" value={`${window.location.origin}/pricing?success=false`} />
                <input type="hidden" name="notify_url" value={`${window.location.origin}/api/paypal-webhook`} />
                <input type="hidden" name="no_shipping" value="1" />

                {/* Trial Period Settings */}
                <input type="hidden" name="a1" value="0" />
                <input type="hidden" name="p1" value="7" />
                <input type="hidden" name="t1" value="D" />

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-[#FFC439] hover:bg-[#F2BA36] text-slate-900 font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <img
                    src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/pp-acceptance-medium.png"
                    alt="PayPal"
                    className="h-6"
                  />
                  <span>{subscription.status === 'TRIAL' ? 'Subscribe Now' : 'Reactivate Subscription'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      );
    }

    // For new users
    return (
      <div className="space-y-4">
        <form action="https://www.sandbox.paypal.com/cgi-bin/webscr" method="post" target="_top" className="w-full">
          <input type="hidden" name="cmd" value="_xclick-subscriptions" />
          <input type="hidden" name="business" value="sb-o9xik34975694@business.example.com" />
          <input type="hidden" name="lc" value="US" />
          <input type="hidden" name="item_name" value="FeedbackFlow Pro Plan" />
          <input type="hidden" name="item_number" value="pro_monthly" />
          <input type="hidden" name="no_note" value="1" />
          <input type="hidden" name="src" value="1" />
          <input type="hidden" name="a3" value="12.00" />
          <input type="hidden" name="p3" value="1" />
          <input type="hidden" name="t3" value="M" />
          <input type="hidden" name="currency_code" value="USD" />
          <input type="hidden" name="bn" value="PP-SubscriptionsBF:btn_subscribeCC_LG.gif:NonHostedGuest" />
          <input type="hidden" name="custom" value={currentUser.uid} />
          <input type="hidden" name="return" value={`${window.location.origin}/pricing?success=true`} />
          <input type="hidden" name="cancel_return" value={`${window.location.origin}/pricing?success=false`} />
          <input type="hidden" name="notify_url" value={`${window.location.origin}/api/paypal-webhook`} />
          <input type="hidden" name="no_shipping" value="1" />

          {/* Trial Period Settings */}
          <input type="hidden" name="a1" value="0" />
          <input type="hidden" name="p1" value="7" />
          <input type="hidden" name="t1" value="D" />

          <button
            type="submit"
            className="w-full py-3 px-4 bg-[#FFC439] hover:bg-[#F2BA36] text-slate-900 font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <img
              src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/pp-acceptance-medium.png"
              alt="PayPal"
              className="h-6"
            />
            <span>Start 7-Day Free Trial</span>
          </button>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Then $12/month. Cancel anytime.
          </p>
        </form>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-secondary-foreground mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select the plan that best fits your design workflow needs
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
            <button
              className="w-full py-3 px-4 bg-muted text-secondary-foreground rounded-lg hover:bg-accent transition-colors"
              disabled={true}
            >
              Current Plan
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-foreground/95 backdrop-blur-lg rounded-xl p-8 border border-primary relative">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>

            <div className="text-center">
              <h3 className="text-xl font-semibold text-secondary-foreground mb-2">Pro Plan</h3>
              <div className="text-4xl font-bold text-secondary-foreground mb-4">
                $12
                <span className="text-lg text-muted-foreground">/month</span>
              </div>
              <p className="text-muted-foreground mb-6">For professional teams and advanced features</p>
            </div>

            <ul className="space-y-4 mb-8">
              {proFeatures.map((feature, index) => (
                <li key={index} className="flex items-center text-secondary-foreground">
                  <FiCheck className="w-5 h-5 text-primary mr-2" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {renderPayPalButton()}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Can I cancel my subscription?
              </h3>
              <p className="text-slate-400">
                Yes, you can cancel your subscription at any time. You'll continue to have access to pro features until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Do I need a credit card?
              </h3>
              <p className="text-slate-400">
                No, you can pay with your PayPal balance, bank account, or credit card. Any payment method accepted by PayPal will work.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Is there a long-term commitment?
              </h3>
              <p className="text-slate-400">
                No, our plans are month-to-month with no long-term commitment required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
