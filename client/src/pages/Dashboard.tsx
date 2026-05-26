import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { 
    TrainFront, 
    Star, 
    Award, 
    Clock, 
    ArrowRight,
    Leaf,
    ShieldCheck,
    Milestone,
    UserCheck,
    Settings,
    User,
    Lock,
    ShieldAlert,
    CheckCircle2,
    Edit3,
    FileText,
    Cpu,
    Fingerprint
} from 'lucide-react';

interface Train {
    id: string;
    name: string;
    number: string;
    type: string;
}

export const Dashboard = () => {
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'profile'>('overview');
    
    // Overview states
    const [recentTrains, setRecentTrains] = useState<Train[]>([]);
    const [totalDistance, setTotalDistance] = useState(0);
    const [co2Saved, setCo2Saved] = useState(0);

    // Profile Editor Form states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    // Decorative Signature block
    const [secureHash, setSecureHash] = useState(`SEC-KEY-${Math.floor(100000 + Math.random() * 900000)}`);
    const [accountCreatedDate, setAccountCreatedDate] = useState('May 26, 2026');

    // Fetch spotted logs and calculate stats
    useEffect(() => {
        const stored = localStorage.getItem('recentTrainSearches');
        if (stored) {
            try {
                const list: Train[] = JSON.parse(stored);
                setRecentTrains(list.slice(0, 4));

                const count = list.length;
                const distanceVal = count * 680 + 350;
                setTotalDistance(distanceVal);

                const carbonVal = Math.round(distanceVal * 0.14);
                setCo2Saved(carbonVal);
            } catch (e) {
                console.error(e);
            }
        } else {
            setTotalDistance(1020);
            setCo2Saved(142);
        }

        // Initialize form fields with current context user details
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
        }
    }, [user]);

    // Fetch fresh profile details from API on Profile tab load
    useEffect(() => {
        if (activeTab === 'profile') {
            const fetchProfile = async () => {
                setFormLoading(true);
                try {
                    const res = await api.get('/auth/profile');
                    setName(res.data.name || '');
                    setEmail(res.data.email || '');
                    if (res.data.createdAt) {
                        setAccountCreatedDate(new Date(res.data.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }));
                    }
                } catch (e) {
                    console.error("Failed to load profile details", e);
                } finally {
                    setFormLoading(false);
                }
            };
            fetchProfile();
        }
    }, [activeTab]);

    // Form Submit Handler
    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');
        setFormSuccess('');

        if (newPassword && newPassword !== confirmPassword) {
            setFormError('New passwords do not match');
            setFormLoading(false);
            return;
        }

        try {
            const payload: any = { name, email };
            if (newPassword) {
                payload.newPassword = newPassword;
            }

            const res = await api.put('/auth/profile', payload);
            
            // Sync context state
            updateUser({
                ...user,
                name: res.data.user.name,
                email: res.data.user.email
            } as any);

            setFormSuccess('Dispatcher profile updated successfully!');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Failed to update profile details');
        } finally {
            setFormLoading(false);
        }
    };

    const handleRegenerateHash = () => {
        setSecureHash(`SEC-KEY-${Math.floor(100000 + Math.random() * 900000)}`);
        try {
            // Short digital success beep
            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = 880;
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        } catch (e) {
            console.error(e);
        }
    };

    const targetCo2 = 500;
    const co2Percentage = Math.min((co2Saved / targetCo2) * 100, 100);
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (co2Percentage / 100) * circumference;

    return (
        <div className="container py-8 space-y-8 bg-slate-900 text-slate-100 min-h-screen font-sans">
            
            {/* Header Railway Board */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/[0.01]" />
                <div className="space-y-1 relative z-10">
                    <h1 className="text-2xl md:text-3xl font-extrabold font-mono text-yellow-400">
                        WELCOME BACK, {user?.name || user?.email?.split('@')[0]}
                    </h1>
                    <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">Spotter Account Control Center</p>
                </div>
                
                {/* Custom Tab Switcher inside Header */}
                <div className="flex border border-slate-800 bg-slate-900/80 p-1 rounded-xl max-w-xs md:max-w-md shadow-lg relative z-10 font-mono shrink-0">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 px-4 py-2 text-[10px] font-bold tracking-wider transition-all uppercase rounded-lg flex items-center gap-1.5 ${activeTab === 'overview' ? 'bg-yellow-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <UserCheck className="h-3.5 w-3.5" /> Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 px-4 py-2 text-[10px] font-bold tracking-wider transition-all uppercase rounded-lg flex items-center gap-1.5 ${activeTab === 'profile' ? 'bg-yellow-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <Settings className="h-3.5 w-3.5" /> Profile Editor
                    </button>
                </div>
            </div>

            {activeTab === 'overview' ? (
                /* ================= TAB 1: DISPATCH OVERVIEW BOARD ================= */
                <div className="space-y-8 animate-fadeIn">
                    {/* Spotted Analytics Grid */}
                    <div className="grid gap-6 md:grid-cols-4 font-mono">
                        <Card className="bg-slate-950 border-slate-800/80 hover:border-yellow-500/20 transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">SPOTTER RANK</CardTitle>
                                <Award className="h-5 w-5 text-yellow-500 animate-pulse" />
                            </CardHeader>
                            <CardContent className="space-y-1">
                                <div className="text-lg font-bold text-yellow-400 uppercase tracking-widest">{user?.role === 'ADMIN' ? 'Chief Inspector' : 'Cabin Spotter'}</div>
                                <p className="text-[10px] text-slate-500">Authorized dispatcher level active</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-950 border-slate-800/80 hover:border-yellow-500/20 transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">SPOTTED TRAINS</CardTitle>
                                <Clock className="h-5 w-5 text-yellow-500" />
                            </CardHeader>
                            <CardContent className="space-y-1">
                                <div className="text-2xl font-extrabold text-yellow-400">{recentTrains.length} Routes</div>
                                <p className="text-[10px] text-slate-500">Unique schedules logged in profile</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-950 border-slate-800/80 hover:border-yellow-500/20 transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">TRACK MILEAGE</CardTitle>
                                <Milestone className="h-5 w-5 text-yellow-500" />
                            </CardHeader>
                            <CardContent className="space-y-1">
                                <div className="text-2xl font-bold text-emerald-400">{totalDistance} km</div>
                                <p className="text-[10px] text-slate-500">Cumulative spotted distances</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-950 border-slate-800/80 hover:border-yellow-500/20 transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">CARBON OFFSET</CardTitle>
                                <Leaf className="h-5 w-5 text-emerald-450 animate-bounce" />
                            </CardHeader>
                            <CardContent className="space-y-1">
                                <div className="text-2xl font-bold text-emerald-400">{co2Saved} kg CO2</div>
                                <p className="text-[10px] text-slate-500">Saved vs flight emissions</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Travel Analytics & Circular CO2 Offset Dial */}
                    <div className="grid gap-6 md:grid-cols-7 font-mono">
                        {/* Visual Carbon progress Dial */}
                        <Card className="md:col-span-3 bg-slate-950 border-slate-800 flex flex-col justify-between p-5">
                            <CardHeader className="p-0 pb-4 border-b border-slate-900">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-450">Eco Transit Offset</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
                                <div className="relative h-28 w-28 flex items-center justify-center">
                                    <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r={radius} stroke="#111827" strokeWidth="8" fill="transparent" />
                                        <circle 
                                            cx="50" 
                                            cy="50" 
                                            r={radius} 
                                            stroke="#10b981" 
                                            strokeWidth="8" 
                                            fill="transparent" 
                                            strokeDasharray={circumference}
                                            strokeDashoffset={strokeDashoffset}
                                            className="transition-all duration-1000"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="flex flex-col items-center z-10 text-center">
                                        <span className="text-lg font-extrabold text-slate-100">{Math.round(co2Percentage)}%</span>
                                        <span className="text-[8px] text-emerald-405 uppercase font-bold">Of target</span>
                                    </div>
                                </div>
                                <div className="text-center text-xs text-slate-400 leading-relaxed">
                                    Offset progress: <span className="text-emerald-400 font-bold">{co2Saved} kg</span> out of standard target of <span className="text-slate-200">{targetCo2} kg</span>. Choosing trains helps protect forests!
                                </div>
                            </CardContent>
                        </Card>

                        {/* Achievements Badges Card */}
                        <Card className="md:col-span-4 bg-slate-950 border-slate-800 p-5 flex flex-col justify-between">
                            <CardHeader className="p-0 pb-4 border-b border-slate-900">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-450">Spotting Badges & Pins</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4 pt-5">
                                <div className={`p-3 border rounded-xl flex items-center gap-3 transition-all ${
                                    recentTrains.length >= 3 
                                        ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-400 glow-yellow' 
                                        : 'bg-slate-900/40 border-slate-900 text-slate-600'
                                }`}>
                                    <TrainFront className="h-6 w-6 shrink-0" />
                                    <div>
                                        <h4 className="text-[11px] font-bold uppercase">Frequent Railer</h4>
                                        <p className="text-[8px] text-slate-500 mt-0.5">Spotted 3+ route tracks</p>
                                    </div>
                                </div>

                                <div className={`p-3 border rounded-xl flex items-center gap-3 transition-all ${
                                    co2Saved >= 150 
                                        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 glow-green' 
                                        : 'bg-slate-900/40 border-slate-900 text-slate-600'
                                }`}>
                                    <Leaf className="h-6 w-6 shrink-0" />
                                    <div>
                                        <h4 className="text-[11px] font-bold uppercase">Eco-Warrior</h4>
                                        <p className="text-[8px] text-slate-500 mt-0.5">Saved 150+ kg CO2</p>
                                    </div>
                                </div>

                                <div className="p-3 border bg-yellow-500/5 border-yellow-500/20 text-yellow-400 glow-yellow rounded-xl flex items-center gap-3">
                                    <Star className="h-6 w-6 shrink-0" />
                                    <div>
                                        <h4 className="text-[11px] font-bold uppercase">Chime Master</h4>
                                        <p className="text-[8px] text-slate-500 mt-0.5">Proximity alarms trigger active</p>
                                    </div>
                                </div>

                                <div className="p-3 border bg-emerald-500/5 border-emerald-500/20 text-emerald-400 glow-green rounded-xl flex items-center gap-3">
                                    <ShieldCheck className="h-6 w-6 shrink-0" />
                                    <div>
                                        <h4 className="text-[11px] font-bold uppercase">Cabin Inspector</h4>
                                        <p className="text-[8px] text-slate-500 mt-0.5">PNR seating map locks cnfd</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-7 font-mono">
                        {/* User Active Spots Board */}
                        <Card className="md:col-span-4 bg-slate-950 border-slate-800">
                            <CardHeader className="border-b border-slate-900">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-450">Your Spotted Schedules</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {recentTrains.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500 text-xs font-sans font-medium">
                                        No spotted schedules active. Start tracking now!
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-900">
                                        {recentTrains.map(train => (
                                            <div key={train.id} className="p-4 flex items-center justify-between hover:bg-slate-900/40 transition-colors animate-fadeIn">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-bold text-yellow-500">#{train.number}</span>
                                                    <h4 className="text-sm font-bold text-slate-200 uppercase">{train.name}</h4>
                                                </div>
                                                <Link 
                                                    to="/live-map"
                                                    onClick={() => localStorage.setItem('locateBerthTrainId', train.id)}
                                                >
                                                    <Button size="sm" className="bg-slate-900 border border-slate-800 hover:border-yellow-500/30 text-yellow-500 font-bold text-[10px] h-9">
                                                        TRACK STATUS <ArrowRight className="h-3 w-3 ml-1.5" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Security Info Card */}
                        <Card className="md:col-span-3 bg-slate-950 border-slate-800 flex flex-col justify-between">
                            <CardHeader className="border-b border-slate-900">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-450">Security Info</CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4 text-xs">
                                <div className="space-y-1.5 border-b border-slate-900 pb-3">
                                    <div className="text-slate-500">Licensee Email:</div>
                                    <div className="font-bold text-yellow-500">{user?.email}</div>
                                </div>
                                <div className="space-y-1.5 border-b border-slate-900 pb-3">
                                    <div className="text-slate-500">Spotter Level:</div>
                                    <div className="font-bold text-slate-200 uppercase">{user?.role} ACCESS</div>
                                </div>
                                <div className="flex gap-2 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10 text-yellow-500 font-sans text-xs">
                                    <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                                    <p className="leading-relaxed">Keep your license active. Do not share your security credentials with third-party spotters.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                /* ================= TAB 2: ACTIVE PROFILE EDITOR ================= */
                <div className="grid gap-8 lg:grid-cols-12 items-start animate-fadeIn">
                    
                    {/* Left: Interactive Profile Editing form (col-span 7) */}
                    <div className="lg:col-span-7">
                        <Card className="bg-slate-955 border-slate-800 shadow-xl backdrop-blur-md">
                            <CardHeader className="border-b border-slate-900 pb-4">
                                <CardTitle className="text-sm font-bold font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Edit3 className="h-4.5 w-4.5 text-yellow-500" /> Dispatcher Profile details
                                </CardTitle>
                            </CardHeader>
                            
                            <CardContent className="p-6">
                                <form onSubmit={handleProfileUpdate} className="space-y-5 font-mono text-xs">
                                    {/* Alert prompt boxes */}
                                    {formError && (
                                        <div className="rounded-xl bg-rose-950/40 border border-rose-500/20 p-3 text-xs font-mono text-rose-455 flex items-center gap-2 animate-shake">
                                            <ShieldAlert className="h-4.5 w-4.5 shrink-0" /> {formError}
                                        </div>
                                    )}
                                    {formSuccess && (
                                        <div className="rounded-xl bg-emerald-950/40 border border-emerald-500/20 p-3 text-xs font-mono text-emerald-400 flex items-center gap-2 animate-slideDown">
                                            <CheckCircle2 className="h-4.5 w-4.5 shrink-0" /> {formSuccess}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <User className="h-3.5 w-3.5 text-yellow-500" /> Dispatcher Full Name
                                        </label>
                                        <input 
                                            type="text" 
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Enter your dispatcher name..."
                                            required
                                            className="w-full h-11 border border-slate-800 bg-slate-950 rounded-xl px-4 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <FileText className="h-3.5 w-3.5 text-yellow-500" /> Registered Email Address
                                        </label>
                                        <input 
                                            type="email" 
                                            value={email}
                                            disabled={user?.email === 'guest@railtrack.com'}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter email address..."
                                            required
                                            className="w-full h-11 border border-slate-800 bg-slate-950 rounded-xl px-4 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed"
                                        />
                                        {user?.email === 'guest@railtrack.com' && (
                                            <div className="text-[9px] text-slate-500 italic">Interviewer Guest credentials are write-locked for safety.</div>
                                        )}
                                    </div>

                                    <div className="border-t border-slate-900 pt-4 space-y-4">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                            <Lock className="h-3.5 w-3.5 text-yellow-500" /> Modify Security password (Optional)
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">New Password</label>
                                                <input 
                                                    type="password" 
                                                    value={newPassword}
                                                    disabled={user?.email === 'guest@railtrack.com'}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="w-full h-10 border border-slate-800 bg-slate-950 rounded-xl px-4 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                                                <input 
                                                    type="password" 
                                                    value={confirmPassword}
                                                    disabled={user?.email === 'guest@railtrack.com'}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="w-full h-10 border border-slate-800 bg-slate-950 rounded-xl px-4 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        isLoading={formLoading}
                                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold h-11 text-xs tracking-wider"
                                    >
                                        SAVE PROFILE CHANGES
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Security Clearance Stamp visual Certificate (col-span 5) */}
                    <div className="lg:col-span-5 space-y-4">
                        <Card className="bg-slate-950 border-slate-800 p-5 font-mono text-xs flex flex-col justify-between gap-6 shadow-xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-grid-white/[0.01] pointer-events-none" />
                            
                            <CardHeader className="p-0 pb-4 border-b border-slate-900 flex flex-row items-center gap-2">
                                <Fingerprint className="h-5 w-5 text-yellow-500 animate-pulse" />
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-455">CLEARANCE CERTIFICATE</CardTitle>
                            </CardHeader>
                            
                            <CardContent className="p-0 space-y-5 text-[11px] leading-relaxed">
                                <div className="space-y-1 bg-slate-900/60 p-4 border border-slate-900 rounded-2xl relative">
                                    <div className="text-slate-500 uppercase text-[9px] tracking-wider">Holographic Secure Hash ID:</div>
                                    <div className="font-bold text-yellow-500 flex justify-between items-center">
                                        <span>{secureHash}</span>
                                        <button 
                                            onClick={handleRegenerateHash}
                                            className="text-[8px] bg-slate-950 hover:bg-slate-855 border border-slate-800 text-slate-400 px-2 py-1 rounded"
                                        >
                                            GEN KEY
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3 font-mono text-xs text-slate-400">
                                    <div className="flex justify-between border-b border-slate-900 pb-2">
                                        <span className="text-slate-550">Account Issue Date:</span>
                                        <span className="font-bold text-slate-202">{accountCreatedDate}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-900 pb-2">
                                        <span className="text-slate-550">Clearance Status:</span>
                                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> VERIFIED SIGN-OFF
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-550">Access Level:</span>
                                        <span className="font-bold text-yellow-500 uppercase">{user?.role} NODE</span>
                                    </div>
                                </div>

                                {/* Custom stamp visual graphics */}
                                <div className="flex flex-col items-center justify-center py-6 border-t border-slate-900/80">
                                    <div className="h-28 w-28 rounded-full border-4 border-yellow-500/20 flex flex-col items-center justify-center text-center p-2 relative">
                                        <div className="absolute inset-0.5 rounded-full border border-dashed border-yellow-500/30" />
                                        <span className="text-[8px] font-black text-slate-500 tracking-widest uppercase">MINISTRY OF RAILWAYS</span>
                                        <div className="my-1 text-base animate-pulse">🚂</div>
                                        <span className="text-[7px] font-bold text-yellow-500/70 tracking-widest font-mono">SECURE DISPATCH</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            )}
        </div>
    );
};
