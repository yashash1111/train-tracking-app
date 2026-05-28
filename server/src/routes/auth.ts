import { Router } from 'express';
import { 
    signup, 
    login, 
    refreshToken, 
    forgotPassword, 
    resetPassword,
    guestLogin,
    getProfile,
    updateProfile,
    getLeaderboard,
    spotTrain
} from '../controllers/auth';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/guest', guestLogin);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

router.get('/leaderboard', authenticateToken, getLeaderboard);
router.post('/spot/:trainId', authenticateToken, spotTrain);

export default router;
