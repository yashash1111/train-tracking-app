import { useEffect, useState } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { 
    TrainFront, 
    ArrowRight, 
    Search, 
    RotateCcw, 
    Clock, 
    MapPin, 
    Tag, 
    CalendarDays, 
    AlertTriangle, 
    CheckCircle2,
    SearchCode,
    CreditCard,
    QrCode,
    Trophy,
    Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

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
    _id: string;
    name: string;
    number: string;
    type: string;
    routes?: {
        source_station: { code: string; name: string };
        destination_station: { code: string; name: string };
        stops: Stop[];
    }[];
}

interface Station {
    _id: string;
    code: string;
    name: string;
}

interface PnrTicket {
    pnrNumber: string;
    trainName: string;
    trainNumber: string;
    trainId: string;
    source: string;
    destination: string;
    date: string;
    travelClass: string;
    passengers: {
        name: string;
        age: number;
        gender: string;
        bookingStatus: string;
        currentStatus: string;
        coach: string;
        seatNumber: number;
    }[];
    totalFare: number;
}

export const Trains = () => {
    const navigate = useNavigate();
    const [trains, setTrains] = useState<Train[]>([]);
    const [allTrains, setAllTrains] = useState<Train[]>([]); 
    const [stations, setStations] = useState<Station[]>([]);
    const [loading, setLoading] = useState(false);
    const [recentSpots, setRecentSpots] = useState<any[]>([]);

    // Tab Switcher
    const [activeTab, setActiveTab] = useState<'search' | 'stationBoard' | 'pnr'>('search');

    // Search Panel States
    const [searchQuery, setSearchQuery] = useState('');
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');
    const [recentSearches, setRecentSearches] = useState<Train[]>([]);

    // Live Station Board States
    const [selectedBoardStation, setSelectedBoardStation] = useState('');
    const [stationBoardTrains, setStationBoardTrains] = useState<Train[]>([]);
    const [searchingBoard, setSearchingBoard] = useState(false);

    // Pagination States (12 items per page matches a 3-column grid perfectly!)
    const [searchPage, setSearchPage] = useState(1);
    const [stationPage, setStationPage] = useState(1);
    const pageSize = 12;

    // PNR Tracker States
    const [pnrInput, setPnrInput] = useState('');
    const [checkedPnr, setCheckedPnr] = useState<PnrTicket | null>(null);
    const [searchingPnr, setSearchingPnr] = useState(false);

    // Interactive Fares states
    const [visibleFareTrainId, setVisibleFareTrainId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [trainsRes] = await Promise.all([
                    api.get<Train[]>('/trains')
                ]);
                setTrains(trainsRes.data);
                setAllTrains(trainsRes.data);
            } catch (error) {
                console.error('Failed to fetch data', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchRecentSpots = async () => {
            try {
                const res = await api.get('/trains/recent-spots');
                setRecentSpots(res.data);
            } catch (e) {
                console.error("Failed to fetch recent spots", e);
            }
        };

        const fetchStations = async () => {
            try {
                const res = await api.get<Station[]>('/stations');
                setStations(res.data);
                
                // Set default to first station
                if (res.data.length > 0) {
                    setSelectedBoardStation(res.data[0]._id);
                }
            } catch (error) {
                console.error('Failed to fetch stations:', error);
            }
        };
        
        fetchData();
        fetchStations();
        fetchRecentSpots();

        // Poll for live spot updates every 15 seconds
        const interval = setInterval(fetchRecentSpots, 15000);
        return () => clearInterval(interval);
    }, []);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (source) params.source = source;
            if (destination) params.destination = destination;

            const res = await api.get<Train[]>('/trains', { params });
            
            let filtered = res.data;
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim();
                filtered = res.data.filter(train => 
                    train.name.toLowerCase().includes(query) || 
                    train.number.includes(query)
                );
            }
            
            setTrains(filtered);
            setSearchPage(1); 
            if (filtered.length > 0) {
                toast.success(`Found ${filtered.length} active trains on this route!`);
            } else {
                toast.error('No trains found for this route.');
            }
        } catch (error) {
            console.error('Failed to search trains', error);
            toast.error('Failed to fetch train routes. Network error.');
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async () => {
        setSource('');
        setDestination('');
        setSearchQuery('');
        setTrains(allTrains);
        setSearchPage(1);
    };

    const handleSearchStationBoard = () => {
        if (!selectedBoardStation) return;
        setSearchingBoard(true);
        
        const stn = stations.find(s => s._id === selectedBoardStation);
        if (!stn) {
            setSearchingBoard(false);
            return;
        }

        const matching = allTrains.filter(t => {
            const stops = t.routes?.[0]?.stops || [];
            return stops.some(stop => stop.code === stn.code);
        });

        setStationBoardTrains(matching);
        setStationPage(1);
        if (matching.length > 0) {
            toast.success(`Live board updated! ${matching.length} trains passing through.`);
        } else {
            toast.error('No scheduled halts at this station currently.');
        }
        setSearchingBoard(false);
    };

    const handleClearStationBoard = () => {
        setSelectedBoardStation('');
        setStationBoardTrains([]);
        setStationPage(1);
    };

    // PNR Checker logic
    const handleCheckPnr = (e: React.FormEvent) => {
        e.preventDefault();
        if (!pnrInput.trim() || pnrInput.length < 10) return;

        setSearchingPnr(true);
        setTimeout(() => {
            const targetTrain = allTrains.length > 0 ? allTrains[0] : null;
            if (!targetTrain) {
                setSearchingPnr(false);
                return;
            }

            const pnrNum = pnrInput.trim();
            const isSpecialPnr = pnrNum === '4216839210';

            const mockTicket: PnrTicket = {
                pnrNumber: pnrNum,
                trainName: isSpecialPnr ? 'KERALA EXPRESS' : targetTrain.name,
                trainNumber: isSpecialPnr ? '12626' : targetTrain.number,
                trainId: targetTrain._id,
                source: isSpecialPnr ? 'NDLS' : (targetTrain.routes?.[0]?.source_station.code || 'NDLS'),
                destination: isSpecialPnr ? 'SBC' : (targetTrain.routes?.[0]?.destination_station.code || 'SBC'),
                date: 'May 28, 2026',
                travelClass: 'Sleeper (SL)',
                passengers: [
                    {
                        name: isSpecialPnr ? 'YASHASH GOWDA' : 'PANKAJ KUMAR',
                        age: isSpecialPnr ? 24 : 32,
                        gender: 'Male',
                        bookingStatus: 'CNF',
                        currentStatus: 'CNF',
                        coach: 'S1',
                        seatNumber: 23
                    }
                ],
                totalFare: isSpecialPnr ? 795 : 680
            };

            setCheckedPnr(mockTicket);
            setSearchingPnr(false);
        }, 800);
    };

    const handleLocatePnrBerth = (ticket: PnrTicket) => {
        localStorage.setItem('locateBerthTrainId', ticket.trainId);
        localStorage.setItem('locateBerthCoach', ticket.passengers[0].coach);
        localStorage.setItem('locateBerthSeat', ticket.passengers[0].seatNumber.toString());
        navigate('/live-map');
    };

    const saveRecentSearch = (train: Train) => {
        const updated = [train, ...recentSearches.filter(t => t._id !== train._id)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentTrainSearches', JSON.stringify(updated));
    };

    const calculateClassFares = (train: Train) => {
        const stops = train.routes?.[0]?.stops || [];
        if (stops.length < 2) return { SL: 0, T3: 0, T2: 0, T1: 0 };
        
        let distanceKm = 0;
        for (let i = 0; i < stops.length - 1; i++) {
            const dx = stops[i + 1].latitude - stops[i].latitude;
            const dy = stops[i + 1].longitude - stops[i].longitude;
            distanceKm += Math.sqrt(dx*dx + dy*dy) * 95;
        }

        return {
            GN: Math.round(distanceKm * 0.22 + 15),
            SL: Math.round(distanceKm * 0.48 + 30),
            T3: Math.round(distanceKm * 1.25 + 45 + 280),
            T2: Math.round(distanceKm * 1.85 + 50 + 380),
            T1: Math.round(distanceKm * 3.10 + 60 + 480)
        };
    };

    const handleSpotTrain = async (trainId: string, trainName: string) => {
        try {
            await api.post(`/auth/spot/${trainId}`);
            toast.success(`You spotted ${trainName}! +10 XP added to your rank.`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to spot train. Please login.');
        }
    };

    // Slice results dynamically for search pagination
    const totalSearchPages = Math.ceil(trains.length / pageSize);
    const paginatedTrains = trains.slice((searchPage - 1) * pageSize, searchPage * pageSize);

    // Slice results dynamically for station board pagination
    const totalStationPages = Math.ceil(stationBoardTrains.length / pageSize);
    const paginatedStationTrains = stationBoardTrains.slice((stationPage - 1) * pageSize, stationPage * pageSize);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 pb-24">
            {/* Indian Railways Display Header */}
            <div className="relative bg-white dark:bg-slate-950 border-b border-yellow-500/20 py-12 overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-grid-white/[0.02]" />
                <div className="container relative z-10 text-center space-y-3">
                    <div className="mx-auto h-12 w-12 rounded-full bg-yellow-500 dark:bg-yellow-500/10 flex items-center justify-center text-yellow-600 dark:text-yellow-500 border border-yellow-500/30 animate-pulse">
                        <TrainFront className="h-6 w-6" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-wider text-yellow-600 dark:text-yellow-400 font-mono">
                        NATIONAL TRAIN INQUIRY SYSTEM
                    </h1>
                    <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                        Real-time Live Running Status, Boards & PNR Tickets
                    </p>
                </div>
            </div>

            <div className="container mt-8 space-y-6">
                {/* Custom Tab Switcher */}
                <div className="flex border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-1.5 rounded-2xl max-w-lg mx-auto shadow-lg">
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${activeTab === 'search' ? 'bg-yellow-500 dark:bg-yellow-500 text-slate-950 shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'}`}
                    >
                        <Search className="h-4 w-4" /> Route
                    </button>
                    <button
                        onClick={() => setActiveTab('stationBoard')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${activeTab === 'stationBoard' ? 'bg-yellow-500 dark:bg-yellow-500 text-slate-950 shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'}`}
                    >
                        <CalendarDays className="h-4 w-4" /> Live Board
                    </button>
                    <button
                        onClick={() => setActiveTab('pnr')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${activeTab === 'pnr' ? 'bg-yellow-500 dark:bg-yellow-500 text-slate-950 shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'}`}
                    >
                        <SearchCode className="h-4 w-4" /> PNR Status
                    </button>
                </div>

                {activeTab === 'search' ? (
                    /* ================= TAB 1: SEARCH BOARD ================= */
                    <div className="space-y-8 animate-fadeIn">
                        {/* Physical Display Board Search Panel */}
                        <div className="railway-display-board rounded-2xl p-6 md:p-8 space-y-6">
                            <div className="border-b border-slate-300 dark:border-slate-700/50 pb-4 flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-yellow-500 dark:bg-yellow-500 animate-ping"></div>
                                <h2 className="text-yellow-600 dark:text-yellow-400 font-mono font-bold tracking-widest text-sm md:text-base">SEARCH ROUTE PANEL</h2>
                            </div>

                            <div className="grid gap-6 md:grid-cols-3">
                                {/* 1. Train Number / Name */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        <Tag className="h-3 w-3 text-yellow-600 dark:text-yellow-500" /> Train Name or Number
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Enter number or name"
                                            className="flex h-12 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/80 px-4 pl-10 text-sm font-mono text-yellow-600 dark:text-yellow-400 placeholder:text-slate-600 dark:text-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500 transition-all"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-600 dark:text-slate-600" />
                                    </div>
                                </div>

                                {/* 2. From Station */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        <MapPin className="h-3 w-3 text-yellow-600 dark:text-yellow-500" /> From Station (Origin)
                                    </label>
                                    <div className="relative">
                                        <select
                                            className="flex h-12 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/80 px-4 py-2 text-sm font-mono text-yellow-600 dark:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500 transition-all appearance-none"
                                            value={source}
                                            onChange={(e) => setSource(e.target.value)}
                                        >
                                            <option value="" className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">Select Origin Station</option>
                                            {stations.slice().sort((a, b) => a.name.localeCompare(b.name)).map(s => (
                                                <option key={s._id} value={s._id} className="bg-slate-50 dark:bg-slate-900 text-yellow-600 dark:text-yellow-400">
                                                    {s.name} ({s.code})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-4 pointer-events-none text-slate-700">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. To Station */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        <MapPin className="h-3 w-3 text-yellow-600 dark:text-yellow-500" /> To Station (Destination)
                                    </label>
                                    <div className="relative">
                                        <select
                                            className="flex h-12 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/80 px-4 py-2 text-sm font-mono text-yellow-600 dark:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500 transition-all appearance-none"
                                            value={destination}
                                            onChange={(e) => setDestination(e.target.value)}
                                        >
                                            <option value="" className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">Select Destination Station</option>
                                            {stations.slice().sort((a, b) => a.name.localeCompare(b.name)).map(s => (
                                                <option key={s._id} value={s._id} className="bg-slate-50 dark:bg-slate-900 text-yellow-600 dark:text-yellow-400">
                                                    {s.name} ({s.code})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-4 pointer-events-none text-slate-700">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-2">
                                <Button
                                    onClick={handleSearch}
                                    isLoading={loading}
                                    className="bg-yellow-500 dark:bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold px-8 h-12 rounded-lg shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/30 transition-all"
                                >
                                    FIND TRAIN LIVE
                                </Button>
                                {(source || destination || searchQuery) && (
                                    <Button
                                        variant="ghost"
                                        onClick={handleClear}
                                        className="h-12 px-6 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-slate-500 hover:bg-slate-100 dark:bg-slate-800"
                                    >
                                        <RotateCcw className="h-4 w-4 mr-2" /> RESET
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Global Live Feed: Recently Spotted Trains */}
                        {recentSpots.length > 0 && (
                            <div className="space-y-3 font-mono">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Clock className="h-3 w-3 text-slate-500 dark:text-slate-400" /> LIVE GLOBAL SPOTS
                                </h3>
                                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5 font-sans">
                                    {recentSpots.map(spot => (
                                        <div
                                            key={spot._id}
                                            className="p-3 bg-white dark:bg-slate-950/60 hover:bg-slate-50 dark:hover:bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-yellow-500/30 rounded-xl transition-all flex flex-col justify-between gap-2 group animate-fadeIn shadow-sm"
                                        >
                                            <div>
                                                <span className="text-xs font-bold text-yellow-600 dark:text-yellow-500 group-hover:text-yellow-600 dark:group-hover:text-yellow-600 dark:text-yellow-400 font-mono">
                                                    #{spot.train.number}
                                                </span>
                                                <div className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200">
                                                    {spot.train.name}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                                                {spot.user.profilePhotoUrl ? (
                                                    <img src={spot.user.profilePhotoUrl} className="w-4 h-4 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                                        <span className="text-[8px]">{spot.user.name[0]}</span>
                                                    </div>
                                                )}
                                                <span className="text-[10px] text-slate-500 dark:text-slate-500 truncate">by {spot.user.name.split(' ')[0]}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Train List / Board Results */}
                        <div className="space-y-4 font-mono">
                            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                                <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 dark:text-slate-500">
                                    SPOTTED RESULTS ({trains.length})
                                </h3>
                            </div>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-24 gap-4">
                                    <div className="h-12 w-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
                                    <p className="text-sm text-yellow-600 dark:text-yellow-500/70 animate-pulse uppercase tracking-wider">Spotting Active Schedules...</p>
                                </div>
                            ) : trains.length === 0 ? (
                                <div className="text-center py-20 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/30 font-sans">
                                    <div className="h-16 w-16 mx-auto rounded-full bg-white dark:bg-slate-950 flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-800">
                                        <TrainFront className="h-8 w-8 text-slate-700" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">No trains found</h3>
                                    <p className="text-slate-500 dark:text-slate-500 max-w-sm mx-auto text-sm">
                                        We couldn't find any trains matching your search. Try typing a different number, selecting stations, or clearing active filters.
                                    </p>
                                    <Button variant="outline" onClick={handleClear} className="mt-6 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800">
                                        Clear Filters
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Paginated search grid */}
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 font-sans">
                                        {paginatedTrains.map((train) => {
                                            const fares = calculateClassFares(train);
                                            const showFares = visibleFareTrainId === train._id;

                                            return (
                                                <Card
                                                    key={train._id}
                                                    className="bg-white dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 hover:border-yellow-500/30 hover:shadow-xl hover:shadow-yellow-500/[0.02] transition-all duration-300 overflow-hidden flex flex-col group animate-fadeIn"
                                                >
                                                    <div className="h-1.5 w-full bg-gradient-to-r from-yellow-500 to-amber-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                                        <div className="space-y-1.5">
                                                            <CardTitle className="text-lg font-bold group-hover:text-yellow-600 dark:text-yellow-400 transition-colors truncate max-w-[200px] text-slate-800 dark:text-slate-200">
                                                                {train.name}
                                                            </CardTitle>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-500 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border border-yellow-500/20 font-mono">
                                                                    #{train.number}
                                                                </span>
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 font-mono">
                                                                    {train.type}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="h-10 w-10 rounded-full bg-yellow-500 dark:bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-600 dark:text-yellow-500 group-hover:bg-yellow-500 dark:bg-yellow-500 group-hover:text-slate-950 transition-all duration-300">
                                                            <TrainFront className="h-5 w-5" />
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="flex-1 flex flex-col justify-between pt-2">
                                                        {train.routes && train.routes.length > 0 ? (
                                                            <div className="flex items-center justify-between text-sm bg-white dark:bg-slate-950 border border-slate-900 p-4 rounded-xl mb-4 relative overflow-hidden font-mono">
                                                                <div className="flex flex-col items-start gap-0.5">
                                                                    <span className="text-[9px] text-slate-700 uppercase font-sans">Origin</span>
                                                                    <span className="font-bold text-yellow-600 dark:text-yellow-500">{train.routes[0].source_station.code}</span>
                                                                </div>

                                                                <div className="flex flex-col items-center px-4 flex-1">
                                                                    <div className="w-full h-px bg-slate-100 dark:bg-slate-800 relative top-2.5">
                                                                        <div className="absolute inset-0 bg-yellow-500 dark:bg-yellow-500/30 w-1/2 mx-auto" />
                                                                    </div>
                                                                    <ArrowRight className="h-5 w-5 text-yellow-600 dark:text-yellow-500 bg-white dark:bg-slate-950 relative z-10 px-1" />
                                                                </div>

                                                                <div className="flex flex-col items-end gap-0.5">
                                                                    <span className="text-[9px] text-slate-700 uppercase font-sans">Dest</span>
                                                                    <span className="font-bold text-yellow-600 dark:text-yellow-500">{train.routes[0].destination_station.code}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs text-slate-700 mb-4 py-4 px-4 bg-white dark:bg-slate-950/40 rounded-lg italic flex items-center gap-2">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                                                                Running Board Unavailable
                                                            </div>
                                                        )}

                                                        {showFares && (
                                                            <div className="mb-4 p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-900 font-mono text-[10px] space-y-1.5 text-slate-500 dark:text-slate-400 animate-slideDown">
                                                                <div className="text-slate-500 dark:text-slate-500 font-bold border-b border-slate-900 pb-1 flex justify-between uppercase">
                                                                    <span>Travel Class</span>
                                                                    <span>Estimated Fare</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>1AC Sleeper (1A)</span>
                                                                    <span className="font-bold text-yellow-600 dark:text-yellow-400">₹{fares.T1}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>2AC Sleeper (2A)</span>
                                                                    <span className="font-bold text-slate-800 dark:text-slate-200">₹{fares.T2}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>3AC Sleeper (3A)</span>
                                                                    <span className="font-bold text-slate-800 dark:text-slate-200">₹{fares.T3}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>Sleeper Class (SL)</span>
                                                                    <span className="font-bold text-slate-800 dark:text-slate-200">₹{fares.SL}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>General (GN)</span>
                                                                    <span className="font-bold text-slate-500 dark:text-slate-400">₹{fares.GN}</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex gap-2">
                                                            <Button 
                                                                variant="outline" 
                                                                size="default" 
                                                                onClick={() => setVisibleFareTrainId(showFares ? null : train._id)}
                                                                className="px-3 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800 h-8"
                                                            >
                                                                <CreditCard className="h-4 w-4" />
                                                            </Button>
                                                            <Button 
                                                                onClick={() => handleSpotTrain(train._id, train.name)}
                                                                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 h-8"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Link 
                                                                to="/live-map" 
                                                                onClick={() => saveRecentSearch(train)}
                                                                className="flex-1"
                                                            >
                                                                <Button className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-yellow-500/40 hover:bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold group-hover:shadow-lg transition-all" size="default">
                                                                    TRACK STATUS
                                                                </Button>
                                                            </Link>
                                                            <Button 
                                                                onClick={() => handleSpotTrain(train._id, train.name)}
                                                                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>

                                    {/* Pagination Controls */}
                                    {totalSearchPages > 1 && (
                                        <div className="flex justify-center items-center gap-3 pt-6 font-mono text-xs">
                                            <Button 
                                                variant="outline" 
                                                disabled={searchPage === 1}
                                                onClick={() => setSearchPage(prev => Math.max(prev - 1, 1))}
                                                className="border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200"
                                            >
                                                Previous
                                            </Button>
                                            <span className="text-slate-500 dark:text-slate-400">
                                                Page <span className="font-bold text-yellow-600 dark:text-yellow-500">{searchPage}</span> of {totalSearchPages}
                                            </span>
                                            <Button 
                                                variant="outline" 
                                                disabled={searchPage === totalSearchPages}
                                                onClick={() => setSearchPage(prev => Math.min(prev + 1, totalSearchPages))}
                                                className="border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : activeTab === 'stationBoard' ? (
                    /* ================= TAB 2: LIVE STATION BOARD ================= */
                    <div className="space-y-8 animate-fadeIn font-mono">
                        {/* Live Station Board Selection Box */}
                        <div className="railway-display-board rounded-2xl p-6 md:p-8 space-y-6">
                            <div className="border-b border-slate-300 dark:border-slate-700/50 pb-4 flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping"></span>
                                <h2 className="text-yellow-600 dark:text-yellow-400 font-bold tracking-widest text-sm md:text-base">STATION DEPARTURE & ARRIVAL BOARD</h2>
                            </div>

                            <div className="flex flex-col md:flex-row gap-6 items-end">
                                <div className="space-y-2 flex-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-500" /> Select Railway Station
                                    </label>
                                    <div className="relative">
                                        <select
                                            className="flex h-12 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/80 px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500 transition-all appearance-none"
                                            value={selectedBoardStation}
                                            onChange={(e) => setSelectedBoardStation(e.target.value)}
                                        >
                                            <option value="" className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">Select Station to track...</option>
                                            {stations.slice().sort((a, b) => a.name.localeCompare(b.name)).map(s => (
                                                <option key={s._id} value={s._id} className="bg-slate-50 dark:bg-slate-900 text-yellow-600 dark:text-yellow-400">
                                                    {s.name} ({s.code})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-4 pointer-events-none text-slate-700">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleSearchStationBoard}
                                        isLoading={searchingBoard}
                                        disabled={!selectedBoardStation}
                                        className="bg-yellow-500 dark:bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold px-8 h-12 rounded-lg shadow-lg shadow-yellow-500/10"
                                    >
                                        GET STATION BOARD
                                    </Button>
                                    {selectedBoardStation && (
                                        <Button
                                            variant="ghost"
                                            onClick={handleClearStationBoard}
                                            className="h-12 px-6 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-slate-500 hover:bg-slate-100 dark:bg-slate-800"
                                        >
                                            CLEAR
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Station Board Physical Display Sheet */}
                        {selectedBoardStation && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                                    <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 dark:text-slate-500 animate-pulse">
                                        UPCOMING DEPARTURE TIMELINE
                                    </h3>
                                </div>

                                {stationBoardTrains.length === 0 ? (
                                    <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-slate-900 bg-white dark:bg-slate-950/20">
                                        <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400">No scheduled halts</h3>
                                        <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">There are no trains currently scheduled to pass through this platform.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse min-w-[700px]">
                                                    <thead>
                                                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase text-slate-500 dark:text-slate-500 tracking-wider">
                                                            <th className="py-4 px-6">Train No / Name</th>
                                                            <th className="py-4 px-6">Direction (From ➔ To)</th>
                                                            <th className="py-4 px-6 text-center">Platform</th>
                                                            <th className="py-4 px-6">Scheduled Time</th>
                                                            <th className="py-4 px-6">Real-Time Delay</th>
                                                            <th className="py-4 px-6 text-right">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-900/60 text-slate-600 dark:text-slate-300">
                                                        {paginatedStationTrains.map((train) => {
                                                            const targetStn = stations.find(s => s.id === selectedBoardStation)!;
                                                            const stopDetails = train.routes?.[0]?.stops.find(stop => stop.code === targetStn.code)!;
                                                            const delay = stopDetails?.delay || 0;

                                                            return (
                                                                <tr key={train._id} className="hover:bg-slate-50 dark:bg-slate-900/40 transition-colors animate-fadeIn">
                                                                    <td className="py-4.5 px-6">
                                                                        <div className="text-yellow-600 dark:text-yellow-500 font-bold text-xs">#{train.number}</div>
                                                                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wide truncate max-w-[200px]">
                                                                            {train.name}
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-4.5 px-6">
                                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                                            <span className="font-bold text-slate-800 dark:text-slate-200">{train.routes?.[0]?.source_station.code}</span>
                                                                            <ArrowRight className="h-3 w-3 text-yellow-600 dark:text-yellow-500/80" />
                                                                            <span className="font-bold text-slate-800 dark:text-slate-200">{train.routes?.[0]?.destination_station.code}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-4.5 px-6 text-center">
                                                                        <span className="text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-yellow-600 dark:text-yellow-400 px-2.5 py-1 rounded">
                                                                            {stopDetails?.platform || 'PF 1'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-4.5 px-6">
                                                                        <div className="text-xs">
                                                                            Arr: <span className="font-bold text-slate-800 dark:text-slate-200">{stopDetails?.arrival}</span>
                                                                        </div>
                                                                        <div className="text-[11px] text-slate-500 dark:text-slate-500">
                                                                            Dep: {stopDetails?.departure}
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-4.5 px-6">
                                                                        {delay > 0 ? (
                                                                            <span className="text-xs font-bold text-rose-500 flex items-center gap-1">
                                                                                <AlertTriangle className="h-3.5 w-3.5 animate-pulse" /> {delay}m Delay
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                                                <CheckCircle2 className="h-3.5 w-3.5" /> On Time
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-4.5 px-6 text-right">
                                                                        <Link 
                                                                            to="/live-map" 
                                                                            onClick={() => saveRecentSearch(train)}
                                                                        >
                                                                            <Button size="sm" className="bg-yellow-500 dark:bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold text-[10px] tracking-wider rounded-lg uppercase">
                                                                                Track
                                                                            </Button>
                                                                        </Link>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Station Board pagination controls */}
                                        {totalStationPages > 1 && (
                                            <div className="flex justify-center items-center gap-3 pt-6 font-mono text-xs">
                                                <Button 
                                                    variant="outline" 
                                                    disabled={stationPage === 1}
                                                    onClick={() => setStationPage(prev => Math.max(prev - 1, 1))}
                                                    className="border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200"
                                                >
                                                    Previous
                                                </Button>
                                                <span className="text-slate-500 dark:text-slate-400">
                                                    Page <span className="font-bold text-yellow-600 dark:text-yellow-500">{stationPage}</span> of {totalStationPages}
                                                </span>
                                                <Button 
                                                    variant="outline" 
                                                    disabled={stationPage === totalStationPages}
                                                    onClick={() => setStationPage(prev => Math.min(prev + 1, totalStationPages))}
                                                    className="border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200"
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    /* ================= TAB 3: PNR STATUS CHECKER ================= */
                    <div className="space-y-8 animate-fadeIn font-mono">
                        {/* PNR Checker Query Box */}
                        <div className="railway-display-board rounded-2xl p-6 md:p-8 space-y-6">
                            <div className="border-b border-slate-300 dark:border-slate-700/50 pb-4 flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500 dark:bg-yellow-500 animate-ping"></span>
                                <h2 className="text-yellow-600 dark:text-yellow-400 font-bold tracking-widest text-sm md:text-base">OFFICIAL PNR INQUIRY</h2>
                            </div>

                            <form onSubmit={handleCheckPnr} className="flex flex-col md:flex-row gap-6 items-end">
                                <div className="space-y-2 flex-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        <SearchCode className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-500" /> Enter 10-Digit PNR Number
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 4216839210"
                                        maxLength={10}
                                        value={pnrInput}
                                        onChange={(e) => setPnrInput(e.target.value.replace(/\D/g, ''))}
                                        className="flex h-12 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/80 px-4 text-sm text-yellow-600 dark:text-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/30"
                                        required
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        type="submit"
                                        isLoading={searchingPnr}
                                        disabled={pnrInput.length < 10}
                                        className="bg-yellow-500 dark:bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold px-8 h-12 rounded-lg shadow-lg shadow-yellow-500/10"
                                    >
                                        GET PNR STATUS
                                    </Button>
                                    {checkedPnr && (
                                        <Button
                                            variant="ghost"
                                            onClick={() => { setCheckedPnr(null); setPnrInput(''); }}
                                            className="h-12 px-6 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-slate-500 hover:bg-slate-100 dark:bg-slate-800"
                                        >
                                            CLEAR
                                        </Button>
                                    )}
                                </div>
                            </form>
                            <p className="text-[10px] text-slate-500 dark:text-slate-500 italic">
                                *Tip: Enter PNR "4216839210" to retrieve an authentic verified reservation card for Sleeper Coach S1 Seat 23!
                            </p>
                        </div>

                        {/* Visual Reservation ticket */}
                        {checkedPnr && (
                            <div className="max-w-2xl mx-auto space-y-4 animate-slideDown">
                                <div className="text-xs text-slate-500 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-2 flex justify-between uppercase">
                                    <span>IRCTC boarding ticket status</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">Status: Booked</span>
                                </div>

                                {/* Custom Ticket Visual Card */}
                                <div className="bg-white dark:bg-slate-950 border border-yellow-500/25 rounded-3xl overflow-hidden shadow-2xl relative">
                                    <div className="absolute top-0 right-0 bg-yellow-500 dark:bg-yellow-500 text-slate-950 text-[9px] font-extrabold px-3 py-1 uppercase tracking-wider rounded-bl-xl shadow">
                                        Boarding Pass
                                    </div>
                                    <div className="p-6 space-y-6">
                                        {/* Ticket Header */}
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-1">
                                                <div className="text-slate-500 dark:text-slate-500 text-[10px]">PNR NUMBER:</div>
                                                <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400 tracking-widest">{checkedPnr.pnrNumber}</div>
                                            </div>
                                            <div className="text-right space-y-1">
                                                <div className="text-slate-500 dark:text-slate-500 text-[10px]">DATE OF JOURNEY:</div>
                                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{checkedPnr.date}</div>
                                            </div>
                                        </div>

                                        {/* Train schedule card */}
                                        <div className="border border-slate-900 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div>
                                                <span className="text-[9px] text-yellow-600 dark:text-yellow-500 font-bold border border-yellow-500/20 px-2 py-0.5 rounded bg-yellow-500 dark:bg-yellow-500/5">#{checkedPnr.trainNumber}</span>
                                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase mt-1.5">{checkedPnr.trainName}</h4>
                                                <span className="text-[10px] text-slate-500 dark:text-slate-500">{checkedPnr.travelClass}</span>
                                            </div>

                                            {/* Track stations */}
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="font-extrabold text-yellow-600 dark:text-yellow-400">{checkedPnr.source}</span>
                                                <ArrowRight className="h-4 w-4 text-slate-700" />
                                                <span className="font-extrabold text-yellow-600 dark:text-yellow-400">{checkedPnr.destination}</span>
                                            </div>
                                        </div>

                                        {/* Passenger details grid */}
                                        <div className="space-y-2">
                                            <div className="text-[10px] text-slate-500 dark:text-slate-500 uppercase">Passenger Details & Berth Allocation</div>
                                            <div className="bg-slate-50 dark:bg-slate-900/10 border border-slate-900 rounded-2xl overflow-hidden divide-y divide-slate-900">
                                                <div className="grid grid-cols-4 p-3 text-[10px] uppercase text-slate-500 dark:text-slate-500 font-bold">
                                                    <span>Name</span>
                                                    <span>Berth No</span>
                                                    <span>Coach</span>
                                                    <span className="text-right">Booking status</span>
                                                </div>
                                                {checkedPnr.passengers.map((p, idx) => (
                                                    <div key={idx} className="grid grid-cols-4 p-3 text-xs text-slate-500 dark:text-slate-400 items-center">
                                                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate pr-2">{p.name} ({p.age}, {p.gender})</span>
                                                        <span className="font-bold text-yellow-600 dark:text-yellow-500">Seat {p.seatNumber}</span>
                                                        <span className="font-bold text-slate-800 dark:text-slate-200">{p.coach}</span>
                                                        <span className="text-right text-emerald-600 dark:text-emerald-400 font-bold font-sans">
                                                            {p.bookingStatus} / {p.currentStatus}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Ticket Footer / Locate Berth Trigger */}
                                        <div className="border-t border-slate-900 pt-5 flex flex-col md:flex-row justify-between items-center gap-4">
                                            <div className="flex items-center gap-3">
                                                <QrCode className="h-12 w-12 text-slate-600 dark:text-slate-600" />
                                                <div className="text-[10px] text-slate-500 dark:text-slate-500 max-w-xs leading-relaxed font-sans">
                                                    Scan barcode at station gates. Keep digital ticket open for TTE verification. Total Fare: ₹{checkedPnr.totalFare}.
                                                </div>
                                            </div>
                                            <Button 
                                                onClick={() => handleLocatePnrBerth(checkedPnr)}
                                                className="w-full md:w-auto bg-yellow-500 dark:bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold text-xs h-10 px-6 shadow-lg shadow-yellow-500/10"
                                            >
                                                LOCATE BERTH ON LIVE MAP
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
