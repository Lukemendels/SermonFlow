'use client';

import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        try {
            await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${location.origin}/auth/callback`,
                },
            });
        } catch (error) {
            console.error('Login error:', error);
            alert('Error logging in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
            <div className="w-full max-w-md space-y-8 p-8 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-xl">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight">SermonFlow</h2>
                    <p className="mt-2 text-sm text-gray-400">Sign in to your dashboard</p>
                </div>

                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-black font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                    {loading ? 'Redirecting...' : 'Sign in with Google'}
                </button>
            </div>
        </div>
    );
}
