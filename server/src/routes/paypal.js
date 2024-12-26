const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// PayPal IPN (Instant Payment Notification) webhook handler
router.post('/webhook', async (req, res) => {
    try {
        const { custom, txn_type, payment_status, subscr_id, payer_email, mc_gross } = req.body;

        // Log the webhook payload for debugging
        console.log('PayPal Webhook Payload:', req.body);

        // Handle different transaction types
        switch (txn_type) {
            case 'subscr_signup':
                // Check if user already had a subscription
                const userDoc = await db.collection('subscriptions').doc(custom).get();
                if (userDoc.exists) {
                    const data = userDoc.data();
                    if (data.status === 'CANCELLED') {
                        // Reactivating cancelled subscription
                        await db.collection('subscriptions').doc(custom).update({
                            status: 'ACTIVE',
                            subscriptionId: subscr_id,
                            paypalEmail: payer_email,
                            startDate: new Date(),
                            updatedAt: new Date()
                        });
                    }
                } else {
                    // New subscription
                    await db.collection('subscriptions').doc(custom).set({
                        status: 'ACTIVE',
                        subscriptionId: subscr_id,
                        paypalEmail: payer_email,
                        startDate: new Date(),
                        updatedAt: new Date(),
                        amount: mc_gross
                    });
                }
                break;

            case 'subscr_payment':
                // Subscription payment received
                if (payment_status === 'Completed') {
                    await db.collection('subscriptions').doc(custom).update({
                        status: 'ACTIVE',
                        lastPaymentDate: new Date(),
                        lastPaymentAmount: mc_gross,
                        updatedAt: new Date()
                    });
                }
                break;

            case 'subscr_cancel':
                // Subscription cancelled
                await db.collection('subscriptions').doc(custom).update({
                    status: 'CANCELLED',
                    cancelDate: new Date(),
                    updatedAt: new Date()
                });
                break;

            case 'subscr_failed':
                // Subscription payment failed
                await db.collection('subscriptions').doc(custom).update({
                    status: 'PAYMENT_FAILED',
                    lastFailedDate: new Date(),
                    updatedAt: new Date()
                });
                break;

            case 'subscr_eot':
                // Subscription expired
                await db.collection('subscriptions').doc(custom).update({
                    status: 'EXPIRED',
                    expiryDate: new Date(),
                    updatedAt: new Date()
                });
                break;
        }

        // Log the successful processing
        console.log(`Successfully processed ${txn_type} for user ${custom}`);
        res.status(200).send('OK');
    } catch (error) {
        console.error('PayPal Webhook Error:', error);
        res.status(500).send('Error processing webhook');
    }
});

module.exports = router; 