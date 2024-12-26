// src/routes/auth.routes.ts
import { Router } from 'express';
import { login, register, logout } from '../controllers/auth.controller';

const router = Router();

// Define routes with their corresponding controller functions
router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);

export default router;
