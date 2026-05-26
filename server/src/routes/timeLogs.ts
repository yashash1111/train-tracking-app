import { Router } from 'express';
import { getLogs, createLog, updateLog, deleteLog } from '../controllers/timeLogs';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getLogs);
router.post('/', createLog);
router.patch('/:id', updateLog);
router.delete('/:id', deleteLog);

export default router;
