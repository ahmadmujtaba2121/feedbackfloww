import express from 'express';
import { submitFeedback, getFeedback } from '../controllers/feedbackController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Submit feedback (requires authentication)
router.post('/', authenticateToken, submitFeedback);

// Get feedback (requires authentication)
router.get('/', authenticateToken, getFeedback);

export default router; 