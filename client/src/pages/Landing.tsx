import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { 
    MapPin, 
    Clock, 
    ShieldCheck, 
    ArrowRight, 
    TrainFront, 
    Award, 
    Zap, 
    Play, 
    Volume2, 
    Compass, 
    Layers, 
    QrCode, 
    Cpu, 
    Sparkles, 
    Leaf, 
    User, 
    Check, 
    Info, 
    Music, 
    Milestone,
    Flame,
    ArrowUpRight
} from 'lucide-react';

interface StationNode {
    code: string;
    name: string;
    latitude: number;
    longitude: number;
}

const POPULAR_HUBS: StationNode[] = [
    { code: 'NDLS', name: 'New Delhi Junction', latitude: 28.6430, longitude: 77.2223 },
    { code: 'BPL', name: 'Bhopal Junction', latitude: 23.2599, longitude: 77.4126 },
    { code: 'NGP', name: 'Nagpur Junction', latitude: 21.1500, longitude: 79.0900 },
    { code: 'SBC', name: 'KSR Bengaluru City', latitude: 12.9779, longitude: 77.5696 },
    { code: 'CSMT', name: 'Mumbai CSMT', latitude: 18.9400, longitude: 72.8352 },
    { code: 'HWH', name: 'Howrah Junction', latitude: 22.5834, longitude: 88.3418 },
    { code: 'MAS', name: 'Chennai Central', latitude: 13.0827, longitude: 80.2707 },
    { code: 'PNBE', name: 'Patna Junction', latitude: 25.6022, longitude: 85.1200 }
];

export const Landing = () => {
    const { user } = useAuth();
    
    // 3D Flipping License State
    const [isLicenseFlipped, setIsLicenseFlipped] = useState(false);
    
    // Avatar Frame Customizer States
    const [selectedBorder, setSelectedBorder] = useState<'gold' | 'emerald' | 'indigo'>('gold');
    const [selectedBadge, setSelectedBadge] = useState<'conductor' | 'inspector' | 'dispatcher'>('conductor');
    
    // Live Ticking Clock for License Card
    const [unixTime, setUnixTime] = useState(Math.floor(Date.now() / 1000));
    
    // XP & Quests States
    const [xp, setXp] = useState(150);
    const [level, setLevel] = useState(1);
    const [completedQuests, setCompletedQuests] = useState<number[]>([]);
    const [levelUpMessage, setLevelUpMessage] = useState(false);

    // Sandbox Simulator States
    const [sandboxOrigin, setSandboxOrigin] = useState('NDLS');
    const [sandboxDest, setSandboxDest] = useState('SBC');
    const [isSandboxRunning, setIsSandboxRunning] = useState(false);
    const [sandboxProgress, setSandboxProgress] = useState(0);
    const [sandboxFares, setSandboxFares] = useState<{ SL: number; T3: number; T1: number } | null>(null);
    const [sandboxStops, setSandboxStops] = useState<StationNode[]>([]);

    // Tech Announcements Previews
    const [announcementText, setAnnouncementText] = useState("May I have your attention please. Train number 1 2 6 2 6, Kerala Express, is arriving on Platform 3.");
    const [voiceSpeed, setVoiceSpeed] = useState(0.85);

    // Dynamic stats derived from localStorage
    const [spotCount, setSpotCount] = useState(0);
    const [mileage, setMileage] = useState(0);
    const [co2Saved, setCo2Saved] = useState(0);

    // Live clock ticking
    useEffect(() => {
        const timer = setInterval(() => {
            setUnixTime(Math.floor(Date.now() / 1000));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Load dynamic search values from local storage
    useEffect(() => {
        const stored = localStorage.getItem('recentTrainSearches');
        if (stored) {
            try {
                const list = JSON.parse(stored);
                const count = list.length;
                setSpotCount(count);
                const calcMileage = count * 680 + 350;
                setMileage(calcMileage);
                setCo2Saved(Math.round(calcMileage * 0.14));
            } catch (e) {
                console.error(e);
            }
        } else {
            // Default interactive base values for logged-in profile
            setSpotCount(4);
            setMileage(3070);
            setCo2Saved(430);
        }
    }, []);

    // Daily Quests Definition
    const QUESTS = [
        { id: 1, text: "🗺️ Launch real-time Leaflet tracking maps", points: 60, desc: "Go to Live Map, inspect trains" },
        { id: 2, text: "🌫️ Activate rain/fog visibility delayed timers", points: 80, desc: "Surcharge delays inside the simulation board" },
        { id: 3, text: "🍲 Dispatch a Biryani meal order directly to S1 Berth", points: 70, desc: "Simulate IRCTC Catering on S1 Coach layouts" },
        { id: 4, text: "🎟️ Check PNR 4216839210 to unlock Cabin Inspector", points: 90, desc: "Locate seat highlights dynamically" }
    ];

    // Toggle Quest completion & award XP
    const handleQuestToggle = (questId: number, points: number) => {
        if (completedQuests.includes(questId)) {
            setCompletedQuests(prev => prev.filter(id => id !== questId));
            setXp(prev => Math.max(prev - points, 0));
        } else {
            setCompletedQuests(prev => [...prev, questId]);
            const newXp = xp + points;
            setXp(newXp);
            
            // Check for level progression threshold (Level Up!)
            if (newXp >= 350 && level === 1) {
                setLevel(2);
                triggerLevelUpNotification();
            } else if (newXp >= 500 && level === 2) {
                setLevel(3);
                triggerLevelUpNotification();
            }
        }
    };

    const triggerLevelUpNotification = () => {
        setLevelUpMessage(true);
        try {
            // Synthesize short positive success chime!
            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
            const ctx = new AudioContextClass();
            const now = ctx.currentTime;
            
            const tone = (f: number, t: number, d: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.frequency.value = f;
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.0001, t + d);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(t);
                osc.stop(t + d);
            };
            
            tone(523.25, now, 0.2); // C5
            tone(659.25, now + 0.15, 0.2); // E5
            tone(783.99, now + 0.3, 0.4); // G5
        } catch (e) {
            console.error(e);
        }
        setTimeout(() => setLevelUpMessage(false), 5000);
    };

    // Calculate Geodesic path between Sandbox stations
    const handleSandboxCalculate = () => {
        if (sandboxOrigin === sandboxDest) return;
        setIsSandboxRunning(true);
        setSandboxProgress(0);

        const stn1 = POPULAR_HUBS.find(s => s.code === sandboxOrigin)!;
        const stn2 = POPULAR_HUBS.find(s => s.code === sandboxDest)!;

        // Geographically interpolate 2 intermediate hubs along the vector path
        const midLat1 = stn1.latitude + (stn2.latitude - stn1.latitude) * 0.33;
        const midLng1 = stn1.longitude + (stn2.longitude - stn1.longitude) * 0.33;
        const midLat2 = stn1.latitude + (stn2.latitude - stn1.latitude) * 0.66;
        const midLng2 = stn1.longitude + (stn2.longitude - stn1.longitude) * 0.66;

        // Find nearest hubs to those points for visual stops
        const unused = POPULAR_HUBS.filter(s => s.code !== sandboxOrigin && s.code !== sandboxDest);
        unused.sort((a, b) => {
            const d1 = Math.pow(a.latitude - midLat1, 2) + Math.pow(a.longitude - midLng1, 2);
            const d2 = Math.pow(b.latitude - midLat1, 2) + Math.pow(b.longitude - midLng1, 2);
            return d1 - d2;
        });
        const stop1 = unused[0];

        const remaining = unused.filter(s => s.code !== stop1.code);
        remaining.sort((a, b) => {
            const d1 = Math.pow(a.latitude - midLat2, 2) + Math.pow(a.longitude - midLng2, 2);
            const d2 = Math.pow(b.latitude - midLat2, 2) + Math.pow(b.longitude - midLng2, 2);
            return d1 - d2;
        });
        const stop2 = remaining[0];

        const calculatedRoute = [stn1, stop1, stop2, stn2];
        setSandboxStops(calculatedRoute);

        // Distance formula delta
        const dx = stn1.latitude - stn2.latitude;
        const dy = stn1.longitude - stn2.longitude;
        const distanceKm = Math.round(Math.sqrt(dx*dx + dy*dy) * 98);

        // Class Fares
        setSandboxFares({
            SL: Math.round(distanceKm * 0.48 + 30),
            T3: Math.round(distanceKm * 1.25 + 320),
            T1: Math.round(distanceKm * 3.10 + 540)
        });

        // Run simulation animation progress
        let count = 0;
        const interval = setInterval(() => {
            count += 4;
            setSandboxProgress(count);
            if (count >= 100) {
                clearInterval(interval);
                setIsSandboxRunning(false);
            }
        }, 120);
    };

    // Web Audio engine tone synthesizer
    const playSynthesizedChime = (toneType: 'station' | 'warning' | 'success') => {
        try {
            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
            const audioCtx = new AudioContextClass();
            
            const triggerTone = (freq: number, start: number, duration: number) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.18, start + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(start);
                osc.stop(start + duration);
            };
            
            const now = audioCtx.currentTime;

            if (toneType === 'station') {
                // Classic IRCTC 4-tone melody chime
                triggerTone(392.00, now, 0.45);       // G4
                triggerTone(523.25, now + 0.22, 0.45); // C5
                triggerTone(659.25, now + 0.44, 0.45); // E5
                triggerTone(783.99, now + 0.66, 0.85); // G5
            } else if (toneType === 'warning') {
                // Harsh warning alert tone
                triggerTone(587.33, now, 0.15); // D5
                triggerTone(587.33, now + 0.2, 0.15);
                triggerTone(587.33, now + 0.4, 0.35);
            } else {
                // Happy success ring
                triggerTone(523.25, now, 0.2); // C5
                triggerTone(783.99, now + 0.15, 0.5); // G5
            }
        } catch (e) {
            console.error("Synthesizer failed:", e);
        }
    };

    // Text-to-Speech Vocal Announcer
    const triggerSandboxVoice = () => {
        try {
            if (!('speechSynthesis' in window)) return;
            const utterance = new SpeechSynthesisUtterance(announcementText);
            utterance.rate = voiceSpeed;
            utterance.pitch = 1.05;
            
            const voices = window.speechSynthesis.getVoices();
            const femaleVoice = voices.find(v => 
                v.lang.includes('en') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('google'))
            );
            if (femaleVoice) utterance.voice = femaleVoice;
            
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.error("Speech Synthesis failed:", e);
        }
    };

    // XP progress calculations
    const xpPercent = Math.min((xp / 500) * 100, 100);

    // Frame styling tokens
    const borderColors = {
        gold: 'border-yellow-500 shadow-yellow-500/20 ring-yellow-500/30 text-yellow-600 dark:text-yellow-400',
        emerald: 'border-emerald-500 shadow-emerald-500/20 ring-emerald-500/30 text-emerald-600 dark:text-emerald-400',
        indigo: 'border-indigo-500 shadow-indigo-500/20 ring-indigo-500/30 text-indigo-400'
    };

    const avatarGlows = {
        gold: 'glow-yellow border-yellow-500/80',
        emerald: 'glow-emerald border-emerald-500/80',
        indigo: 'glow-indigo border-indigo-500/80'
    };

    const badgeLabels = {
        conductor: 'Route Conductor',
        inspector: 'Cabin Inspector',
        dispatcher: 'Chief Dispatcher'
    };

    const avatarIcons = {
        conductor: '👨‍✈️',
        inspector: '🕵️',
        dispatcher: '🎛️'
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 pb-20 relative overflow-x-hidden font-sans">
            
            {/* Global Level-Up Alert Banner */}
            {levelUpMessage && (
                <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 font-bold px-8 py-4.5 rounded-full font-mono text-sm shadow-2xl flex items-center gap-3 animate-bounce border border-yellow-300">
                    <Sparkles className="h-5 w-5 animate-spin" />
                    <span>LEVEL UP! YOU ARE NOW A LEVEL {level} {badgeLabels[selectedBadge].toUpperCase()}!</span>
                </div>
            )}

            {/* Glowing background highlights */}
            <div className="absolute top-0 left-1/4 h-[400px] w-[400px] rounded-full bg-yellow-500 dark:bg-yellow-500/5 blur-[120px] pointer-events-none" />
            <div className="absolute top-1/2 right-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[150px] pointer-events-none" />

            {/* Redesigned Premium Hero Header */}
            <section className="relative w-full py-16 md:py-24 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-grid-white/[0.01]" />
                <div className="container mx-auto relative z-10 px-4 md:px-6">
                    <div className="flex flex-col items-center space-y-6 text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-yellow-500 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border border-yellow-500/20 text-xs font-bold font-mono tracking-widest uppercase animate-pulse">
                            <TrainFront className="h-4 w-4" /> ACTIVE DISPATCH GATEWAY SECURED
                        </div>
                        
                        <div className="space-y-4">
                            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight font-mono">
                                WELCOME COMMANDER,<br />
                                <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent uppercase tracking-wider">
                                    {user?.email?.split('@')[0]}
                                </span>
                            </h1>
                            <p className="mx-auto max-w-[700px] text-slate-500 dark:text-slate-400 text-sm md:text-lg leading-relaxed font-sans font-semibold">
                                License active. Manage your spotter badges, customize your cabin credentials, and explore the advanced geographical tracking sandbox below.
                            </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-6">
                            <Link to="/trains" className="w-full sm:w-auto">
                                <Button size="lg" className="w-full sm:w-auto bg-yellow-500 dark:bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold px-8 h-12 rounded-xl shadow-xl shadow-yellow-500/20 transition-all uppercase tracking-wider">
                                    Track Status Inquiry <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </Link>
                            <Link to="/live-map" className="w-full sm:w-auto">
                                <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:bg-slate-900 font-bold rounded-xl tracking-wider uppercase">
                                    Launch Satellite Map
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <div className="container mx-auto mt-12 space-y-12">
                
                {/* ================= SECTION 1: INTERACTIVE PROFILE HUB ================= */}
                <div className="grid gap-8 lg:grid-cols-12 items-start">
                    
                    {/* Left: Stats & Level (col-span 7) */}
                    <div className="lg:col-span-7 space-y-8 flex flex-col justify-center">
                        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 font-mono">
                            <div className="p-4 bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between hover:border-yellow-500/20 transition-all duration-300">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">Spotted Trains</span>
                                <div className="text-xl font-black text-yellow-600 dark:text-yellow-400 mt-2">{spotCount} Routes</div>
                                <span className="text-[8px] text-slate-600 dark:text-slate-600 mt-1">Schedules logged</span>
                            </div>
                            
                            <div className="p-4 bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between hover:border-yellow-500/20 transition-all duration-300">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">GPS Mileage</span>
                                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{mileage} km</div>
                                <span className="text-[8px] text-slate-600 dark:text-slate-600 mt-1">Spotted mileage</span>
                            </div>

                            <div className="p-4 bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between hover:border-yellow-500/20 transition-all duration-300">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">Carbon Savings</span>
                                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{co2Saved} kg</div>
                                <span className="text-[8px] text-slate-600 dark:text-slate-600 mt-1">Saved vs Flying</span>
                            </div>

                            <div className="p-4 bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between hover:border-indigo-500/20 transition-all duration-300">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">Current Rank</span>
                                <div className="text-[10px] font-black text-indigo-400 mt-2.5 truncate uppercase">
                                    {badgeLabels[selectedBadge]}
                                </div>
                                <span className="text-[8px] text-slate-600 dark:text-slate-600 mt-1">Rank active</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Digital Holo Spotter License (col-span 5) */}
                    <div className="lg:col-span-5 flex flex-col items-center">
                        <div className="w-full max-w-sm perspective-1000">
                            
                            {/* Interactive 3D flipping card */}
                            <div 
                                onClick={() => setIsLicenseFlipped(!isLicenseFlipped)}
                                className={`w-full h-80 relative transform-style-3d transition-transform duration-700 ease-in-out cursor-pointer ${
                                    isLicenseFlipped ? 'rotate-y-180' : ''
                                }`}
                            >
                                {/* FRONT OF LICENSE CARD */}
                                <div className={`absolute inset-0 bg-gradient-to-br from-slate-950 to-slate-900 border-2 rounded-3xl p-6 flex flex-col justify-between backface-hidden shadow-2xl overflow-hidden ${borderColors[selectedBorder]}`}>
                                    {/* Holographic metallic shine overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.01] via-white/[0.04] to-transparent pointer-events-none" />
                                    <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-current opacity-[0.02] transition-colors duration-500" />
                                    
                                    <div className="flex justify-between items-start font-mono relative z-10">
                                        <div className="space-y-0.5">
                                            <div className="text-[9px] font-bold tracking-widest text-slate-500 dark:text-slate-500 uppercase">MINISTRY OF RAILWAYS</div>
                                            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">NATIONAL INQUIRY NODE</h3>
                                        </div>
                                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                                    </div>

                                    {/* Card credentials layout */}
                                    <div className="flex gap-4 items-center relative z-10 py-3.5">
                                        <div className="h-16 w-16 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-3xl shadow-inner overflow-hidden">
                                            {user?.profilePhotoUrl ? (
                                                <img src={user.profilePhotoUrl} alt="Avatar" className="h-full w-full object-cover" />
                                            ) : (
                                                avatarIcons[selectedBadge]
                                            )}
                                        </div>
                                        <div className="space-y-1 font-mono text-[10px]">
                                            <div className="flex gap-1.5">
                                                <span className="text-slate-500 dark:text-slate-500">EMAIL:</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase truncate max-w-[130px]">{user?.email}</span>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <span className="text-slate-500 dark:text-slate-500">CLASS:</span>
                                                <span className="font-bold text-yellow-600 dark:text-yellow-400 uppercase">{badgeLabels[selectedBadge]}</span>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <span className="text-slate-500 dark:text-slate-500">ID CODE:</span>
                                                <span className="font-bold text-slate-500 dark:text-slate-400">SL-{user?.id.slice(-6).toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Barcode & Qr Code back section */}
                                    <div className="flex justify-between items-end border-t border-slate-900 pt-3 relative z-10 font-mono">
                                        <div className="space-y-1">
                                            <div className="text-[8px] text-slate-500 dark:text-slate-500">STATUS BEACON:</div>
                                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> CERTIFIED ACTIVE
                                            </span>
                                        </div>
                                        {/* Procedural Barcode visual lines */}
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="flex items-center gap-0.5 bg-slate-100 p-1.5 rounded">
                                                <QrCode className="h-6 w-6 text-slate-950" />
                                            </div>
                                            <span className="text-[7px] text-slate-600 dark:text-slate-600 font-mono">SECURE KEY-PASS</span>
                                        </div>
                                    </div>
                                </div>

                                {/* BACK OF LICENSE CARD */}
                                <div className={`absolute inset-0 bg-gradient-to-br from-slate-950 to-slate-900 border-2 rounded-3xl p-6 flex flex-col justify-between backface-hidden rotate-y-180 shadow-2xl overflow-hidden ${borderColors[selectedBorder]}`}>
                                    <div className="absolute inset-0 bg-grid-white/[0.01] pointer-events-none" />
                                    
                                    <div className="font-mono space-y-3.5 text-[10px] text-slate-500 dark:text-slate-400 py-2.5">
                                        <div className="border-b border-slate-900 pb-2 text-slate-800 dark:text-slate-200 font-bold uppercase tracking-wider">LICENSE LICENSEE TERMS:</div>
                                        <p className="leading-relaxed text-[9px] text-slate-500 dark:text-slate-500 font-sans">
                                            This token validates authorized cellular-GPS spotter clearance for local platform schedules. Do not share terminal tokens.
                                        </p>
                                        <div className="space-y-1 pt-1.5">
                                            <div className="flex justify-between">
                                                <span>SECURE TOKEN:</span>
                                                <span className="font-bold text-slate-600 dark:text-slate-300 font-mono">0x{user?.id.slice(0, 8).toUpperCase()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>SESSION CLOCK:</span>
                                                <span className="font-bold text-yellow-600 dark:text-yellow-500 font-mono">{unixTime} s</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center justify-center border-t border-slate-900 pt-3 gap-1">
                                        <div className="h-6 w-full flex gap-0.5 items-end justify-center bg-white dark:bg-slate-950 border border-slate-900 rounded p-1">
                                            {[2, 4, 1, 3, 5, 2, 4, 1, 5, 3, 2, 4, 5, 1, 2, 3].map((h, i) => (
                                                <div key={i} className="bg-slate-500 w-1 rounded-sm" style={{ height: `${h * 20}%` }} />
                                            ))}
                                        </div>
                                        <span className="text-[8px] text-slate-600 dark:text-slate-600 font-mono">CLICK TO FLIP LICENSE DECK</span>
                                    </div>
                                </div>

                            </div>
                        </div>
                        
                        <Button 
                            onClick={() => setIsLicenseFlipped(!isLicenseFlipped)}
                            className="mt-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:bg-slate-900 font-mono text-xs"
                        >
                            FLIP CREDENTIAL CARD
                        </Button>
                    </div>

                </div>

                {/* ================= Daily Quests Checklist ================= */}
                <Card className="bg-white dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 shadow-lg">
                    <CardHeader className="border-b border-slate-900/60 pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-bold font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <Flame className="h-4 w-4 text-orange-500 animate-pulse" /> Dispatcher Daily Missions
                        </CardTitle>
                        <span className="text-[10px] font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            XP MULTIPLIER 1.5x ACTIVE
                        </span>
                    </CardHeader>
                    <CardContent className="p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4 font-mono">
                        {QUESTS.map((quest) => {
                            const isCompleted = completedQuests.includes(quest.id);
                            return (
                                <div 
                                    key={quest.id}
                                    onClick={() => handleQuestToggle(quest.id, quest.points)}
                                    className={`p-3.5 border rounded-2xl flex flex-col justify-between gap-3 cursor-pointer transition-all duration-300 ${
                                        isCompleted 
                                            ? 'bg-emerald-500/5 border-emerald-500/30 text-slate-500 dark:text-slate-400 glow-green' 
                                            : 'bg-white dark:bg-slate-950/60 border-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-200 dark:border-slate-800'
                                    }`}
                                >
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-start gap-2">
                                            <span className={`text-[10px] leading-snug font-bold ${isCompleted ? 'line-through text-slate-500 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                                                {quest.text}
                                            </span>
                                            <div className={`h-4.5 w-4.5 rounded flex items-center justify-center border transition-all shrink-0 ${
                                                isCompleted ? 'border-emerald-500 bg-emerald-500 text-slate-950' : 'border-slate-300 dark:border-slate-700'
                                            }`}>
                                                {isCompleted && <Check className="h-3 w-3 stroke-[3]" />}
                                            </div>
                                        </div>
                                        <p className="text-[8px] text-slate-500 dark:text-slate-500 leading-normal font-sans">
                                            {quest.desc}
                                        </p>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-slate-900/60">
                                        <span className="text-[8px] text-slate-600 dark:text-slate-600">REWARD:</span>
                                        <span className={`text-[10px] font-bold ${isCompleted ? 'text-slate-600 dark:text-slate-600' : 'text-yellow-600 dark:text-yellow-500'}`}>+{quest.points} XP</span>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* ================= SECTION 2: ABOUT THE APP INTERACTIVE SANDBOX ================= */}
                <div className="grid gap-8 lg:grid-cols-12 items-start">
                    
                    {/* Sandbox Simulator widget (col-span 7) */}
                    <div className="lg:col-span-7 space-y-4">
                        <Card className="bg-white dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden font-mono">
                            <CardHeader className="bg-white dark:bg-slate-950 border-b border-slate-900 pb-4">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Compass className="h-4 w-4 text-emerald-500" /> Interactive Route Sandbox Manual
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans font-medium">
                                    Select an origin station and destination station from the controller panel below, then trigger the visual seeder track generator to trace simulated intermediate hubs, fares, and progressive pathways on a visual line.
                                </p>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase">Select Origin Hub</label>
                                        <select
                                            className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-xs text-yellow-600 dark:text-yellow-400 focus:outline-none"
                                            value={sandboxOrigin}
                                            onChange={(e) => setSandboxOrigin(e.target.value)}
                                        >
                                            {POPULAR_HUBS.map(s => (
                                                <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase">Select Destination Hub</label>
                                        <select
                                            className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-xs text-yellow-600 dark:text-yellow-400 focus:outline-none"
                                            value={sandboxDest}
                                            onChange={(e) => setSandboxDest(e.target.value)}
                                        >
                                            {POPULAR_HUBS.map(s => (
                                                <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSandboxCalculate}
                                    disabled={isSandboxRunning || sandboxOrigin === sandboxDest}
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold h-11 text-xs tracking-wider"
                                >
                                    {isSandboxRunning ? 'CALCULATING PATHWAY...' : 'CALCULATE ROUTE TRACK'}
                                </Button>

                                {/* Sandbox visual track representation */}
                                {sandboxStops.length > 0 && (
                                    <div className="space-y-6 pt-4 border-t border-slate-900">
                                        
                                        {/* Linear railway line graphic */}
                                        <div className="relative py-8 px-4 bg-white dark:bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden flex items-center justify-between">
                                            {/* Line background track */}
                                            <div className="absolute left-6 right-6 top-[50%] h-[3px] bg-slate-100 dark:bg-slate-800 z-0">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-emerald-500 to-yellow-500 transition-all duration-300"
                                                    style={{ width: `${sandboxProgress}%` }}
                                                />
                                            </div>
                                            
                                            {/* Stop circular indicators along track */}
                                            {sandboxStops.map((stop, idx) => {
                                                const isPassed = sandboxProgress >= (idx / (sandboxStops.length - 1)) * 100;
                                                return (
                                                    <div key={idx} className="relative z-10 flex flex-col items-center">
                                                        <div className={`h-5 w-5 rounded-full border-4 flex items-center justify-center transition-colors duration-500 ${
                                                            isPassed ? 'border-emerald-500 bg-white dark:bg-slate-950' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'
                                                        }`}>
                                                            {isPassed && <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />}
                                                        </div>
                                                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-2 font-mono">{stop.code}</span>
                                                    </div>
                                                );
                                            })}

                                            {/* Mini visual train moving along track */}
                                            {isSandboxRunning && (
                                                <div 
                                                    className="absolute top-[26%] text-base z-20 transition-all duration-300"
                                                    style={{ left: `calc(${sandboxProgress}% - 8px)` }}
                                                >
                                                    🚂
                                                </div>
                                            )}
                                        </div>

                                        {/* Route details output */}
                                        <div className="grid gap-4 md:grid-cols-2 font-mono text-xs">
                                            
                                            {/* Timetable stops details */}
                                            <div className="p-4 rounded-xl border border-slate-900 bg-white dark:bg-slate-950/20 space-y-2">
                                                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase pb-1 border-b border-slate-900">Spotted Path stops:</div>
                                                {sandboxStops.map((s, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-[10px]">
                                                        <span className="text-slate-500 dark:text-slate-400">{s.name}</span>
                                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.5 rounded">{s.code}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Dynamic seeder calculated fares */}
                                            {sandboxFares && (
                                                <div className="p-4 rounded-xl border border-slate-900 bg-white dark:bg-slate-950/20 space-y-2">
                                                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase pb-1 border-b border-slate-900">Estimated Fares:</div>
                                                    <div className="flex justify-between text-[10px]">
                                                        <span className="text-slate-500 dark:text-slate-400">1AC Premium (1A):</span>
                                                        <span className="font-bold text-yellow-600 dark:text-yellow-500">₹{sandboxFares.T1}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[10px]">
                                                        <span className="text-slate-500 dark:text-slate-400">3AC Comfort (3A):</span>
                                                        <span className="font-bold text-slate-800 dark:text-slate-200">₹{sandboxFares.T3}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[10px]">
                                                        <span className="text-slate-500 dark:text-slate-400">Sleeper Class (SL):</span>
                                                        <span className="font-bold text-slate-800 dark:text-slate-200">₹{sandboxFares.SL}</span>
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Interactive Technology sound / announcer Manual (col-span 5) */}
                    <div className="lg:col-span-5 space-y-4">
                        <Card className="bg-white dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 shadow-xl font-mono overflow-hidden">
                            <CardHeader className="bg-white dark:bg-slate-950 border-b border-slate-900 pb-4">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Cpu className="h-4 w-4 text-yellow-600 dark:text-yellow-500" /> Interactive Technology Explorer
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-5">
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                                    Try out our advanced browser hardware APIs in real-time. Test customized vocal announcers or synthesize oscillators.
                                </p>

                                {/* 1. Speech synthesis simulator */}
                                <div className="p-4 rounded-2xl border border-slate-900 bg-white dark:bg-slate-950/80 space-y-3">
                                    <div className="text-[10px] font-bold text-yellow-600 dark:text-yellow-500 flex items-center gap-1">
                                        <Volume2 className="h-3.5 w-3.5" /> Vocal Announcement Synthesizer
                                    </div>
                                    <textarea 
                                        value={announcementText}
                                        onChange={(e) => setAnnouncementText(e.target.value)}
                                        className="w-full h-16 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-2.5 text-[10px] text-slate-800 dark:text-slate-200 focus:outline-none placeholder:text-slate-600 dark:text-slate-600"
                                        maxLength={150}
                                    />
                                    <div className="flex justify-between items-center gap-4">
                                        <div className="flex items-center gap-2 text-[8px] text-slate-500 dark:text-slate-500">
                                            <span>Speed:</span>
                                            <input 
                                                type="range" 
                                                min="0.5" 
                                                max="1.5" 
                                                step="0.1" 
                                                value={voiceSpeed}
                                                onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                                                className="w-16 accent-yellow-500"
                                            />
                                            <span className="font-bold text-slate-500 dark:text-slate-400">{voiceSpeed}x</span>
                                        </div>
                                        <Button 
                                            onClick={triggerSandboxVoice}
                                            size="sm" 
                                            className="bg-yellow-500 dark:bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold px-3 text-[9px] h-8"
                                        >
                                            ANNOUNCE LIVE
                                        </Button>
                                    </div>
                                </div>

                                {/* 2. Web Audio Oscillator chime tester */}
                                <div className="p-4 rounded-2xl border border-slate-900 bg-white dark:bg-slate-950/80 space-y-3">
                                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <Music className="h-3.5 w-3.5" /> Web Audio Chime Soundboard
                                    </div>
                                    <p className="text-[9px] text-slate-500 dark:text-slate-500 leading-normal">
                                        Procedurally synthesizes standard railway melodies using pure trigonometric sine waves and oscillator parameters.
                                    </p>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        <button 
                                            onClick={() => playSynthesizedChime('station')}
                                            className="py-2 px-1 text-[8px] font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg uppercase"
                                        >
                                            🔊 STATION
                                        </button>
                                        <button 
                                            onClick={() => playSynthesizedChime('warning')}
                                            className="py-2 px-1 text-[8px] font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg uppercase"
                                        >
                                            🔊 WARNING
                                        </button>
                                        <button 
                                            onClick={() => playSynthesizedChime('success')}
                                            className="py-2 px-1 text-[8px] font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg uppercase"
                                        >
                                            🔊 SUCCESS
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>

            </div>
            
            {/* Redesigned footer */}
            <footer className="w-full mt-20 py-8 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80">
                <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:flex-row px-4 md:px-6 font-mono text-xs text-slate-500 dark:text-slate-500">
                    <p>© 2026 RAIL TRAIN SPOTTER. CERTIFIED UNDER MINISTRY OF RAILWAYS.</p>
                    <nav className="flex gap-4 sm:gap-6">
                        <Link className="hover:text-slate-600 dark:text-slate-300" to="#">Holographic Guidelines</Link>
                        <Link className="hover:text-slate-600 dark:text-slate-300" to="#">Privacy Node</Link>
                    </nav>
                </div>
            </footer>
        </div>
    );
};
