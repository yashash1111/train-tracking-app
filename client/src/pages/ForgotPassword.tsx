import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { ShieldAlert, KeyRound, CheckCircle2, TrainFront } from 'lucide-react';

export const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // UI flow control
    const [step, setStep] = useState<1 | 2>(1);
    const [simulatedOtp, setSimulatedOtp] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // Step 1: Request OTP
    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await api.post('/auth/forgot-password', { email });
            setSimulatedOtp(res.data.otp);
            setSuccess(`OTP Code generated! Enter the code below to complete your reset.`);
            setStep(2);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to request reset OTP');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Complete Password Reset
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            await api.post('/auth/reset-password', { email, otp, newPassword });
            setSuccess('Password reset successfully! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset password');
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
                    <CardTitle className="text-2xl font-bold font-mono text-yellow-400">RESET PASSWORD</CardTitle>
                    <CardDescription className="text-slate-400 font-mono text-xs uppercase tracking-wider">
                        {step === 1 ? 'Step 1: Security Spotting' : 'Step 2: Security Verification'}
                    </CardDescription>
                </CardHeader>
                
                {step === 1 ? (
                    // Step 1 Form
                    <form onSubmit={handleRequestOtp}>
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="rounded-md bg-rose-950/40 border border-rose-500/20 p-3 text-xs font-mono text-rose-400 flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4 shrink-0" /> {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                                    Registered Email Address
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
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4">
                            <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold h-11" type="submit" isLoading={loading}>
                                REQUEST RESET OTP
                            </Button>
                            <div className="text-center text-xs font-mono text-slate-500">
                                Back to{" "}
                                <Link to="/login" className="hover:text-yellow-400 underline underline-offset-4">
                                    Sign In
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                ) : (
                    // Step 2 Form
                    <form onSubmit={handleResetPassword}>
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="rounded-md bg-rose-950/40 border border-rose-500/20 p-3 text-xs font-mono text-rose-400 flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4 shrink-0" /> {error}
                                </div>
                            )}
                            
                            {success && (
                                <div className="rounded-md bg-emerald-950/40 border border-emerald-500/20 p-3.5 text-xs font-mono text-emerald-400 flex flex-col gap-2">
                                    <div className="flex items-center gap-2 font-bold">
                                        <CheckCircle2 className="h-4 w-4 shrink-0" /> Security Notice
                                    </div>
                                    <p>An email was dispatched containing your OTP.</p>
                                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-2.5 rounded-lg text-yellow-500 font-bold mt-1 text-center text-sm tracking-widest">
                                        DEMO OTP CODE: {simulatedOtp}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label htmlFor="otp" className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                                    Enter 6-Digit OTP Code
                                </label>
                                <Input
                                    id="otp"
                                    type="text"
                                    maxLength={6}
                                    placeholder="Enter OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    className="bg-slate-900 border-slate-800 text-yellow-400 font-mono tracking-widest text-center text-lg placeholder:text-slate-600 focus:ring-yellow-500/30 focus:border-yellow-500 h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="newPassword" className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                                    New Security Password
                                </label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="bg-slate-900 border-slate-800 text-yellow-400 font-mono placeholder:text-slate-600 focus:ring-yellow-500/30 focus:border-yellow-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                                    Confirm New Password
                                </label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="bg-slate-900 border-slate-800 text-yellow-400 font-mono placeholder:text-slate-600 focus:ring-yellow-500/30 focus:border-yellow-500"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4">
                            <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold h-11" type="submit" isLoading={loading}>
                                RESET SECURITY PASSWORD
                            </Button>
                            <div className="text-center text-xs font-mono text-slate-500">
                                Try again?{" "}
                                <button type="button" onClick={() => setStep(1)} className="hover:text-yellow-400 underline underline-offset-4">
                                    Request another OTP
                                </button>
                            </div>
                        </CardFooter>
                    </form>
                )}
            </Card>
        </div>
    );
};
