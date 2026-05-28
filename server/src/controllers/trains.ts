import { Request, Response } from 'express';
import Train from '../models/Train';
import Station from '../models/Station';
import SpotEvent from '../models/SpotEvent';
import ChatMessage from '../models/ChatMessage';

// Get all trains, optionally filtered by source / destination station IDs
export const getTrains = async (req: Request, res: Response): Promise<void> => {
    try {
        const { source, destination } = req.query;
        let query: any = {};

        if (source || destination) {
            let sourceStation = null;
            let destStation = null;

            if (source) {
                sourceStation = await Station.findById(source);
            }
            if (destination) {
                destStation = await Station.findById(destination);
            }

            if (sourceStation && destStation) {
                query = {
                    $and: [
                        { 'routes.stops.code': sourceStation.code },
                        { 'routes.stops.code': destStation.code }
                    ]
                };
            } else if (sourceStation) {
                query = { 'routes.stops.code': sourceStation.code };
            } else if (destStation) {
                query = { 'routes.stops.code': destStation.code };
            }
        }

        const trains = await Train.find(query);

        if (source && destination) {
            const sourceStation = await Station.findById(source);
            const destStation = await Station.findById(destination);
            if (sourceStation && destStation) {
                const sCode = sourceStation.code;
                const dCode = destStation.code;

                const filteredTrains = trains.filter(t => {
                    const stops = t.routes?.[0]?.stops || [];
                    const sIdx = stops.findIndex(stop => stop.code === sCode);
                    const dIdx = stops.findIndex(stop => stop.code === dCode);
                    return sIdx !== -1 && dIdx !== -1 && sIdx < dIdx;
                });
                res.json(filteredTrains);
                return;
            }
        }

        res.json(trains);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error fetching trains' });
    }
};

// Get a single train by ID
export const getTrainById = async (req: Request, res: Response): Promise<void> => {
    try {
        const train = await Train.findById(req.params.id);
        if (!train) {
            res.status(404).json({ message: 'Train not found' });
            return;
        }
        res.json(train);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error fetching train details' });
    }
};

// Get all stations, sorted alphabetically
export const getStations = async (req: Request, res: Response): Promise<void> => {
    try {
        const stations = await Station.find().sort({ name: 1 });
        res.json(stations);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error fetching stations' });
    }
};

// Get recently spotted trains globally
export const getRecentSpots = async (req: Request, res: Response) => {
    try {
        const spots = await SpotEvent.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('train', 'number name type')
            .populate('user', 'name profilePhotoUrl badge');
        
        res.json(spots);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error fetching recent spots' });
    }
};

// Get the last 50 chat messages for a specific train
export const getChatMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const messages = await ChatMessage.find({ trainId: id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(messages.reverse());
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error fetching chat messages' });
    }
};

// Post a passenger chat message
export const postChatMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { username, message } = req.body;

        if (!username || !message) {
            res.status(400).json({ message: 'Username and message are required' });
            return;
        }

        const newMessage = new ChatMessage({
            trainId: id,
            username,
            message,
            timestamp: new Date()
        });

        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error posting message' });
    }
};

// Auto Seed scaled procedural Database on startup
export const seedTrainsAndStations = async () => {
    try {
        const stationCount = await Station.countDocuments();
        const trainCount = await Train.countDocuments();

        // If we have already seeded 24 stations and 150 trains, we skip!
        if (stationCount >= 24 && trainCount >= 150) {
            console.log('Scaled dynamic network already seeded. Skipping...');
            return;
        }

        console.log('Regenerating Scaled Algorithmic Indian Railway Network...');

        // 1. Major Indian Railway Hubs (24 stations)
        const stationsData = [
            { code: 'NDLS', name: 'New Delhi Junction', latitude: 28.6430, longitude: 77.2223 },
            { code: 'BPL', name: 'Bhopal Junction', latitude: 23.2599, longitude: 77.4126 },
            { code: 'NGP', name: 'Nagpur Junction', latitude: 21.1500, longitude: 79.0900 },
            { code: 'SBC', name: 'KSR Bengaluru City', latitude: 12.9779, longitude: 77.5696 },
            { code: 'TVC', name: 'Trivandrum Central', latitude: 8.4879, longitude: 76.9515 },
            { code: 'CSMT', name: 'Mumbai CSMT', latitude: 18.9400, longitude: 72.8352 },
            { code: 'KOTA', name: 'Kota Junction', latitude: 25.2138, longitude: 75.8648 },
            { code: 'RTM', name: 'Ratlam Junction', latitude: 23.3361, longitude: 75.0371 },
            { code: 'BRC', name: 'Vadodara Junction', latitude: 22.3106, longitude: 73.1926 },
            { code: 'MTJ', name: 'Mathura Junction', latitude: 27.4924, longitude: 77.6737 },
            { code: 'AGC', name: 'Agra Cantt', latitude: 27.1767, longitude: 78.0081 },
            { code: 'GWL', name: 'Gwalior Junction', latitude: 26.2183, longitude: 78.1828 },
            { code: 'VGLJ', name: 'VGL Jhansi Junction', latitude: 25.4484, longitude: 78.5685 },
            { code: 'NZM', name: 'Hazrat Nizamuddin', latitude: 28.5888, longitude: 77.2536 },
            { code: 'SC', name: 'Secunderabad Junction', latitude: 17.4338, longitude: 78.5016 },
            { code: 'HWH', name: 'Howrah Junction', latitude: 22.5834, longitude: 88.3418 },
            { code: 'MAS', name: 'Chennai Central', latitude: 13.0827, longitude: 80.2707 },
            { code: 'HYB', name: 'Hyderabad Deccan', latitude: 17.3850, longitude: 78.4867 },
            { code: 'PNBE', name: 'Patna Junction', latitude: 25.6022, longitude: 85.1200 },
            { code: 'GHY', name: 'Guwahati Junction', latitude: 26.1822, longitude: 91.7539 },
            { code: 'ADI', name: 'Ahmedabad Junction', latitude: 23.0225, longitude: 72.5714 },
            { code: 'JAT', name: 'Jammu Tawi', latitude: 32.7061, longitude: 74.8797 },
            { code: 'LKO', name: 'Lucknow Charbagh', latitude: 26.8467, longitude: 80.9462 },
            { code: 'CNB', name: 'Kanpur Central', latitude: 26.4499, longitude: 80.3319 }
        ];

        await Station.deleteMany({});
        const seededStations = await Station.insertMany(stationsData);
        console.log(`Seeded ${seededStations.length} scaled stations successfully.`);

        // Coordinate Distance calculation helper
        const getDistance = (s1: any, s2: any) => {
            const dx = s1.latitude - s2.latitude;
            const dy = s1.longitude - s2.longitude;
            return Math.sqrt(dx*dx + dy*dy);
        };

        // Generates logical 12-hour timetables (e.g. 08:30 AM + offset)
        const formatTime = (minutesSinceMidnight: number) => {
            const mins = minutesSinceMidnight % 1440;
            let hour = Math.floor(mins / 60);
            const min = mins % 60;
            const ampm = hour >= 12 ? 'PM' : 'AM';
            hour = hour % 12;
            hour = hour ? hour : 12; // 0 should be 12
            const minStr = min < 10 ? '0' + min : min.toString();
            return `${hour}:${minStr} ${ampm}`;
        };

        // 2. Procedural Algorithmic Train Generator (150 Trains)
        const trainsData: any[] = [];
        const trainTypes = ['Rajdhani Express', 'Shatabdi Express', 'Superfast Express', 'Humsafar Express', 'Duronto Express'];
        const nameSuffixes = ['Express', 'Superfast', 'Shatabdi', 'Rajdhani', 'Mail'];

        for (let i = 1; i <= 150; i++) {
            // Select random origin & destination hubs
            const origIdx = Math.floor(Math.random() * seededStations.length);
            let destIdx = Math.floor(Math.random() * seededStations.length);
            while (origIdx === destIdx) {
                destIdx = Math.floor(Math.random() * seededStations.length);
            }

            const origStn = seededStations[origIdx];
            const destStn = seededStations[destIdx];

            // Select 2 to 4 intermediate stops along the path
            const possibleIntermediates = seededStations.filter((_, idx) => idx !== origIdx && idx !== destIdx);
            const numIntermediates = Math.floor(Math.random() * 3) + 2; // 2 to 4 stops
            const selectedIntermediates: any[] = [];
            
            // Randomly pick intermediates
            for (let j = 0; j < numIntermediates; j++) {
                if (possibleIntermediates.length === 0) break;
                const pickIdx = Math.floor(Math.random() * possibleIntermediates.length);
                selectedIntermediates.push(possibleIntermediates.splice(pickIdx, 1)[0]);
            }

            // Geographically sort intermediates by their coordinate distance from the origin!
            // This ensures they form a progressive linear path on Leaflet maps!
            selectedIntermediates.sort((a, b) => getDistance(origStn, a) - getDistance(origStn, b));

            const fullStops = [origStn, ...selectedIntermediates, destStn];

            // Schedule timetable progressive timings (halt: 10m, transit: 120-180m per stop)
            const stopsArray: any[] = [];
            let currentMinutes = Math.floor(Math.random() * 480) + 300; // starts between 5:00 AM and 1:00 PM

            fullStops.forEach((st, idx) => {
                const isOrigin = idx === 0;
                const isDest = idx === fullStops.length - 1;
                
                const arrival = isOrigin ? formatTime(currentMinutes) : formatTime(currentMinutes);
                
                if (!isOrigin) {
                    currentMinutes += Math.floor(Math.random() * 5) + 5; // 5-10 min halt
                }

                const departure = isDest ? formatTime(currentMinutes) : formatTime(currentMinutes);
                
                stopsArray.push({
                    stationName: st.name,
                    code: st.code,
                    arrival,
                    departure,
                    platform: `PF ${Math.floor(Math.random() * 8) + 1}`,
                    delay: idx === 0 ? 0 : Math.random() > 0.7 ? Math.floor(Math.random() * 15) : 0,
                    latitude: st.latitude,
                    longitude: st.longitude
                });

                if (!isDest) {
                    currentMinutes += Math.floor(Math.random() * 60) + 120; // 2-3 hours travel
                }
            });

            // Dynamically name train
            const selectedType = trainTypes[Math.floor(Math.random() * trainTypes.length)];
            const suffix = nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)];
            const trainNumberStr = (12000 + i).toString();
            
            // e.g. "Delhi - Mumbai Shatabdi"
            const origCity = origStn.name.split(' ')[0];
            const destCity = destStn.name.split(' ')[0];
            const trainName = `${origCity.toUpperCase()} - ${destCity.toUpperCase()} ${suffix.toUpperCase()}`;

            trainsData.push({
                number: trainNumberStr,
                name: trainName,
                type: selectedType,
                routes: [{
                    source_station: { code: origStn.code, name: origStn.name },
                    destination_station: { code: destStn.code, name: destStn.name },
                    stops: stopsArray
                }],
                live_location: {
                    latitude: origStn.latitude,
                    longitude: origStn.longitude,
                    speed: 0,
                    current_station_id: origStn.code,
                    last_updated: new Date()
                }
            });
        }

        await Train.deleteMany({});
        const seededTrains = await Train.insertMany(trainsData);
        console.log(`Procedurally seeded ${seededTrains.length} unique express train lines successfully!`);

    } catch (error) {
        console.error('Error seeding scaled procedural database:', error);
    }
};
