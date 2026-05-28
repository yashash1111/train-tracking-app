import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { getIO } from '../socket';
import { z } from 'zod';

// Schemas
const createTrainSchema = z.object({
    name: z.string(),
    number: z.string(),
    type: z.enum(['EXPRESS', 'LOCAL']),
});

const updateLocationSchema = z.object({
    latitude: z.number(),
    longitude: z.number(),
    speed: z.number().optional(),
    current_station_id: z.string().optional().nullable(),
});

// Implementation
export const getTrains = async (req: Request, res: Response) => {
    const { source, destination } = req.query as { source?: string; destination?: string };

    const where: any = {};

    if (source && destination) {
        where.routes = {
            some: {
                source_station_id: source,
                destination_station_id: destination,
            }
        };
    } else if (source) {
        where.routes = {
            some: {
                source_station_id: source
            }
        };
    } else if (destination) {
        where.routes = {
            some: {
                destination_station_id: destination
            }
        };
    }

    const trains = await prisma.train.findMany({
        where,
        include: {
            live_location: true,
            routes: {
                take: 1,
                include: {
                    source_station: true,
                    destination_station: true
                }
            }
        }
    });
    res.json(trains);
};

export const getTrainById = async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const train = await prisma.train.findUnique({
        where: { id },
        include: {
            live_location: true,
            routes: {
                include: {
                    source_station: true,
                    destination_station: true
                }
            }
        }
    });
    if (!train) return res.status(404).json({ message: 'Train not found' });
    res.json(train);
};

export const createTrain = async (req: Request, res: Response) => {
    try {
        const data = createTrainSchema.parse(req.body);
        const train = await prisma.train.create({ data });
        res.status(201).json(train);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateTrainLocation = async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    try {
        const { latitude, longitude, speed, current_station_id } = updateLocationSchema.parse(req.body);

        const location = await prisma.liveTrainLocation.upsert({
            where: { train_id: id },
            update: {
                latitude,
                longitude,
                speed: speed || 0,
                current_station_id,
                last_updated: new Date(),
            },
            create: {
                train_id: id,
                latitude,
                longitude,
                speed: speed || 0,
                current_station_id,
            },
        });

        // Broadcast update via Socket.io
        const io = getIO();
        io.to(`train:${id}`).emit('trainLocationUpdate', location);
        // Also broadcast to a general global map room if needed
        io.emit('globalTrainUpdate', { trainId: id, location });

        res.json(location);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
