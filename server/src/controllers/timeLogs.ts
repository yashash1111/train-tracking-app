import { Request, Response } from 'express';
import TimeLog from '../models/TimeLog';
import { z } from 'zod';

const createLogSchema = z.object({
    description: z.string().min(1),
    project: z.string().min(1).default('General'),
    startTime: z.string().optional(),
});

export const getLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.userId;
        const logs = await TimeLog.find({ userId }).sort({ createdAt: -1 });
        res.json(logs);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error fetching time logs' });
    }
};

export const createLog = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.userId;
        const { description, project, startTime } = createLogSchema.parse(req.body);

        const newLog = new TimeLog({
            userId,
            description,
            project,
            startTime: startTime ? new Date(startTime) : new Date(),
        });
        await newLog.save();

        res.status(201).json(newLog);
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Error creating time log' });
    }
};

export const updateLog = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.userId;
        const { id } = req.params;
        const { endTime, duration } = req.body;

        const updatedLog = await TimeLog.findOneAndUpdate(
            { _id: id, userId },
            { endTime: endTime ? new Date(endTime) : undefined, duration },
            { new: true }
        );

        if (!updatedLog) {
            res.status(404).json({ message: 'Time log not found' });
            return;
        }

        res.json(updatedLog);
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Error updating time log' });
    }
};

export const deleteLog = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.userId;
        const { id } = req.params;

        const deleted = await TimeLog.findOneAndDelete({ _id: id, userId });
        if (!deleted) {
            res.status(404).json({ message: 'Time log not found' });
            return;
        }

        res.json({ message: 'Time log deleted' });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Error deleting time log' });
    }
};
