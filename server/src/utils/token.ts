import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'trainjwtsecret2024xYzAbCdEfGhIj_fallback';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refreshsecret2024xYzAbCdEfGhIj_fallback';

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
