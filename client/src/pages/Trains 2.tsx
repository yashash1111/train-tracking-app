import { useEffect, useState } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { TrainFront, ArrowRight } from 'lucide-react';

interface Train {
    id: string;
    name: string;
    number: string;
    type: string;
    routes?: {
        source_station: { code: string; name: string };
        destination_station: { code: string; name: string };
    }[];
}

interface Station {
    id: string;
    code: string;
    name: string;
}

export const Trains = () => {
    const [trains, setTrains] = useState<Train[]>([]);
    const [stations, setStations] = useState<Station[]>([]);
    const [loading, setLoading] = useState(true);

    // Search State
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [trainsRes, stationsRes] = await Promise.all([
                    api.get<Train[]>('/trains'),
                    api.get<Station[]>('/stations')
                ]);
                setTrains(trainsRes.data);
                setStations(stationsRes.data);
            } catch (error) {
                console.error('Failed to fetch data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (source) params.source = source;
            if (destination) params.destination = destination;

            const res = await api.get<Train[]>('/trains', { params });
            setTrains(res.data);
        } catch (error) {
            console.error('Failed to search trains', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async () => {
        setSource('');
        setDestination('');
        setLoading(true);
        try {
            const res = await api.get<Train[]>('/trains');
            setTrains(res.data);
        } catch (error) {
            console.error('Failed to fetch trains', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            {/* Hero Section */}
            <div className="relative bg-primary/5 py-16 md:py-24 overflow-hidden">
                <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
                <div className="container relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="space-y-4 max-w-2xl">
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                                Discover Your Journey
                            </h1>
                            <p className="text-lg text-muted-foreground/80 leading-relaxed max-w-lg">
                                Browse our extensive network of premium trains. Find the perfect schedule for your next adventure across the rails.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <Link to="/live-map">
                                <Button size="lg" className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                                    View Live Map
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container -mt-8 relative z-20 space-y-12 pb-24">
                {/* Glassmorphism Search Filter */}
                <div className="rounded-xl border bg-background/60 backdrop-blur-xl shadow-xl p-6 md:p-8">
                    <div className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="w-full md:w-1/3 space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">From Station</label>
                            <div className="relative">
                                <select
                                    className="flex h-12 w-full rounded-lg border border-input bg-background/50 px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                >
                                    <option value="">Select Origin</option>
                                    {stations.slice().sort((a, b) => a.name.localeCompare(b.name)).map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-3.5 pointer-events-none text-muted-foreground">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                </div>
                            </div>
                        </div>
                        <div className="w-full md:w-1/3 space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">To Station</label>
                            <div className="relative">
                                <select
                                    className="flex h-12 w-full rounded-lg border border-input bg-background/50 px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                                    value={destination}
                                    onChange={(e) => setDestination(e.target.value)}
                                >
                                    <option value="">Select Destination</option>
                                    {stations.slice().sort((a, b) => a.name.localeCompare(b.name)).map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-3.5 pointer-events-none text-muted-foreground">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto h-12">
                            <Button onClick={handleSearch} isLoading={loading} className="h-full px-8 font-semibold">
                                Search Trains
                            </Button>
                            {(source || destination) && (
                                <Button variant="ghost" onClick={handleClear} className="h-full px-4 text-muted-foreground hover:text-foreground">
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Train Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <p className="text-muted-foreground animate-pulse">Locating trains...</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {trains.map((train, i) => (
                            <Card
                                key={train.id}
                                className="group hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 border-border/50 overflow-hidden"
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                <div className="h-2 w-full bg-gradient-to-r from-primary/80 to-blue-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">
                                            {train.name}
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-secondary-foreground/10">
                                                #{train.number}
                                            </span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${train.type === 'EXPRESS' ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                                {train.type}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                                        <TrainFront className="h-5 w-5" />
                                    </div>
                                </CardHeader>
                                <CardContent>

                                    {train.routes && train.routes.length > 0 ? (
                                        <div className="flex items-center justify-between text-sm bg-muted/40 p-4 rounded-xl mb-6 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-grid-black/[0.02] [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
                                            <div className="relative z-10 flex flex-col items-start gap-1">
                                                <span className="text-xs text-muted-foreground font-medium uppercase">From</span>
                                                <span className="font-bold text-lg">{train.routes[0].source_station.code}</span>
                                            </div>

                                            <div className="relative z-10 flex flex-col items-center px-4 flex-1">
                                                <div className="w-full h-px bg-border relative top-2.5">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/50 to-transparent w-1/2 mx-auto" />
                                                </div>
                                                <ArrowRight className="h-5 w-5 text-primary bg-background relative z-10 px-1" />
                                            </div>

                                            <div className="relative z-10 flex flex-col items-end gap-1">
                                                <span className="text-xs text-muted-foreground font-medium uppercase">To</span>
                                                <span className="font-bold text-lg">{train.routes[0].destination_station.code}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-muted-foreground mb-6 py-4 px-4 bg-muted/30 rounded-lg italic flex items-center gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                                            Route info unavailable
                                        </div>
                                    )}

                                    <Link to={`/live-map`} className="block">
                                        <Button className="w-full group-hover:bg-primary/90 transition-all font-semibold" size="default">
                                            Track Live Status
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {!loading && trains.length === 0 && (
                    <div className="text-center py-20 px-4 rounded-3xl border-2 border-dashed bg-muted/5">
                        <div className="h-16 w-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                            <TrainFront className="h-8 w-8 text-muted-foreground opacity-50" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No trains found</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                            We couldn't find any trains matching your search. Try adjusting the stations or clearing the filters.
                        </p>
                        <Button variant="outline" onClick={handleClear} className="mt-6">
                            Clear Filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
