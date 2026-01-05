'use client';

import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewSermonPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [transcript, setTranscript] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Get Church ID (For this demo, we pick the first one or create one)
            // In a real app, the user would belong to a church organization.
            // We will look for an existing church or default to a placeholder ID if needed.
            // But we need a valid UUID. Let's create a church if strictly needed or fetch one.

            let { data: churches } = await supabase.from('churches').select('id').limit(1);
            let churchId = churches?.[0]?.id;

            if (!churchId) {
                // Fallback: This user needs to create a church first? 
                // For simplicity in this demo, we assume the SQL setup script was run.
                // If not, we error out nicely.
                alert('No church found. Please run the SQL setup script to create a church.');
                setLoading(false);
                return;
            }

            // 2. Insert Sermon
            const { error } = await supabase.from('sermons').insert({
                church_id: churchId,
                title: title,
                transcript: transcript,
            });

            if (error) throw error;

            router.push('/dashboard');
            router.refresh();

        } catch (error) {
            console.error('Error creating sermon:', error);
            alert('Error creating sermon');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4"
                >
                    <ChevronLeft size={16} className="mr-1" />
                    Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold">Upload New Sermon</h1>
                <p className="text-gray-400 mt-2">Paste the transcript below to start generating content.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Sermon Title</label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. The Power of Community"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Transcript</label>
                    <textarea
                        required
                        rows={12}
                        placeholder="Paste full sermon transcript here..."
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm leading-relaxed"
                    />
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-white text-black px-8 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Sermon'}
                    </button>
                </div>
            </form>
        </div>
    );
}
