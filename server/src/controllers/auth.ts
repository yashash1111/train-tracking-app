import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token';
import { z } from 'zod';

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const signup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, name } = signupSchema.parse(req.body);

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            email,
            passwordHash: hashedPassword,
            name,
        });
        await user.save();

        const accessToken = generateAccessToken(user.id, 'USER');
        const refreshToken = generateRefreshToken(user.id);

        res.status(201).json({
            message: 'User created successfully',
            user: { id: user.id, email: user.email, name: user.name },
            accessToken,
            refreshToken,
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Error creating user' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const user = await User.findOne({ email });
        if (!user) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }

        const accessToken = generateAccessToken(user.id, 'USER');
        const refreshToken = generateRefreshToken(user.id);

        res.json({
            message: 'Login successful',
            user: { id: user.id, email: user.email, name: user.name },
            accessToken,
            refreshToken,
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Error logging in' });
    }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    const { token } = req.body;
    if (!token) {
        res.status(401).json({ message: 'Refresh token required' });
        return;
    }

    try {
        const payload = verifyRefreshToken(token) as any;
        const user = await User.findById(payload.userId);

        if (!user) {
            res.status(403).json({ message: 'User not found' });
            return;
        }

        const accessToken = generateAccessToken(user.id, 'USER');
        res.json({ accessToken });
    } catch (error) {
        res.status(403).json({ message: 'Invalid refresh token' });
    }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ message: 'Email is required' });
            return;
        }

        const user = await User.findOne({ email });
        if (!user) {
            res.status(400).json({ message: 'User not found with this email' });
            return;
        }

        // Generate a 6-digit secure OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        user.resetOtp = otp;
        user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
        await user.save();

        res.status(200).json({
            message: 'Password reset OTP generated successfully',
            otp, // In a real production app, this would be sent via SMTP/SMS. We expose it for high-fidelity offline simulation!
            email: user.email
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error generating reset OTP' });
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            res.status(400).json({ message: 'Email, OTP, and new password are required' });
            return;
        }

        if (newPassword.length < 6) {
            res.status(400).json({ message: 'Password must be at least 6 characters long' });
            return;
        }

        const user = await User.findOne({ email });
        if (!user) {
            res.status(400).json({ message: 'User not found' });
            return;
        }

        // Verify OTP and Expiration
        if (!user.resetOtp || user.resetOtp !== otp || !user.resetOtpExpires || user.resetOtpExpires < new Date()) {
            res.status(400).json({ message: 'Invalid or expired password reset OTP' });
            return;
        }

        // Hash new password and clear OTP
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.passwordHash = hashedPassword;
        user.resetOtp = undefined;
        user.resetOtpExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error resetting password' });
    }
};

// Guest Login endpoint
export const guestLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const guestEmail = 'guest@railtrack.com';
        let user = await User.findOne({ email: guestEmail });
        
        if (!user) {
            const hashedPassword = await bcrypt.hash('guest123', 10);
            user = new User({
                email: guestEmail,
                passwordHash: hashedPassword,
                name: 'Guest Inspector'
            });
            await user.save();
        }

        const accessToken = generateAccessToken(user.id, 'USER');
        const refreshToken = generateRefreshToken(user.id);

        res.json({
            message: 'Guest login successful',
            user: { id: user.id, email: user.email, name: user.name },
            accessToken,
            refreshToken,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error logging in as guest' });
    }
};

// Retrieve User Profile endpoint
export const getProfile = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const user = await User.findById(userId).select('-passwordHash');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.json(user);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error fetching profile' });
    }
};

// Update User Profile details
export const updateProfile = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const { name, email, newPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (email && email.toLowerCase() !== user.email.toLowerCase()) {
            const existingEmail = await User.findOne({ email: email.toLowerCase() });
            if (existingEmail) {
                res.status(400).json({ message: 'Email address already in use' });
                return;
            }
            user.email = email.toLowerCase();
        }

        if (name) {
            user.name = name;
        }

        if (newPassword) {
            if (newPassword.length < 6) {
                res.status(400).json({ message: 'Password must be at least 6 characters' });
                return;
            }
            user.passwordHash = await bcrypt.hash(newPassword, 10);
        }

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: { id: user.id, email: user.email, name: user.name }
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error updating profile' });
    }
};

