
// src/routes/project.routes.ts
import { Router } from 'express';
const router = Router();

// Add your routes here
router.get('/', /* your project list handler */);
router.post('/', /* your project creation handler */);

export default router;
