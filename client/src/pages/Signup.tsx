import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { ShieldAlert, UserPlus, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export const Signup = () => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
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
            await api.post('/auth/signup', { email, name, password });
            toast.success('Account created successfully! Please log in.');
            navigate('/login');
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to create account';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-12">
            <Card className="w-full max-w-md bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl">
                <CardHeader className="space-y-2 text-center">
                    <div className="mx-auto h-12 w-12 rounded-full bg-yellow-500 dark:bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-600 dark:text-yellow-500">
                        <UserPlus className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-2xl font-bold font-mono text-yellow-600 dark:text-yellow-400">CREATE ACCOUNT</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400 font-mono text-xs uppercase tracking-wider">
                        Register a new spotting license account
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
                            <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                                Full Name
                            </label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                minLength={2}
                                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-yellow-600 dark:text-yellow-400 font-mono placeholder:text-slate-600 dark:text-slate-600 focus:ring-yellow-500/30 focus:border-yellow-500"
                            />
                        </div>
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
                                Security Password (min 6 chars)
                            </label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
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
                            CREATE ACCOUNT
                        </Button>
                        <div className="text-center text-xs font-mono text-slate-500 dark:text-slate-500">
                            Already have an account?{" "}
                            <Link to="/login" className="hover:text-yellow-600 dark:text-yellow-400 underline underline-offset-4">
                                Sign in
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};
