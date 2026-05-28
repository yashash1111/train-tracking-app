import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import api from '../services/api';

// Fix Leaflet marker icon issue
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LiveLocation {
    train_id: string;
    latitude: number;
    longitude: number;
    speed: number;
    current_station_id?: string;
    last_updated: string;
}

interface Train {
    id: string;
    name: string;
    number: string;
    type: string;
    live_location?: LiveLocation;
    routes?: any[];
}

const SOCKET_URL = 'http://localhost:5001';

export const LiveTracking = () => {
    const [trains, setTrains] = useState<Train[]>([]);
    const [selectedTrain, setSelectedTrain] = useState<Train | null>(null);

    useEffect(() => {
        // strict mode double invocation handling
        const newSocket = io(SOCKET_URL);

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
        });

        // Listen for global updates or specific train updates
        newSocket.on('trainLocationUpdate', (location: LiveLocation) => {
            setTrains(prev => prev.map(train =>
                train.id === location.train_id
                    ? { ...train, live_location: location }
                    : train
            ));
        });

        newSocket.on('globalTrainUpdate', (data: { trainId: string, location: LiveLocation }) => {
            setTrains(prev => prev.map(train =>
                train.id === data.trainId
                    ? { ...train, live_location: data.location }
                    : train
            ));
        });

        return () => {
            newSocket.close();
        };
    }, []);

    useEffect(() => {
        const fetchTrains = async () => {
            try {
                const res = await api.get<Train[]>('/trains');
                setTrains(res.data);
            } catch (error) {
                console.error('Failed to fetch trains', error);
            }
        };

        fetchTrains();
    }, []);

    const handleTrainClick = async (train: Train) => {
        try {
            // Fetch fresh data including full route info
            const res = await api.get<Train>(`/trains/${train.id}`);
            setSelectedTrain(res.data);
        } catch (error) {
            console.error("Failed to fetch train details", error);
            setSelectedTrain(train); // Fallback
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)]">
            <div className="p-4 bg-background border-b z-10 flex justify-between items-center shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold">Live Train Map</h1>
                    <p className="text-muted-foreground">Real-time location updates</p>
                </div>
                <div className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full animate-pulse">
                    ● Live Connected
                </div>
            </div>

            <div className="flex-1 relative z-0 flex">
                <div className="flex-1 relative">
                    <MapContainer center={[12.9716, 77.5946]} zoom={8} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {trains.map(train => (
                            train.live_location ? (
                                <Marker
                                    key={train.id}
                                    position={[train.live_location.latitude, train.live_location.longitude]}
                                    eventHandlers={{
                                        click: () => handleTrainClick(train)
                                    }}
                                >
                                    <Popup>
                                        <div className="p-2 min-w-[200px]">
                                            <h3 className="font-bold text-lg">{train.name}</h3>
                                            <div className="text-sm text-gray-600 mb-2">{train.number} - {train.type}</div>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Speed:</span>
                                                    <span className="font-medium">{train.live_location.speed} km/h</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Last Updated:</span>
                                                    <span>{new Date(train.live_location.last_updated).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                className="w-full mt-3"
                                                onClick={() => handleTrainClick(train)}
                                            >
                                                View Route & Timing
                                            </Button>
                                        </div>
                                    </Popup>
                                </Marker>
                            ) : null
                        ))}
                    </MapContainer>
                </div>

                {/* Sidebar / Overlay for List & Details */}
                <Card className={`absolute top-4 right-4 w-96 z-[1000] max-h-[90%] overflow-hidden flex flex-col backdrop-blur-sm bg-background/95 transition-all duration-300 ${selectedTrain ? 'translate-x-0' : 'translate-x-0'}`}>
                    {selectedTrain ? (
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b flex justify-between items-center bg-muted/30">
                                <div>
                                    <h3 className="font-bold text-lg">{selectedTrain.name}</h3>
                                    <p className="text-xs text-muted-foreground">{selectedTrain.number} • {selectedTrain.type}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedTrain(null)}>Close</Button>
                            </div>
                            <div className="p-0 overflow-y-auto flex-1">
                                {selectedTrain.routes && selectedTrain.routes[0] ? (
                                    <div className="p-4 space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium">{selectedTrain.routes[0].source_station.code}</span>
                                            <div className="h-[2px] flex-1 bg-border mx-2 relative">
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-1 text-[10px] text-muted-foreground">
                                                    Route
                                                </div>
                                            </div>
                                            <span className="font-medium">{selectedTrain.routes[0].destination_station.code}</span>
                                        </div>

                                        <div className="space-y-4 relative pl-4 border-l-2 border-muted ml-2">
                                            {(selectedTrain.routes[0].stops as any[]).map((stop: any, idx: number) => (
                                                <div key={idx} className="relative">
                                                    <div className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background"></div>
                                                    <div className="text-sm font-medium">{stop.stationName} ({stop.code})</div>
                                                    <div className="text-xs text-muted-foreground flex gap-3 mt-1">
                                                        <span>Arr: <span className="text-foreground">{stop.arrival}</span></span>
                                                        <span>Dep: <span className="text-foreground">{stop.departure}</span></span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-muted-foreground text-sm">
                                        No route information available.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b">
                                <h3 className="font-semibold">Active Trains</h3>
                                <p className="text-xs text-muted-foreground">{trains.filter(t => t.live_location).length} trains running</p>
                            </div>
                            <div className="overflow-y-auto flex-1">
                                {trains.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground text-sm">No active trains found.</div>
                                ) : (
                                    <div className="divide-y">
                                        {trains.map(train => (
                                            <div
                                                key={train.id}
                                                className="p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                                                onClick={() => {
                                                    handleTrainClick(train);
                                                    // Also center map implies logic not shown here for brevity
                                                }}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-medium text-sm">{train.number}</span>
                                                    {train.live_location ? (
                                                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                                                            {train.live_location.speed} km/h
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Offline</span>
                                                    )}
                                                </div>
                                                <div className="text-xs font-medium text-muted-foreground truncate">{train.name}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};
