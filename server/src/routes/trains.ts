import { Router } from 'express';
import { 
    getTrains, 
    getTrainById, 
    getStations, 
    getChatMessages, 
    postChatMessage 
} from '../controllers/trains';

const router = Router();

// Open public routes for train listings, schedules, and stations
router.get('/trains', getTrains);
router.get('/trains/:id', getTrainById);
router.get('/stations', getStations);

// Chat endpoints for train-specific passenger social feeds
router.get('/trains/:id/chats', getChatMessages);
router.post('/trains/:id/chats', postChatMessage);

export default router;
