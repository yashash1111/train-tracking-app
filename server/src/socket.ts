import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer;

export const initSocket = (httpServer: HttpServer) => {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: '*', // Restrict in production
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });

        socket.on('joinUserRoom', (userId) => {
            console.log(`Socket ${socket.id} joined user room ${userId}`);
            socket.join(`user:${userId}`);
        });

        socket.on('timerUpdate', (data) => {
            // data should include userId, status (start/stop), currentDuration, etc.
            if (data.userId) {
                // Broadcast to other sessions of the same user
                socket.to(`user:${data.userId}`).emit('timerSync', data);
            }
        });

        // 1. Join a specific train's tracking room
        socket.on('joinTrainRoom', (trainId) => {
            console.log(`Socket ${socket.id} joined train room ${trainId}`);
            socket.join(`train:${trainId}`);
        });

        // 2. Broadcast a live passenger chat update to all spotters in the room
        socket.on('sendTrainChatMessage', (data) => {
            if (data.trainId) {
                // Broadcast to everyone inside the train room, including the sender
                io.to(`train:${data.trainId}`).emit('newTrainChatMessage', data);
            }
        });

        // 3. Sync simulated movement / delay changes to all observers in real-time
        socket.on('simulateTrainStatusUpdate', (data) => {
            if (data.trainId) {
                // Sync to all other clients watching this train
                socket.to(`train:${data.trainId}`).emit('trainStatusSynced', data);
            }
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
