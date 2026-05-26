import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { ShieldAlert, KeyRound } from 'lucide-react';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/auth/login', { email, password });
            login(res.data.accessToken, res.data.refreshToken, res.data.user);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/guest');
            login(res.data.accessToken, res.data.refreshToken, res.data.user);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Guest login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-900 px-4 py-12">
            <Card className="w-full max-w-md bg-slate-950 border-slate-800 text-slate-100 shadow-2xl">
                <CardHeader className="space-y-2 text-center">
                    <div className="mx-auto h-12 w-12 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
                        <KeyRound className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-2xl font-bold font-mono text-yellow-400">SIGN IN</CardTitle>
                    <CardDescription className="text-slate-400 font-mono text-xs uppercase tracking-wider">
                        Enter credentials to access spotted dashboard
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="rounded-md bg-rose-950/40 border border-rose-500/20 p-3 text-xs font-mono text-rose-400 flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4 shrink-0" /> {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                                Email Address
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-slate-900 border-slate-800 text-yellow-400 font-mono placeholder:text-slate-600 focus:ring-yellow-500/30 focus:border-yellow-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                                Security Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-slate-900 border-slate-800 text-yellow-400 font-mono placeholder:text-slate-600 focus:ring-yellow-500/30 focus:border-yellow-500"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold h-11" type="submit" isLoading={loading}>
                            SIGN IN
                        </Button>

                        <div className="relative flex items-center justify-center w-full my-1 font-mono text-[9px] uppercase text-slate-600">
                            <span className="absolute w-full h-[1px] bg-slate-900 z-0"></span>
                            <span className="relative px-2 bg-slate-950 z-10">or spot as observer</span>
                        </div>

                        <Button 
                            type="button" 
                            onClick={handleGuestLogin} 
                            isLoading={loading}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-350 border border-slate-800 hover:border-emerald-500/40 font-bold h-11 transition-all"
                        >
                            GUEST SIGN IN (INTERVIEWER)
                        </Button>

                        <div className="text-center text-xs font-mono text-slate-500">
                            <Link to="/forgot-password" className="hover:text-yellow-400 underline underline-offset-4">
                                Forgot password?
                            </Link>
                        </div>
                        <div className="text-center text-xs font-mono text-slate-500">
                            Don&apos;t have an account?{" "}
                            <Link to="/signup" className="hover:text-yellow-400 underline underline-offset-4">
                                Sign up
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};
