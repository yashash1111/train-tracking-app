import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
    throw new Error('JWT Secrets not defined in .env');
}

export const generateAccessToken = (userId: string, role: string) => {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (userId: string) => {
    return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string) => {
    return jwt.verify(token, JWT_SECRET);
};

export const verifyRefreshToken = (token: string) => {
    return jwt.verify(token, JWT_REFRESH_SECRET);
};
