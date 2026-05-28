import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Camera, Trash2, Loader2, User as UserIcon, ShieldAlert, CheckCircle2, Phone, FileText, Award } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import api from '../services/api';
import toast from 'react-hot-toast';

export const Profile = () => {
    const { user, updateUser } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await api.put('/auth/profile', { name, email, phone, bio });
            updateUser({ ...user!, ...res.data.user });
            toast.success('Profile updated successfully');
            setIsEditing(false);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        setUploading(true);
        setError('');
        setSuccess('');

        // 1. INSTANT OPTIMISTIC UI UPDATE
        // Create a local blob URL so the user sees the photo immediately
        const localUrl = URL.createObjectURL(file);
        updateUser({ ...user!, profilePhotoUrl: localUrl });

        try {
            const storageRef = ref(storage, `profiles/${user.id}/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (err) => {
                    toast.error('Failed to upload image: ' + err.message);
                    setUploading(false);
                    setUploadProgress(0);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        
                        await api.put('/auth/profile', { profilePhotoUrl: downloadURL });
                        // Replace the local URL with the real remote URL quietly
                        updateUser({ ...user!, profilePhotoUrl: downloadURL });
                        toast.success('Profile photo updated');
                    } catch (err: any) {
                        toast.error('Failed to save to database: ' + err.message);
                        updateUser({ ...user!, profilePhotoUrl: undefined });
                    } finally {
                        setUploading(false);
                        setUploadProgress(0);
                    }
                }
            );
        } catch (err: any) {
            toast.error('Upload error: ' + err.message);
            // Revert back if it fails
            updateUser({ ...user!, profilePhotoUrl: undefined });
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDeletePhoto = async () => {
        if (!user?.profilePhotoUrl) return;
        
        setLoading(true);
        setError('');
        setSuccess('');
        
        try {
            // Note: We are just clearing it from the DB. 
            // In a production app, you'd also want to delete it from Firebase Storage using deleteObject.
            const res = await api.put('/auth/profile', { removePhoto: true });
            updateUser({ ...user!, profilePhotoUrl: undefined });
            toast.success('Profile photo removed');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to remove photo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-64px)] justify-center bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
            <Card className="w-full max-w-2xl bg-white dark:bg-slate-950/50 backdrop-blur-xl border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl h-fit">
                <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-6">
                    <CardTitle className="text-2xl font-bold font-mono text-yellow-600 dark:text-yellow-400">OPERATOR PROFILE</CardTitle>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-1">Manage your identity and credentials</p>
                </CardHeader>

                <CardContent className="pt-8 space-y-8">
                    {error && (
                        <div className="rounded-md bg-rose-950/40 border border-rose-500/20 p-3 text-sm font-mono text-rose-600 dark:text-rose-400 flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 shrink-0" /> {error}
                        </div>
                    )}
                    {success && (
                        <div className="rounded-md bg-emerald-950/40 border border-emerald-500/20 p-3 text-sm font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0" /> {success}
                        </div>
                    )}

                    {/* Profile Photo Section */}
                    <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        <div className="relative group">
                            <div className="h-32 w-32 rounded-full overflow-hidden border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                                {uploading ? (
                                    <Loader2 className="h-8 w-8 animate-spin text-yellow-600 dark:text-yellow-500" />
                                ) : user?.profilePhotoUrl ? (
                                    <img src={user.profilePhotoUrl} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <UserIcon className="h-12 w-12 text-slate-400 dark:text-slate-500" />
                                )}
                            </div>
                            
                            {/* Hidden file input */}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handlePhotoUpload} 
                                accept="image/*"
                                className="hidden" 
                            />
                            
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-yellow-500 dark:bg-yellow-500 text-slate-950 flex items-center justify-center hover:bg-yellow-400 hover:scale-110 transition-all shadow-lg border-2 border-slate-950"
                            >
                                <Camera className="h-4 w-4" />
                            </button>
                        </div>
                        
                        <div className="flex flex-col items-center md:items-start gap-3 text-center md:text-left">
                            <div>
                                <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200">Avatar Authorization</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1 max-w-xs">Upload a clear photo for identification on the spotter network.</p>
                            </div>
                            
                            {uploading && (
                                <div className="w-full max-w-xs space-y-1">
                                    <div className="flex justify-between text-[10px] font-mono text-yellow-600 dark:text-yellow-500">
                                        <span>UPLOADING...</span>
                                        <span>{Math.round(uploadProgress)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white dark:bg-slate-950 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-yellow-500 dark:bg-yellow-500 transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 mt-1">
                                <Button 
                                    size="sm" 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={loading || uploading}
                                    className="bg-yellow-500 dark:bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold text-xs"
                                >
                                    CHANGE PHOTO
                                </Button>
                                {user?.profilePhotoUrl && (
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={handleDeletePhoto}
                                        disabled={loading || uploading}
                                        className="text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-950/30 text-xs"
                                    >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        REMOVE PHOTO
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="ml-auto flex gap-4 hidden lg:flex">
                            <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 w-28">
                                <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-500 mb-2" />
                                <span className="text-xl font-black text-yellow-600 dark:text-yellow-400 font-mono">{(user as any)?.points || 0}</span>
                                <span className="text-[9px] uppercase tracking-widest text-slate-500 dark:text-slate-500 font-bold mt-1">XP Points</span>
                            </div>
                        </div>
                    </div>

                    {/* Profile Details Form */}
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-lg border border-slate-200 dark:border-slate-800 relative">
                        {!isEditing ? (
                            <Button
                                onClick={() => setIsEditing(true)}
                                className="absolute top-4 right-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs h-8"
                            >
                                EDIT PROFILE
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => setIsEditing(false)}
                                className="absolute top-4 right-4 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 text-xs h-8"
                            >
                                CANCEL
                            </Button>
                        )}
                        
                        <form onSubmit={handleProfileUpdate} className="space-y-6 pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5">
                                        <UserIcon className="h-3 w-3 text-yellow-600 dark:text-yellow-500" /> Operator Name
                                    </label>
                                    {isEditing ? (
                                        <Input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-yellow-600 dark:text-yellow-400 font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-yellow-500/30 focus:border-yellow-500 h-12"
                                        />
                                    ) : (
                                        <div className="h-12 flex items-center px-3 font-mono text-yellow-600 dark:text-yellow-400 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-300 dark:border-slate-700">
                                            {name || '-'}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5">
                                        <Phone className="h-3 w-3 text-yellow-600 dark:text-yellow-500" /> Contact Phone
                                    </label>
                                    {isEditing ? (
                                        <Input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+91 "
                                            className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-yellow-600 dark:text-yellow-400 font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-yellow-500/30 focus:border-yellow-500 h-12"
                                        />
                                    ) : (
                                        <div className="h-12 flex items-center px-3 font-mono text-yellow-600 dark:text-yellow-400 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-300 dark:border-slate-700">
                                            {phone || '-'}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5">
                                        <FileText className="h-3 w-3 text-slate-500 dark:text-slate-400" /> Dispatcher Bio
                                    </label>
                                    {isEditing ? (
                                        <textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            placeholder="Enter your experience, active regions, and spotting preferences..."
                                            className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-yellow-500/30 focus:border-yellow-500 min-h-[100px] resize-none"
                                        />
                                    ) : (
                                        <div className={`p-4 rounded-lg border border-slate-300 dark:border-slate-700 font-mono min-h-[100px] bg-slate-100 dark:bg-slate-800/50 ${!bio ? 'text-slate-400 dark:text-slate-500 italic' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {bio || 'No bio provided.'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isEditing && (
                                <div className="pt-4 flex justify-end">
                                    <Button type="submit" isLoading={loading} className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold font-mono px-8">
                                        SAVE CHANGES
                                    </Button>
                                </div>
                            )}
                        </form>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
};
