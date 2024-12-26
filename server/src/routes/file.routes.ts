import express from 'express';
import { deleteFile } from '../controllers/file.controller';

const router = express.Router();

router.post('/delete', deleteFile);

export default router;
