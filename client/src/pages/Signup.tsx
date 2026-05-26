import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { ShieldAlert, UserPlus } from 'lucide-react';

export const Signup = () => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
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
            const res = await api.post('/auth/signup', { email, name, password });
            login(res.data.accessToken, res.data.refreshToken, res.data.user);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-900 px-4 py-12">
            <Card className="w-full max-w-md bg-slate-950 border-slate-800 text-slate-100 shadow-2xl">
                <CardHeader className="space-y-2 text-center">
                    <div className="mx-auto h-12 w-12 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
                        <UserPlus className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-2xl font-bold font-mono text-yellow-400">CREATE ACCOUNT</CardTitle>
                    <CardDescription className="text-slate-400 font-mono text-xs uppercase tracking-wider">
                        Register a new spotting license account
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
                            <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
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
                                className="bg-slate-900 border-slate-800 text-yellow-400 font-mono placeholder:text-slate-600 focus:ring-yellow-500/30 focus:border-yellow-500"
                            />
                        </div>
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
                                Security Password (min 6 chars)
                            </label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="bg-slate-900 border-slate-800 text-yellow-400 font-mono placeholder:text-slate-600 focus:ring-yellow-500/30 focus:border-yellow-500"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold h-11" type="submit" isLoading={loading}>
                            CREATE ACCOUNT
                        </Button>
                        <div className="text-center text-xs font-mono text-slate-500">
                            Already have an account?{" "}
                            <Link to="/login" className="hover:text-yellow-400 underline underline-offset-4">
                                Sign in
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};
