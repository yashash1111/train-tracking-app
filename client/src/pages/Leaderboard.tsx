import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Trophy, Medal, User as UserIcon, Loader2 } from 'lucide-react';

export const Leaderboard = () => {
    const [leaders, setLeaders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchLeaders = async () => {
            try {
                const res = await api.get('/auth/leaderboard');
                setLeaders(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaders();
    }, []);

    return (
        <div className="flex min-h-[calc(100vh-64px)] justify-center bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
            <Card className="w-full max-w-3xl bg-white dark:bg-slate-950/50 backdrop-blur-xl border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl h-fit">
                <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-row items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-yellow-500 dark:bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                        <Trophy className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-bold font-mono text-yellow-600 dark:text-yellow-400">GLOBAL LEADERBOARD</CardTitle>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-1 uppercase tracking-wider">Top Dispatchers & Spotters</p>
                    </div>
                </CardHeader>
                <CardContent className="pt-8">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="h-8 w-8 text-yellow-600 dark:text-yellow-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-4 font-mono">
                            {leaders.length === 0 ? (
                                <div className="text-center text-slate-500 dark:text-slate-500 py-12">No spotters found. Be the first to track a train!</div>
                            ) : (
                                leaders.map((user, index) => (
                                    <div 
                                        key={user._id} 
                                        className={`flex items-center gap-4 p-4 border rounded-xl transition-all ${
                                            index === 0 ? 'bg-yellow-500 dark:bg-yellow-500/5 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]' :
                                            index === 1 ? 'bg-slate-300/5 border-slate-400/30' :
                                            index === 2 ? 'bg-amber-700/5 border-amber-700/30' :
                                            'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700'
                                        }`}
                                    >
                                        <div className="text-2xl font-black w-12 text-center">
                                            {index === 0 ? <Medal className="h-10 w-10 text-yellow-600 dark:text-yellow-400 mx-auto glow-yellow" /> : 
                                            index === 1 ? <Medal className="h-9 w-9 text-slate-600 dark:text-slate-300 mx-auto" /> :
                                            index === 2 ? <Medal className="h-8 w-8 text-amber-700 mx-auto" /> :
                                            <span className="text-slate-500 dark:text-slate-500">#{index + 1}</span>}
                                        </div>
                                        
                                        <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-lg">
                                            {user.profilePhotoUrl ? (
                                                <img src={user.profilePhotoUrl} alt="Avatar" className="h-full w-full object-cover" />
                                            ) : (
                                                <UserIcon className="h-6 w-6 text-slate-500 dark:text-slate-500" />
                                            )}
                                        </div>
                                        
                                        <div className="flex-1">
                                            <h3 className={`text-lg font-bold ${index === 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                {user.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-slate-950 bg-slate-400 font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm">
                                                    {user.role}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="text-right flex flex-col items-end justify-center">
                                            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{user.points || 0}</div>
                                            <div className="text-[10px] text-slate-500 dark:text-slate-500 uppercase tracking-widest font-bold">XP Points</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
