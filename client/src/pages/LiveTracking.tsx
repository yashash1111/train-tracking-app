import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import api from '../services/api';
import { 
    Map, 
    ListTodo, 
    Navigation, 
    Signal, 
    AlertTriangle, 
    CheckCircle2, 
    Compass, 
    Play, 
    RefreshCw, 
    Info, 
    Bell, 
    BellOff,
    MessageCircle, 
    Share2, 
    Send,
    User,
    Layers,
    Volume2,
    UtensilsCrossed,
    Clock,
    ChefHat,
    ShoppingBag,
    Leaf
} from 'lucide-react';

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

interface Stop {
    stationName: string;
    code: string;
    arrival: string;
    departure: string;
    platform?: string; 
    delay?: number;    
    latitude: number;
    longitude: number;
}

interface Train {
    id: string;
    name: string;
    number: string;
    type: string;
    live_location?: LiveLocation;
    routes?: {
        source_station: { code: string; name: string };
        destination_station: { code: string; name: string };
        stops: Stop[];
    }[];
}

interface ChatMsg {
    _id?: string;
    trainId: string;
    username: string;
    message: string;
    timestamp: string;
}

interface FoodOrder {
    itemName: string;
    price: number;
    seatNumber: number;
    targetStopIndex: number;
    status: 'preparing' | 'transit' | 'delivering' | 'delivered';
}

const SOCKET_URL = 'http://localhost:5001';

export const LiveTracking = () => {
    const [trains, setTrains] = useState<Train[]>([]);
    const [selectedTrain, setSelectedTrain] = useState<Train | null>(null);
    const [viewMode, setViewMode] = useState<'timeline' | 'map'>('timeline');

    // Sidebar Active Tab
    const [sidebarTab, setSidebarTab] = useState<'simulator' | 'coach' | 'chat' | 'food'>('simulator');

    // Simulation States
    const [simulationMode, setSimulationMode] = useState<'internet' | 'gps'>('internet');
    const [simulatedCurrentStopIndex, setSimulatedCurrentStopIndex] = useState<number>(0);
    const [simulatedDelayMinutes, setSimulatedDelayMinutes] = useState<number>(0);
    const [simulatedSpeed, setSimulatedSpeed] = useState<number>(65);

    // Weather Simulation States
    const [weatherCondition, setWeatherCondition] = useState<'clear' | 'rain' | 'fog'>('clear');
    const [showWeatherRadar, setShowWeatherRadar] = useState(false);

    // Alarm States
    const [alarmStopIndex, setAlarmStopIndex] = useState<number | null>(null);
    const [showAlarmAlert, setShowAlarmAlert] = useState(false);
    const [alarmTriggeredStation, setAlarmTriggeredStation] = useState('');

    // Coach Seat States
    const [selectedCoach, setSelectedCoach] = useState('S1');
    const [seatQuery, setSeatQuery] = useState('');
    const [highlightedSeat, setHighlightedSeat] = useState<number | null>(null);

    // Food Order States
    const [activeOrder, setActiveOrder] = useState<FoodOrder | null>(null);

    // Live Passenger Chat States
    const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
    const [chatUsername, setChatUsername] = useState('');
    const [hasPickedName, setHasPickedName] = useState(false);
    const [newMessageText, setNewMessageText] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    const [socket, setSocket] = useState<any>(null);
    const [toastMessage, setToastMessage] = useState('');

    // Programmatically synthesize standard railway chime using HTML5 Web Audio API
    const playRailwayAlarmChime = () => {
        try {
            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
            const audioCtx = new AudioContextClass();
            
            const playTone = (freq: number, startTime: number, duration: number) => {
                const osc = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                
                osc.type = 'sine';
                osc.frequency.value = freq;
                
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
                
                osc.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                
                osc.start(startTime);
                osc.stop(startTime + duration);
            };
            
            const now = audioCtx.currentTime;
            playTone(392.00, now, 0.4);       
            playTone(523.25, now + 0.2, 0.4); 
            playTone(659.25, now + 0.4, 0.4); 
            playTone(783.99, now + 0.6, 0.8); 
        } catch (e) {
            console.error("Failed to play synthesized Web Audio alarm tone:", e);
        }
    };

    // Text-to-Speech Station Voice Announcer
    const triggerVoiceAnnouncement = (customIndex?: number) => {
        try {
            if (!('speechSynthesis' in window) || !selectedTrain || !selectedTrain.routes?.[0]) return;
            
            const targetIdx = customIndex !== undefined ? customIndex : simulatedCurrentStopIndex;
            const stops = selectedTrain.routes[0].stops;
            const currentStop = stops[targetIdx];
            const isLast = targetIdx === stops.length - 1;
            
            const trainNoSpaced = selectedTrain.number.split('').join(' ');
            const sourceCode = selectedTrain.routes[0].source_station.code;
            const destCode = selectedTrain.routes[0].destination_station.code;
            const platformNumber = currentStop.platform || 'PF 1';

            let announceText = '';
            if (isLast) {
                announceText = `May I have your attention please. Train number ${trainNoSpaced}, ${selectedTrain.name}, from ${sourceCode} to ${destCode}, has completed its journey and arrived at platform number ${platformNumber.replace(/\D/g, '')}.`;
            } else {
                announceText = `May I have your attention please. Train number ${trainNoSpaced}, ${selectedTrain.name}, from ${sourceCode} to ${destCode}, is arriving at platform number ${platformNumber.replace(/\D/g, '')} at ${currentStop.stationName}.`;
            }

            const utterance = new SpeechSynthesisUtterance(announceText);
            utterance.rate = 0.85; 
            utterance.pitch = 1.1; 
            
            const voices = window.speechSynthesis.getVoices();
            const matchedVoice = voices.find(voice => 
                voice.lang.includes('en') && (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('zira') || voice.name.toLowerCase().includes('samantha') || voice.name.toLowerCase().includes('google'))
            );
            if (matchedVoice) {
                utterance.voice = matchedVoice;
            }

            window.speechSynthesis.cancel(); 
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.error("Vocal announcer failed:", e);
        }
    };

    // Socket Connection Setup
    useEffect(() => {
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
        });

        newSocket.on('trainStatusSynced', (data: { trainId: string, currentStopIndex: number, delayMinutes: number, speed: number }) => {
            if (selectedTrain && selectedTrain.id === data.trainId) {
                setSimulatedCurrentStopIndex(data.currentStopIndex);
                setSimulatedDelayMinutes(data.delayMinutes);
                setSimulatedSpeed(data.speed);
                triggerVoiceAnnouncement(data.currentStopIndex);
            }
        });

        newSocket.on('newTrainChatMessage', (msg: ChatMsg) => {
            setChatMessages(prev => [...prev, msg]);
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
    }, [selectedTrain]);

    // Scroll Chat to Bottom on New Message
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Fetch Trains on Mount
    useEffect(() => {
        const fetchTrains = async () => {
            try {
                const res = await api.get<Train[]>('/trains');
                setTrains(res.data);
                
                const targetTrainId = localStorage.getItem('locateBerthTrainId');
                const targetCoach = localStorage.getItem('locateBerthCoach');
                const targetSeat = localStorage.getItem('locateBerthSeat');

                if (targetTrainId && targetCoach && targetSeat) {
                    const matched = res.data.find(t => t.id === targetTrainId);
                    if (matched) {
                        handleTrainClick(matched);
                        setSelectedCoach(targetCoach);
                        setSeatQuery(targetSeat);
                        setHighlightedSeat(parseInt(targetSeat));
                        setSidebarTab('coach');
                        
                        localStorage.removeItem('locateBerthTrainId');
                        localStorage.removeItem('locateBerthCoach');
                        localStorage.removeItem('locateBerthSeat');
                        
                        setTimeout(() => {
                            triggerToast(`Berth spotted from PNR ticket! Coach ${targetCoach} Seat ${targetSeat}`);
                        }, 1000);
                        return;
                    }
                }

                if (res.data.length > 0) {
                    handleTrainClick(res.data[0]);
                }
            } catch (error) {
                console.error('Failed to fetch trains', error);
            }
        };

        fetchTrains();
    }, []);

    // Sync Food Order Status during simulated Stop advances
    useEffect(() => {
        if (!activeOrder || !selectedTrain?.routes?.[0]) return;
        
        let newStatus = activeOrder.status;
        const currentIdx = simulatedCurrentStopIndex;
        const targetIdx = activeOrder.targetStopIndex;

        if (currentIdx < targetIdx) {
            newStatus = 'transit';
        } else if (currentIdx === targetIdx) {
            newStatus = 'delivering';
            triggerToast(`Catering agent boarding at ${selectedTrain.routes[0].stops[currentIdx].stationName} to deliver meal!`);
        } else {
            newStatus = 'delivered';
            triggerToast(`Meal delivered to Coach ${selectedCoach} Seat ${activeOrder.seatNumber}!`);
        }

        if (newStatus !== activeOrder.status) {
            setActiveOrder(prev => prev ? { ...prev, status: newStatus } : null);
        }
    }, [simulatedCurrentStopIndex]);

    // Train Selection Handler
    const handleTrainClick = async (train: Train) => {
        try {
            const res = await api.get<Train>(`/trains/${train.id}`);
            setSelectedTrain(res.data);
            
            setSimulatedCurrentStopIndex(0); 
            setSimulatedDelayMinutes(0);      
            setSimulatedSpeed(0);
            setAlarmStopIndex(null);
            setShowAlarmAlert(false);
            setActiveOrder(null);
            setWeatherCondition('clear');
            setShowWeatherRadar(false);

            if (socket) {
                socket.emit('joinTrainRoom', train.id);
            }

            const chatRes = await api.get<ChatMsg[]>(`/trains/${train.id}/chats`);
            setChatMessages(chatRes.data);

        } catch (error) {
            console.error("Failed to fetch train details", error);
            setSelectedTrain(train);
        }
    };

    // Advance intermediate station trigger
    const handleAdvanceSimulation = () => {
        if (!selectedTrain?.routes?.[0]) return;
        const stops = selectedTrain.routes[0].stops;
        const totalStops = stops.length;
        
        let nextIndex = simulatedCurrentStopIndex;
        if (simulatedCurrentStopIndex < totalStops - 1) {
            nextIndex = simulatedCurrentStopIndex + 1;
            setSimulatedCurrentStopIndex(nextIndex);
            
            const targetSpeed = nextIndex === totalStops - 1 ? 0 : Math.floor(Math.random() * 30) + 65;
            setSimulatedSpeed(targetSpeed);
        } else {
            nextIndex = 0;
            setSimulatedCurrentStopIndex(0);
            setSimulatedSpeed(0);
            setShowAlarmAlert(false);
        }

        const nextStop = stops[nextIndex];

        triggerVoiceAnnouncement(nextIndex);

        if (alarmStopIndex !== null && nextIndex === alarmStopIndex) {
            setAlarmTriggeredStation(nextStop.stationName);
            setShowAlarmAlert(true);
            playRailwayAlarmChime();
        }

        if (socket) {
            socket.emit('simulateTrainStatusUpdate', {
                trainId: selectedTrain.id,
                currentStopIndex: nextIndex,
                delayMinutes: simulatedDelayMinutes,
                speed: nextIndex === totalStops - 1 ? 0 : simulatedSpeed
            });
        }
    };

    // Add extra simulated delay
    const handleAddDelay = (mins: number) => {
        const newDelay = simulatedDelayMinutes + mins;
        setSimulatedDelayMinutes(newDelay);
        if (socket && selectedTrain) {
            socket.emit('simulateTrainStatusUpdate', {
                trainId: selectedTrain.id,
                currentStopIndex: simulatedCurrentStopIndex,
                delayMinutes: newDelay,
                speed: simulatedSpeed
            });
        }
    };

    // Trigger Alarm Set
    const handleToggleAlarm = (stopIdx: number) => {
        if (alarmStopIndex === stopIdx) {
            setAlarmStopIndex(null);
            triggerToast('Alarm canceled for selected station');
        } else {
            setAlarmStopIndex(stopIdx);
            const station = selectedTrain?.routes?.[0]?.stops[stopIdx]?.stationName || '';
            triggerToast(`Alarm active for arrival at ${station}`);
        }
    };

    // Highlight Coach seat
    const handleSearchSeat = (e: React.FormEvent) => {
        e.preventDefault();
        const num = parseInt(seatQuery);
        if (isNaN(num) || num < 1 || num > 72) {
            triggerToast('Please enter a valid seat number (1-72)');
            setHighlightedSeat(null);
        } else {
            setHighlightedSeat(num);
            triggerToast(`Highlighting Seat #${num} inside Coach ${selectedCoach}`);
        }
    };

    // Place Food Order
    const handleOrderFood = (itemName: string, price: number) => {
        if (!selectedTrain?.routes?.[0]) return;
        const totalStops = selectedTrain.routes[0].stops.length;
        
        const targetStop = Math.min(simulatedCurrentStopIndex + 1, totalStops - 1);
        const seat = highlightedSeat || 23;

        const order: FoodOrder = {
            itemName,
            price,
            seatNumber: seat,
            targetStopIndex: targetStop,
            status: 'preparing'
        };

        setActiveOrder(order);
        setSidebarTab('food');
        triggerToast(`Food ordered! Will deliver to seat ${seat} at ${selectedTrain.routes[0].stops[targetStop].stationName}`);
    };

    // Send Live Passenger Chat Message
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessageText.trim() || !selectedTrain) return;

        const name = chatUsername.trim() || 'Anonymous Passenger';

        try {
            const res = await api.post<ChatMsg>(`/trains/${selectedTrain.id}/chats`, {
                username: name,
                message: newMessageText
            });

            if (socket) {
                socket.emit('sendTrainChatMessage', res.data);
            }

            setNewMessageText('');
        } catch (err) {
            console.error('Failed to post live chat report', err);
        }
    };

    // Toast Alert Helper
    const triggerToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    };

    // Export status ticket
    const handleShareStatus = () => {
        if (!selectedTrain || !selectedTrain.routes?.[0]) return;
        const currentStop = selectedTrain.routes[0].stops[simulatedCurrentStopIndex];
        
        // Include Weather Surcharge Delays in calculated shares
        const weatherDelayOffset = weatherCondition === 'fog' ? 30 : weatherCondition === 'rain' ? 15 : 0;
        const delay = currentStop.delay! + simulatedDelayMinutes + weatherDelayOffset;

        const statusText = `🚂 NTES LIVE STATUS SPOTTER
Train: ${selectedTrain.name} (#${selectedTrain.number})
Current Spot: Near ${currentStop.stationName} (${currentStop.code})
Live Delay: ${delay > 0 ? `${delay} mins late` : 'On Time'}
Platform Allocation: ${currentStop.platform || 'PF 1'}
Tracking Mode: ${simulationMode === 'gps' ? 'GPS Sensor (Offline)' : 'Cell Tower (Net)'}
Current Speed: ${simulatedSpeed} km/h
Weather: ${weatherCondition === 'fog' ? 'Dense Winter Fog' : weatherCondition === 'rain' ? 'Monsoon Rain' : 'Clear Sky'}
-- Tracked via Train Track Spotter App --`;

        navigator.clipboard.writeText(statusText);
        triggerToast('Running status copied as Share Card!');
    };

    // Coach Seat Layout Render Configs
    const getBerthType = (seatNo: number) => {
        const mod = seatNo % 8;
        if (mod === 1 || mod === 4) return 'Lower (LB)';
        if (mod === 2 || mod === 5) return 'Middle (MB)';
        if (mod === 3 || mod === 6) return 'Upper (UB)';
        if (mod === 7) return 'Side Lower (SL)';
        return 'Side Upper (SU)';
    };

    const getSeatBg = (seatNo: number) => {
        if (highlightedSeat === seatNo) return 'bg-yellow-400 text-slate-950 border-yellow-300 shadow-lg glow-yellow scale-105';
        const mod = seatNo % 8;
        if (mod === 7 || mod === 0) return 'bg-slate-900/60 border-amber-600/30 hover:border-amber-500/50';
        return 'bg-slate-950/80 border-slate-800 hover:border-slate-700';
    };

    const activeStop = selectedTrain?.routes?.[0]?.stops?.[simulatedCurrentStopIndex] || null;

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-900 text-slate-100 relative">
            
            {/* Global Flash Toast */}
            {toastMessage && (
                <div className="absolute top-5 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500 text-slate-950 px-6 py-3 rounded-full font-mono text-xs font-bold shadow-2xl border border-yellow-400 tracking-wider animate-bounce">
                    📢 {toastMessage.toUpperCase()}
                </div>
            )}

            {/* Indian Railways Wake-up Alarm Dialog */}
            {showAlarmAlert && (
                <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
                    <Card className="max-w-md w-full border-yellow-500 bg-slate-950 text-slate-100 shadow-2xl border-2 overflow-hidden animate-pulse">
                        <CardHeader className="bg-yellow-500 text-slate-950 flex flex-row items-center gap-3">
                            <div className="h-10 w-10 bg-slate-950 text-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                                <Bell className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-mono font-bold tracking-wider">PROXIMITY WAKEUP ALARM</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 text-center space-y-4 font-mono">
                            <p className="text-sm text-slate-400">YOUR TRAIN HAS ARRIVED AT:</p>
                            <h2 className="text-2xl font-extrabold text-yellow-400 uppercase tracking-widest">{alarmTriggeredStation}</h2>
                            <p className="text-xs text-emerald-455 border border-emerald-405/20 px-3 py-1.5 rounded-lg bg-emerald-500/5">
                                coordinates verified successfully
                            </p>
                            <div className="pt-4">
                                <Button 
                                    onClick={() => setShowAlarmAlert(false)}
                                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold"
                                >
                                    ACKNOWLEDGE & SILENCE
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Display Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 z-10 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shadow-lg">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                        <h1 className="text-xl md:text-2xl font-bold font-mono text-yellow-400">NTES LIVE SPOTTER</h1>
                    </div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Real-time Spotting Dashboard & Social Feed</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto items-center">
                    {/* Weather radar scanner toggle */}
                    {viewMode === 'map' && selectedTrain && (
                        <button
                            onClick={() => {
                                setShowWeatherRadar(prev => !prev);
                                triggerToast(showWeatherRadar ? 'Weather Radar deactivated' : 'Live Precipitation Radar active!');
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold font-mono transition-all border ${
                                showWeatherRadar 
                                    ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 animate-pulse' 
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Leaf className="h-3.5 w-3.5" /> RADAR: {showWeatherRadar ? 'ON' : 'OFF'}
                        </button>
                    )}

                    {/* Toggle View Mode */}
                    <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 w-full md:w-auto">
                        <button
                            onClick={() => setViewMode('timeline')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'timeline' ? 'bg-yellow-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <ListTodo className="h-3.5 w-3.5" /> TIMELINE BOARD
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'map' ? 'bg-yellow-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <Map className="h-3.5 w-3.5" /> ROUTE MAP
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative z-0 flex flex-col lg:flex-row overflow-hidden">
                {/* 1. Main Viewport Area (Timeline or Map) */}
                <div className="flex-1 relative overflow-y-auto h-full p-4 lg:p-6 bg-slate-900/40">
                    {viewMode === 'timeline' ? (
                        selectedTrain?.routes?.[0] ? (
                            <div className="max-w-2xl mx-auto space-y-6 pb-20">
                                {/* Header Railway Board */}
                                <div className="bg-slate-950 border border-yellow-500/20 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-bold text-yellow-500 font-mono">#{selectedTrain.number}</div>
                                        <h2 className="text-xl font-bold text-slate-100 font-mono uppercase">{selectedTrain.name}</h2>
                                        <p className="text-xs text-slate-400 font-medium">Type: {selectedTrain.type}</p>
                                    </div>
                                    <div className="flex flex-col items-start md:items-end gap-2 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0 w-full md:w-auto">
                                        <div className="text-[10px] font-bold text-slate-500 font-mono flex items-center gap-1.5">
                                            SPOTTED STOP:
                                            <button 
                                                onClick={() => triggerVoiceAnnouncement()}
                                                className="p-1 rounded bg-slate-900 text-yellow-500 border border-slate-800 hover:bg-slate-800"
                                                title="Trigger Vocal Announcement"
                                            >
                                                <Volume2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <div className="text-sm font-mono text-emerald-400 font-bold uppercase">
                                            {selectedTrain.routes[0].stops[simulatedCurrentStopIndex].stationName}
                                        </div>
                                    </div>
                                    
                                    {/* Share Button */}
                                    <button 
                                        onClick={handleShareStatus}
                                        className="absolute top-4 right-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-yellow-500 p-2 rounded-lg transition-all"
                                        title="Copy Status Card"
                                    >
                                        <Share2 className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Actual Vertical Timeline Status Line */}
                                <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-6 relative shadow-2xl overflow-hidden">
                                    {/* Vertical Track Lines */}
                                    <div className="absolute left-[34px] top-[40px] bottom-[40px] w-[6px] rounded-full bg-slate-800 z-0"></div>
                                    {/* Active Track Highlight */}
                                    <div 
                                        className="absolute left-[34px] top-[40px] w-[6px] rounded-full timeline-track-active z-0 transition-all duration-700 ease-in-out"
                                        style={{ 
                                            height: `${(simulatedCurrentStopIndex / (selectedTrain.routes[0].stops.length - 1)) * 90}%`
                                        }}
                                    ></div>

                                    <div className="space-y-8 relative z-10 font-mono">
                                        {selectedTrain.routes[0].stops.map((stop, idx) => {
                                            const isPassed = idx <= simulatedCurrentStopIndex;
                                            const isCurrent = idx === simulatedCurrentStopIndex;
                                            const isAlarmSet = alarmStopIndex === idx;

                                            // Apply weather visibility delay surcharges
                                            const weatherDelayOffset = weatherCondition === 'fog' ? 30 : weatherCondition === 'rain' ? 15 : 0;
                                            const actualDelay = stop.delay! + (idx >= simulatedCurrentStopIndex ? simulatedDelayMinutes + weatherDelayOffset : 0);

                                            return (
                                                <div key={idx} className="flex gap-6 items-start relative group animate-fadeIn">
                                                    {/* Timeline Node Station Ring */}
                                                    <div className="relative pt-3.5">
                                                        <div className={`h-6 w-6 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                                                            isCurrent 
                                                                ? 'border-yellow-500 bg-slate-950 h-7 w-7 -ml-[1.5px] glow-yellow' 
                                                                : isPassed 
                                                                    ? 'border-emerald-500 bg-emerald-500' 
                                                                    : 'border-slate-700 bg-slate-950'
                                                        }`}>
                                                            {isCurrent && (
                                                                <div className="h-2 w-2 rounded-full bg-yellow-500 animate-ping"></div>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Sliding Dynamic Train icon */}
                                                        {isCurrent && (
                                                            <div className="absolute -left-1.5 top-2.5 h-10 w-10 bg-yellow-500 text-slate-950 rounded-full flex items-center justify-center shadow-lg border border-yellow-400 font-bold z-20 animate-bounce">
                                                                🚂
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Station Details */}
                                                    <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2 p-4 rounded-2xl border border-slate-900 bg-slate-950/40 hover:bg-slate-950/80 hover:border-slate-800 transition-all">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono font-bold text-yellow-500 text-[10px] bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                                                                    {stop.code}
                                                                </span>
                                                                <h4 className={`font-bold font-mono text-sm md:text-base ${isCurrent ? 'text-yellow-400' : isPassed ? 'text-slate-200' : 'text-slate-500'}`}>
                                                                    {stop.stationName}
                                                                </h4>
                                                            </div>
                                                            <div className="text-xs text-slate-500 flex gap-4 mt-2">
                                                                <span>Arr: <span className="text-slate-355 font-semibold">{stop.arrival}</span></span>
                                                                <span>Dep: <span className="text-slate-355 font-semibold">{stop.departure}</span></span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between md:justify-end gap-3.5 border-t md:border-t-0 border-slate-900 pt-2.5 md:pt-0">
                                                            {/* Platform Info */}
                                                            <div className="text-xs font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                                                                {stop.platform || 'PF 1'}
                                                            </div>

                                                            {/* Proximity Alarm Bell Switch */}
                                                            <button
                                                                onClick={() => handleToggleAlarm(idx)}
                                                                disabled={isPassed && !isCurrent}
                                                                className={`p-1.5 rounded-lg border transition-all ${
                                                                    isAlarmSet 
                                                                        ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500 animate-swing' 
                                                                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-350'
                                                                }`}
                                                                title={isAlarmSet ? "Cancel Proximity Alarm" : "Set Proximity Alarm"}
                                                            >
                                                                {isAlarmSet ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                                                            </button>

                                                            {/* Real-time Delay indicators */}
                                                            <div className="min-w-[90px] text-right">
                                                                {actualDelay > 0 ? (
                                                                    <span className="text-xs font-bold text-rose-500 flex items-center justify-end gap-1">
                                                                        <AlertTriangle className="h-3.5 w-3.5" /> {actualDelay}m late
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
                                                                        <CheckCircle2 className="h-3.5 w-3.5" /> On Time
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3 border border-dashed border-slate-800 rounded-3xl p-6 bg-slate-955/20 max-w-xl mx-auto">
                                <Info className="h-8 w-8 text-slate-600 animate-pulse" />
                                <p className="text-sm font-semibold">Select a Train from the Spotter Sidebar to inspect Live Timelines.</p>
                            </div>
                        )
                    ) : (
                        /* High-Fidelity Geographical Route Map */
                        <div className="h-[90%] w-full rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative z-0">
                            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
                                />
                                
                                {/* 1. Pulsing Weather Radar Circle overlays */}
                                {showWeatherRadar && activeStop && (
                                    <>
                                        <Circle 
                                            center={[activeStop.latitude, activeStop.longitude]} 
                                            radius={65000} 
                                            pathOptions={{ 
                                                fillColor: weatherCondition === 'fog' ? '#94a3b8' : weatherCondition === 'rain' ? '#10b981' : '#6b7280', 
                                                color: weatherCondition === 'fog' ? '#64748b' : weatherCondition === 'rain' ? '#059669' : '#4b5563', 
                                                fillOpacity: 0.18, 
                                                weight: 1.5 
                                            }}
                                        />
                                        <Circle 
                                            center={[activeStop.latitude + 0.6, activeStop.longitude - 0.5]} 
                                            radius={95000} 
                                            pathOptions={{ 
                                                fillColor: weatherCondition === 'fog' ? '#94a3b8' : weatherCondition === 'rain' ? '#10b981' : '#6b7280', 
                                                color: weatherCondition === 'fog' ? '#64748b' : weatherCondition === 'rain' ? '#059669' : '#4b5563', 
                                                fillOpacity: 0.12, 
                                                weight: 1.2 
                                            }}
                                        />
                                    </>
                                )}

                                {/* 2. Active Spotter Markers */}
                                {trains.map(train => {
                                    const aStop = train.routes?.[0]?.stops[train.id === selectedTrain?.id ? simulatedCurrentStopIndex : 0];
                                    const lat = aStop ? aStop.latitude : (train.live_location?.latitude || 20.5937);
                                    const lng = aStop ? aStop.longitude : (train.live_location?.longitude || 78.9629);

                                    return (
                                        <Marker
                                            key={train.id}
                                            position={[lat, lng]}
                                            eventHandlers={{
                                                click: () => handleTrainClick(train)
                                            }}
                                        >
                                            <Popup className="dark-leaflet-popup">
                                                <div className="p-2 min-w-[200px] text-slate-100 font-mono">
                                                    <h3 className="font-bold text-sm text-yellow-400 uppercase">{train.name}</h3>
                                                    <div className="text-[10px] text-slate-400 mb-2">#{train.number} • {train.type}</div>
                                                    <div className="space-y-1 text-xs">
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Active Stop:</span>
                                                            <span className="font-bold text-slate-200">{aStop?.stationName || 'NDLS'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Speed:</span>
                                                            <span className="font-bold text-yellow-500">{train.id === selectedTrain?.id ? simulatedSpeed : (train.live_location?.speed || 0)} km/h</span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        className="w-full mt-3 bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold"
                                                        onClick={() => {
                                                            handleTrainClick(train);
                                                            setViewMode('timeline');
                                                        }}
                                                    >
                                                        View Live Timeline
                                                    </Button>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    );
                                })}
                            </MapContainer>
                        </div>
                    )}
                </div>

                {/* 2. Right Interactive Simulation & Train Spotting Sidebar */}
                <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950 flex flex-col h-full lg:max-h-full overflow-hidden">
                    {selectedTrain ? (
                        <div className="flex flex-col h-full overflow-hidden divide-y divide-slate-800">
                            {/* Selected Train Header */}
                            <div className="p-4 flex justify-between items-center bg-slate-900/50">
                                <div>
                                    <span className="text-[10px] font-bold text-yellow-500 font-mono">#{selectedTrain.number}</span>
                                    <h3 className="font-bold font-mono text-sm uppercase text-slate-200">{selectedTrain.name}</h3>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setSelectedTrain(null)}
                                    className="text-xs text-slate-400 hover:text-slate-200 border border-slate-800 h-8"
                                >
                                    CLOSE
                                </Button>
                            </div>

                            {/* Sidebar Tab Selector */}
                            <div className="grid grid-cols-4 p-1 bg-slate-950 border-b border-slate-800">
                                <button
                                    onClick={() => setSidebarTab('simulator')}
                                    className={`py-2 text-[9px] font-bold font-mono tracking-wider transition-all uppercase rounded-lg ${sidebarTab === 'simulator' ? 'bg-yellow-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    Control
                                </button>
                                <button
                                    onClick={() => setSidebarTab('coach')}
                                    className={`py-2 text-[9px] font-bold font-mono tracking-wider transition-all uppercase rounded-lg ${sidebarTab === 'coach' ? 'bg-yellow-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    Coach
                                </button>
                                <button
                                    onClick={() => setSidebarTab('chat')}
                                    className={`py-2 text-[9px] font-bold font-mono tracking-wider transition-all uppercase rounded-lg ${sidebarTab === 'chat' ? 'bg-yellow-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    Chat
                                </button>
                                <button
                                    onClick={() => setSidebarTab('food')}
                                    className={`py-2 text-[9px] font-bold font-mono tracking-wider transition-all uppercase rounded-lg ${sidebarTab === 'food' ? 'bg-yellow-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    Food
                                </button>
                            </div>

                            {/* Sidebar Body */}
                            <div className="flex-1 overflow-y-auto">
                                
                                /* ================= TAB A: SIMULATOR PANEL ================= */
                                {sidebarTab === 'simulator' && (
                                    <div className="p-4 space-y-5">
                                        
                                        {/* Speedometer & Radar Triangulator Widgets Grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            
                                            {/* Circular SVG Speedometer Gauge */}
                                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col items-center justify-center font-mono">
                                                <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Live Speed</div>
                                                <div className="relative h-20 w-20 flex items-center justify-center">
                                                    <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 100 100">
                                                        <circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                                                        <circle 
                                                            cx="50" 
                                                            cy="50" 
                                                            r="40" 
                                                            stroke="#eab308" 
                                                            strokeWidth="8" 
                                                            fill="transparent" 
                                                            strokeDasharray={2 * Math.PI * 40}
                                                            strokeDashoffset={(2 * Math.PI * 40) - (Math.min(simulatedSpeed / 120, 1) * (2 * Math.PI * 40))}
                                                            className="transition-all duration-700 ease-out"
                                                            strokeLinecap="round"
                                                        />
                                                    </svg>
                                                    <div className="flex flex-col items-center z-10">
                                                        <span className="text-base font-extrabold text-slate-100">{simulatedSpeed}</span>
                                                        <span className="text-[8px] text-slate-400 uppercase">km/h</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Pulsing GPS/Cell Triangulation Radar Sweeper */}
                                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col items-center justify-center font-mono relative overflow-hidden">
                                                <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Sensor Lock</div>
                                                <div className="relative h-20 w-20 flex items-center justify-center">
                                                    <div className="absolute inset-0 border border-emerald-500/20 rounded-full flex items-center justify-center">
                                                        <div className="h-16 w-16 border border-emerald-500/40 rounded-full flex items-center justify-center">
                                                            <div className="h-10 w-10 border border-emerald-500/60 rounded-full animate-ping"></div>
                                                        </div>
                                                    </div>
                                                    <div className="absolute h-10 w-0.5 bg-emerald-500 origin-bottom bottom-10 animate-spin z-0"></div>
                                                    <div className="z-10 bg-slate-950 border border-emerald-500/40 h-8 w-8 rounded-full flex items-center justify-center text-emerald-400 shadow-md">
                                                        {simulationMode === 'gps' ? <Navigation className="h-4 w-4 animate-pulse" /> : <Signal className="h-4 w-4" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dynamic Simulated Weather Selector widget */}
                                        <div className="space-y-2 font-mono">
                                            <div className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">
                                                <span>METEOROLOGICAL VISIBILITY</span>
                                                {weatherCondition !== 'clear' && (
                                                    <span className="text-rose-500 animate-pulse font-extrabold">🚨 DELAYS SURCHARGED</span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-[9px] font-bold">
                                                <button
                                                    onClick={() => { setWeatherCondition('clear'); triggerToast('Weather cleared. Normal timetables active.'); }}
                                                    className={`py-2 rounded-lg transition-all ${weatherCondition === 'clear' ? 'bg-yellow-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                                                >
                                                    ☀️ CLEAR
                                                </button>
                                                <button
                                                    onClick={() => { setWeatherCondition('rain'); triggerToast('Monsoon Rain active. Dynamic +15m delay applied.'); }}
                                                    className={`py-2 rounded-lg transition-all ${weatherCondition === 'rain' ? 'bg-yellow-500 text-slate-950 shadow-md animate-pulse' : 'text-slate-400 hover:text-slate-200'}`}
                                                >
                                                    🌧️ RAIN (+15)
                                                </button>
                                                <button
                                                    onClick={() => { setWeatherCondition('fog'); triggerToast('Dense Fog active. Visibility low. Dynamic +30m delay applied.'); }}
                                                    className={`py-2 rounded-lg transition-all ${weatherCondition === 'fog' ? 'bg-yellow-500 text-slate-950 shadow-md animate-pulse' : 'text-slate-400 hover:text-slate-200'}`}
                                                >
                                                    🌫️ FOG (+30)
                                                </button>
                                            </div>
                                        </div>

                                        {/* Tracking Mode Selection */}
                                        <div className="space-y-2">
                                            <div className="text-[10px] font-bold text-slate-500 font-mono uppercase">Tracking Feed Mode</div>
                                            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
                                                <button
                                                    onClick={() => setSimulationMode('internet')}
                                                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[9px] font-bold tracking-wider transition-all uppercase font-mono ${simulationMode === 'internet' ? 'bg-yellow-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                                                >
                                                    <Signal className="h-3 w-3" /> CELL TOWER
                                                </button>
                                                <button
                                                    onClick={() => setSimulationMode('gps')}
                                                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[9px] font-bold tracking-wider transition-all uppercase font-mono ${simulationMode === 'gps' ? 'bg-yellow-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                                                >
                                                    <Navigation className="h-3 w-3" /> GPS SENSOR
                                                </button>
                                            </div>
                                        </div>

                                        {/* Simulation Metadata */}
                                        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4.5 space-y-2.5 text-xs font-mono">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Source:</span>
                                                <span className="font-bold text-slate-200">{selectedTrain.routes?.[0]?.source_station.code}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Destination:</span>
                                                <span className="font-bold text-slate-200">{selectedTrain.routes?.[0]?.destination_station.code}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">GPS Signal:</span>
                                                <span className="font-bold text-emerald-400">Locked (5 Sats)</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Next stop:</span>
                                                <span className="font-bold text-yellow-400 truncate max-w-[130px]">
                                                    {selectedTrain.routes?.[0]?.stops[Math.min(simulatedCurrentStopIndex + 1, selectedTrain.routes[0].stops.length - 1)].stationName}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action Triggers */}
                                        <div className="space-y-3 pt-2">
                                            <Button
                                                onClick={handleAdvanceSimulation}
                                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-11 shadow-lg"
                                            >
                                                <Play className="h-4 w-4 mr-2" /> ADVANCE TO NEXT STOP
                                            </Button>

                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleAddDelay(5)}
                                                    size="sm"
                                                    className="flex-1 bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-rose-455 text-[10px] font-bold h-10 font-mono"
                                                >
                                                    +5m Delay
                                                </Button>
                                                <Button
                                                    onClick={() => handleAddDelay(15)}
                                                    size="sm"
                                                    className="flex-1 bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-rose-455 text-[10px] font-bold h-10 font-mono"
                                                >
                                                    +15m Delay
                                                </Button>
                                                <Button
                                                    onClick={() => setSimulatedDelayMinutes(0)}
                                                    size="sm"
                                                    className="bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-400 text-[10px] font-bold h-10 px-3"
                                                    title="Clear Delay"
                                                >
                                                    <RefreshCw className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                /* ================= TAB B: COACH LAYOUT PANEL ================= */
                                {sidebarTab === 'coach' && (
                                    <div className="p-4 space-y-5 font-mono">
                                        <div className="space-y-2">
                                            <div className="text-[10px] font-bold text-slate-500 uppercase">Interactive Coach queue</div>
                                            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-900">
                                                {['ENG', 'GEN1', 'S1', 'S2', 'B1', 'B2', 'A1', 'GEN2'].map((coach) => (
                                                    <button
                                                        key={coach}
                                                        onClick={() => {
                                                            setSelectedCoach(coach);
                                                            setHighlightedSeat(null);
                                                            setSeatQuery('');
                                                        }}
                                                        className={`flex-none px-3.5 py-2 text-[10px] font-bold border rounded-lg transition-all ${
                                                            selectedCoach === coach 
                                                                ? 'bg-yellow-500 border-yellow-500 text-slate-950 shadow-md font-extrabold' 
                                                                : 'bg-slate-900 border-slate-855 text-slate-400 hover:text-slate-200'
                                                        }`}
                                                    >
                                                        {coach}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {selectedCoach === 'ENG' ? (
                                            <div className="text-center py-10 text-slate-500 text-xs italic">
                                                Locomotive Section - Seat Spottings Disabled
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <form onSubmit={handleSearchSeat} className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <input 
                                                            type="text" 
                                                            placeholder="Enter seat number (1-72)"
                                                            value={seatQuery}
                                                            onChange={(e) => setSeatQuery(e.target.value)}
                                                            className="w-full h-10 border border-slate-800 bg-slate-950 rounded-lg px-3.5 text-xs text-yellow-455 focus:outline-none placeholder:text-slate-655"
                                                        />
                                                    </div>
                                                    <Button type="submit" size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold px-4">
                                                        FIND
                                                    </Button>
                                                </form>

                                                {highlightedSeat !== null && (
                                                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/25 rounded-xl text-xs space-y-1 animate-slideDown">
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-455">Seat/Berth:</span>
                                                            <span className="font-bold text-yellow-455">Seat {highlightedSeat} ({selectedCoach})</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-455">Berth Profile:</span>
                                                            <span className="font-bold text-yellow-500">{getBerthType(highlightedSeat)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="space-y-2.5">
                                                    <div className="text-[10px] font-bold text-slate-505 uppercase flex justify-between">
                                                        <span>Coach Layout ({selectedCoach})</span>
                                                        <span>1-72 Berths</span>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-4 gap-1.5 max-h-[300px] overflow-y-auto p-2 border border-slate-900 bg-slate-955/20 rounded-2xl">
                                                        {Array.from({ length: 72 }, (_, i) => i + 1).map((seat) => (
                                                            <div
                                                                key={seat}
                                                                onClick={() => {
                                                                    setHighlightedSeat(seat);
                                                                    setSeatQuery(seat.toString());
                                                                }}
                                                                className={`h-9 border flex items-center justify-center text-[10px] font-bold rounded cursor-pointer transition-all ${getSeatBg(seat)}`}
                                                            >
                                                                {seat}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                /* ================= TAB C: SOCIAL CHAT PANEL ================= */
                                {sidebarTab === 'chat' && (
                                    <div className="flex flex-col h-[400px] font-mono animate-fadeIn">
                                        {!hasPickedName ? (
                                            <div className="p-4 space-y-4 my-auto">
                                                <div className="text-center space-y-1.5">
                                                    <User className="h-8 w-8 text-yellow-505 mx-auto" />
                                                    <h4 className="text-xs font-bold text-slate-200">PASSENGER SPOTTER BOARD</h4>
                                                    <p className="text-[10px] text-slate-505">Pick a nickname to share live delay updates and announcements with other observers.</p>
                                                </div>
                                                <form onSubmit={(e) => { e.preventDefault(); if (chatUsername.trim()) setHasPickedName(true); }} className="space-y-3">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Enter passenger nickname..."
                                                        value={chatUsername}
                                                        onChange={(e) => setChatUsername(e.target.value)}
                                                        className="w-full h-11 border border-slate-800 bg-slate-950 rounded-lg px-4 text-xs text-yellow-455 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                                                        maxLength={20}
                                                        required
                                                    />
                                                    <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold text-xs h-10">
                                                        JOIN SOCIAL FEED
                                                    </Button>
                                                </form>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col h-full overflow-hidden">
                                                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 max-h-[300px]">
                                                    {chatMessages.length === 0 ? (
                                                        <div className="text-center py-12 text-slate-655 text-[10px] italic">
                                                            No passenger updates active yet. Share one below!
                                                        </div>
                                                    ) : (
                                                        chatMessages.map((msg, idx) => (
                                                            <div key={idx} className="space-y-1">
                                                                <div className="flex justify-between items-center text-[9px] text-slate-505">
                                                                    <span className="font-extrabold text-yellow-500/80">{msg.username}</span>
                                                                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                </div>
                                                                <div className="bg-slate-900 border border-slate-850 px-3.5 py-2 rounded-xl text-xs text-slate-200 break-words">
                                                                    {msg.message}
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                    <div ref={chatEndRef} />
                                                </div>

                                                <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-900 bg-slate-955/40 flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        placeholder={`Post update as ${chatUsername}...`}
                                                        value={newMessageText}
                                                        onChange={(e) => setNewMessageText(e.target.value)}
                                                        className="flex-1 h-10 border border-slate-800 bg-slate-950 rounded-lg px-3.5 text-xs text-yellow-455 focus:outline-none"
                                                        maxLength={150}
                                                        required
                                                    />
                                                    <button type="submit" className="h-10 w-10 bg-yellow-500 hover:bg-yellow-600 text-slate-950 rounded-lg flex items-center justify-center">
                                                        <Send className="h-4 w-4" />
                                                    </button>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                )}

                                /* ================= TAB D: FOOD ORDER PANEL ================= */
                                {sidebarTab === 'food' && (
                                    <div className="p-4 space-y-5 font-mono animate-fadeIn">
                                        <div className="text-[10px] font-bold text-slate-505 uppercase flex justify-between items-center border-b border-slate-900 pb-2">
                                            <span>IRCTC Rail-Food Menu</span>
                                            <span className="text-[9px] text-yellow-500 font-bold bg-yellow-500/10 px-1.5 py-0.5 rounded">DELIVERING TO SEAT</span>
                                        </div>

                                        {activeOrder ? (
                                            <div className="space-y-4 animate-slideDown">
                                                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-900 space-y-3.5 relative overflow-hidden">
                                                    <div className="h-1 w-full bg-slate-900 absolute top-0 left-0">
                                                        <div className={`h-full bg-yellow-500 transition-all duration-700 ${
                                                            activeOrder.status === 'preparing' ? 'w-1/4' :
                                                            activeOrder.status === 'transit' ? 'w-2/4' :
                                                            activeOrder.status === 'delivering' ? 'w-3/4' : 'w-full'
                                                        }`} />
                                                    </div>

                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="text-xs font-bold text-slate-200 uppercase">{activeOrder.itemName}</h4>
                                                            <p className="text-[9px] text-slate-555">Seat #{activeOrder.seatNumber} • Coach {selectedCoach}</p>
                                                        </div>
                                                        <span className="text-xs font-bold text-yellow-500">₹{activeOrder.price}</span>
                                                    </div>

                                                    <div className="space-y-3 pt-2 text-[10px]">
                                                        <div className="flex items-center gap-3">
                                                            <ChefHat className={`h-4 w-4 ${activeOrder.status === 'preparing' ? 'text-yellow-500 animate-pulse' : 'text-slate-655'}`} />
                                                            <span className={activeOrder.status === 'preparing' ? 'text-yellow-400 font-bold' : 'text-slate-455'}>
                                                                Kitchen preparing food
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <ShoppingBag className={`h-4 w-4 ${activeOrder.status === 'transit' ? 'text-yellow-500 animate-pulse' : 'text-slate-655'}`} />
                                                            <span className={activeOrder.status === 'transit' ? 'text-yellow-400 font-bold' : 'text-slate-455'}>
                                                                In Transit to station
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <Clock className={`h-4 w-4 ${activeOrder.status === 'delivering' ? 'text-yellow-500 animate-bounce' : 'text-slate-655'}`} />
                                                            <span className={activeOrder.status === 'delivering' ? 'text-yellow-400 font-bold' : 'text-slate-455'}>
                                                                Out for seat delivery at next stop
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <CheckCircle2 className={`h-4 w-4 ${activeOrder.status === 'delivered' ? 'text-emerald-500' : 'text-slate-655'}`} />
                                                            <span className={activeOrder.status === 'delivered' ? 'text-emerald-400 font-bold' : 'text-slate-455'}>
                                                                Meal Placed on Seat! Enjoy!
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => setActiveOrder(null)} 
                                                    className="w-full text-slate-555 border-slate-900 hover:border-slate-800 hover:text-slate-355 text-[10px]"
                                                >
                                                    ORDER ANOTHER MEAL
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="grid gap-3.5">
                                                    {[
                                                        { name: 'Railway Chai & Samosa', price: 45, desc: 'Hot cardamon milk tea with 2 potato samosas.' },
                                                        { name: 'IRCTC Veg Biryani plate', price: 120, desc: 'Aromatic basmati rice served with raita.' },
                                                        { name: 'South Indian Masala Dosa', price: 90, desc: 'Crispy rice crepe filled with potato masala.' },
                                                        { name: 'Royal Indian Veg Thali', price: 150, desc: 'Paneer sabji, dal fry, roti, rice, and sweet gulab jamun.' }
                                                    ].map((item) => (
                                                        <div key={item.name} className="p-3 bg-slate-900/60 border border-slate-900 hover:border-slate-800 rounded-2xl transition-all flex flex-col justify-between gap-2.5 animate-fadeIn">
                                                            <div>
                                                                <div className="flex justify-between items-start">
                                                                    <h4 className="text-xs font-bold text-slate-202 uppercase">{item.name}</h4>
                                                                    <span className="text-xs font-bold text-yellow-500">₹{item.price}</span>
                                                                </div>
                                                                <p className="text-[10px] text-slate-505 mt-1">{item.desc}</p>
                                                            </div>
                                                            <Button 
                                                                onClick={() => handleOrderFood(item.name, item.price)}
                                                                size="sm" 
                                                                className="w-full h-8 text-[9px] bg-slate-950 border border-slate-800 hover:border-yellow-500/40 text-slate-300 font-bold uppercase tracking-wider"
                                                            >
                                                                <UtensilsCrossed className="h-3 w-3 mr-1.5" /> Order to Berth #{highlightedSeat || 23}
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full divide-y divide-slate-800">
                            {/* Board Header */}
                            <div className="p-4 bg-slate-900/30 font-mono">
                                <h3 className="font-bold text-sm text-yellow-400 tracking-wider">TRAIN SPOTTER BOARD</h3>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                    {trains.length} Active Timelines Spotted
                                </p>
                            </div>

                            {/* Train Spotter List */}
                            <div className="flex-1 overflow-y-auto divide-y divide-slate-900 font-mono">
                                {trains.length === 0 ? (
                                    <div className="p-8 text-center text-slate-655 text-xs">
                                        No spotted schedules active.
                                    </div>
                                ) : (
                                    trains.map(train => (
                                        <div
                                            key={train.id}
                                            className="p-4 hover:bg-slate-900/60 transition-colors cursor-pointer flex flex-col gap-1.5 group"
                                            onClick={() => handleTrainClick(train)}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-xs text-yellow-500 group-hover:text-yellow-400">
                                                    #{train.number}
                                                </span>
                                                <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/25">
                                                    ACTIVE
                                                </span>
                                            </div>
                                            <div className="text-sm font-bold text-slate-300 group-hover:text-yellow-400 transition-colors uppercase truncate">
                                                {train.name}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
