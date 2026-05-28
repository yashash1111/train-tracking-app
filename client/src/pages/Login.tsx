import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { ShieldAlert, KeyRound, Eye, EyeOff } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import toast from 'react-hot-toast';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
            toast.success('Successfully logged in');
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to login');
            toast.error(err.response?.data?.message || 'Failed to login');
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

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            const token = await user.getIdToken();
            const refreshToken = user.refreshToken;
            
            const userData = {
                id: user.uid,
                email: user.email || '',
                role: 'USER' as const,
                name: user.displayName || ''
            };
            
            login(token, refreshToken, userData);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Google sign in failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-12">
            <Card className="w-full max-w-md bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl">
                <CardHeader className="space-y-2 text-center">
                    <div className="mx-auto h-12 w-12 rounded-full bg-yellow-500 dark:bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-600 dark:text-yellow-500">
                        <KeyRound className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-2xl font-bold font-mono text-yellow-600 dark:text-yellow-400">SIGN IN</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400 font-mono text-xs uppercase tracking-wider">
                        Enter credentials to access spotted dashboard
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="rounded-md bg-rose-950/40 border border-rose-500/20 p-3 text-xs font-mono text-rose-600 dark:text-rose-400 flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4 shrink-0" /> {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                                Email Address
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-yellow-600 dark:text-yellow-400 font-mono placeholder:text-slate-600 dark:text-slate-600 focus:ring-yellow-500/30 focus:border-yellow-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                                Security Password
                            </label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-yellow-600 dark:text-yellow-400 font-mono placeholder:text-slate-600 dark:text-slate-600 focus:ring-yellow-500/30 focus:border-yellow-500 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:text-slate-300 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button className="w-full bg-yellow-500 dark:bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold h-11" type="submit" isLoading={loading}>
                            SIGN IN
                        </Button>

                        <div className="relative flex items-center justify-center w-full my-1 font-mono text-[9px] uppercase text-slate-600 dark:text-slate-600">
                            <span className="absolute w-full h-[1px] bg-slate-50 dark:bg-slate-900 z-0"></span>
                            <span className="relative px-2 bg-white dark:bg-slate-950 z-10">or spot as observer</span>
                        </div>

                        <Button 
                            type="button" 
                            onClick={handleGuestLogin} 
                            isLoading={loading}
                            className="w-full bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 hover:text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 font-bold h-11 transition-all"
                        >
                            GUEST SIGN IN (INTERVIEWER)
                        </Button>

                        <div className="relative flex items-center justify-center w-full my-1 font-mono text-[9px] uppercase text-slate-600 dark:text-slate-600">
                            <span className="absolute w-full h-[1px] bg-slate-50 dark:bg-slate-900 z-0"></span>
                            <span className="relative px-2 bg-white dark:bg-slate-950 z-10">or continue with</span>
                        </div>

                        <Button 
                            type="button" 
                            onClick={handleGoogleLogin} 
                            isLoading={loading}
                            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold h-11 transition-all flex items-center justify-center gap-2 border border-slate-200"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            SIGN IN WITH GOOGLE
                        </Button>

                        <div className="text-center text-xs font-mono text-slate-500 dark:text-slate-500">
                            <Link to="/forgot-password" className="hover:text-yellow-600 dark:text-yellow-400 underline underline-offset-4">
                                Forgot password?
                            </Link>
                        </div>
                        <div className="text-center text-xs font-mono text-slate-500 dark:text-slate-500">
                            Don&apos;t have an account?{" "}
                            <Link to="/signup" className="hover:text-yellow-600 dark:text-yellow-400 underline underline-offset-4">
                                Sign up
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};
