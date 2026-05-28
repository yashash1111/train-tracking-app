import { Router } from 'express';
import { getTrains, getTrainById, createTrain, updateTrainLocation } from '../controllers/trains';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

router.get('/', getTrains);
router.get('/:id', getTrainById);
router.post('/', authenticateToken, requireAdmin, createTrain);
router.put('/:id/location', authenticateToken, requireAdmin, updateTrainLocation);

export default router;
