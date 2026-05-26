import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { LogOut, TrainFront, LayoutDashboard, Map, Compass } from 'lucide-react';

export const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showConfirmLogout, setShowConfirmLogout] = useState(false);

    const handleLogoutConfirm = () => {
        logout();
        setShowConfirmLogout(false);
        navigate('/login');
    };

    return (
        <nav className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 shadow-md">
            <div className="container flex h-16 items-center justify-between px-4">
                <Link to="/" className="flex items-center gap-2 font-bold text-xl font-mono text-yellow-400 group">
                    <div className="h-9 w-9 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 group-hover:bg-yellow-500 group-hover:text-slate-950 transition-all duration-300">
                        <TrainFront className="h-5 w-5" />
                    </div>
                    <span className="tracking-widest uppercase text-sm md:text-base">RAIL TRAIN</span>
                </Link>

                <div className="flex items-center gap-4 md:gap-6">
                    <Link to="/live-map" className="text-xs font-bold font-mono tracking-wider uppercase text-slate-300 hover:text-yellow-400 transition-colors flex items-center gap-1">
                        <Map className="h-3.5 w-3.5" /> <span className="hidden md:inline">Live Map</span>
                    </Link>
                    <Link to="/trains" className="text-xs font-bold font-mono tracking-wider uppercase text-slate-300 hover:text-yellow-400 transition-colors flex items-center gap-1">
                        <Compass className="h-3.5 w-3.5" /> <span className="hidden md:inline">Spotter Board</span>
                    </Link>

                    {user ? (
                        <>
                            <Link to="/dashboard" className="text-xs font-bold font-mono tracking-wider uppercase text-slate-300 hover:text-yellow-400 transition-colors flex items-center gap-1">
                                <LayoutDashboard className="h-3.5 w-3.5" /> <span className="hidden md:inline">Control Board</span>
                            </Link>
                            <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
                                <span className="text-xs font-bold font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded hidden md:inline-block max-w-[120px] truncate" title={user.email}>
                                    {user.name || user.email.split('@')[0]}
                                </span>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => setShowConfirmLogout(true)} 
                                    title="Logout"
                                    className="h-8 w-8 text-slate-400 hover:text-rose-455 border border-slate-800 hover:border-rose-500/30"
                                >
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link to="/login">
                                <Button variant="ghost" size="sm" className="text-xs font-bold font-mono text-slate-300 hover:text-slate-100 h-9 px-4 border border-slate-800 hover:bg-slate-900">
                                    LOGIN
                                </Button>
                            </Link>
                            <Link to="/signup">
                                <Button size="sm" className="text-xs font-bold font-mono bg-yellow-500 hover:bg-yellow-600 text-slate-950 h-9 px-4 shadow-lg shadow-yellow-500/10">
                                    GET LICENSE
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Logout Confirmation Popup Modal */}
            {showConfirmLogout && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <Card className="max-w-md w-full border-rose-500/30 bg-slate-950 text-slate-100 shadow-2xl border font-mono">
                        <CardHeader className="border-b border-slate-900 pb-4">
                            <CardTitle className="text-base font-bold tracking-wider text-rose-550 flex items-center gap-2">
                                <LogOut className="h-4.5 w-4.5 text-rose-500" /> TERMINATE DISPATCH SESSION
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <p className="text-xs text-slate-400 leading-relaxed font-sans">
                                Are you sure you want to end your active train spotting session? This will terminate your cellular-GPS dispatcher license key until your next log in.
                            </p>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button 
                                    variant="ghost"
                                    onClick={() => setShowConfirmLogout(false)}
                                    className="text-xs border-slate-800 text-slate-400 hover:text-slate-200"
                                >
                                    CANCEL
                                </Button>
                                <Button 
                                    onClick={handleLogoutConfirm}
                                    className="text-xs bg-rose-500 hover:bg-rose-600 text-slate-950 font-bold"
                                >
                                    TERMINATE
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </nav>
    );
};
