'use client';

import { createClient } from '@/lib/supabase';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronLeft, FileText, Loader2, RefreshCw, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// Asset Types Definition
const ASSET_TYPES = [
    { id: 'email_recap', label: 'Email Recap', icon: Send },
    { id: 'devotional', label: '5-Day Devo', icon: FileText },
    { id: 'small_group', label: 'Small Group', icon: FileText },
    { id: 'family_discussion', label: 'Family Guide', icon: FileText },
    { id: 'guest_follow_up', label: 'Guest Follow-up', icon: Send },
    { id: 'service_host', label: 'Host Script', icon: FileText },
];

export default function SermonWorkspace({ params }: { params: { id: string } }) {
    const router = useRouter();
    const supabase = createClient();
    const [sermon, setSermon] = useState<any>(null);
    const [assets, setAssets] = useState<any[]>([]);
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchData();
        // Poll for updates every 5 seconds (Realtime would be better but polling is easy/robust)
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [params.id]);

    const fetchData = async () => {
        // Fetch Sermon
        const { data: sermonData } = await supabase
            .from('sermons')
            .select('*')
            .eq('id', params.id)
            .single();

        setSermon(sermonData);

        // Fetch Assets
        const { data: assetData } = await supabase
            .from('assets')
            .select('*')
            .eq('sermon_id', params.id)
            .order('created_at', { ascending: false });

        setAssets(assetData || []);
    };

    const handleGenerate = async (assetType: string) => {
        setLoadingMap(prev => ({ ...prev, [assetType]: true }));
        try {
            await api.post('/generate-asset', {
                sermon_id: params.id,
                asset_type: assetType,
            });
            // We don't wait for PDF here necessarily if it's long, 
            // but api returns when PDF done in our V2 backend logic.
            await fetchData();
        } catch (error) {
            console.error('Generation error:', error);
            alert('Failed to generate asset.');
        } finally {
            setLoadingMap(prev => ({ ...prev, [assetType]: false }));
        }
    };

    if (!sermon) return <div className="p-8 text-white">Loading workspace...</div>;

    return (
        <div className="h-[calc(100vh-4rem)] flex gap-6">
            {/* LEFT: Transcript / Details */}
            <div className="w-1/3 flex flex-col space-y-4 overflow-hidden">
                <div>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-2"
                    >
                        <ChevronLeft size={16} className="mr-1" />
                        Back
                    </Link>
                    <h1 className="text-2xl font-bold truncate">{sermon.title}</h1>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Transcript Preview</p>
                </div>

                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 overflow-y-auto font-mono text-sm text-gray-300 leading-relaxed">
                    {sermon.transcript}
                </div>
            </div>

            {/* RIGHT: Generator Grid & Assets */}
            <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
                {/* Generation Grid */}
                <div>
                    <h2 className="text-lg font-semibold mb-3">Generate Content</h2>
                    <div className="grid grid-cols-3 gap-3">
                        {ASSET_TYPES.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => handleGenerate(type.id)}
                                disabled={loadingMap[type.id]}
                                className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all text-left disabled:opacity-50"
                                title="Click to Generate"
                            >
                                <div className={`p-2 rounded-lg ${loadingMap[type.id] ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-gray-300'}`}>
                                    {loadingMap[type.id] ? <Loader2 size={18} className="animate-spin" /> : <type.icon size={18} />}
                                </div>
                                <div>
                                    <div className="font-medium text-sm">{type.label}</div>
                                    <div className="text-xs text-gray-500">AI Generated</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Asset List */}
                <div className="flex-1 min-h-0 flex flex-col">
                    <h2 className="text-lg font-semibold mb-3 flex items-center justify-between">
                        <span>Generated Assets</span>
                        <button onClick={fetchData} className="p-1 hover:bg-white/10 rounded"><RefreshCw size={14} /></button>
                    </h2>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {assets.map((asset) => (
                            <div key={asset.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-green-500/20 text-green-400 rounded-lg">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <div className="font-semibold capitalize text-sm">{asset.type.replace('_', ' ')}</div>
                                        <div className="text-xs text-gray-400">
                                            {new Date(asset.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {asset.status === 'processing' && (
                                        <span className="flex items-center gap-2 text-yellow-500 text-xs bg-yellow-500/10 px-2 py-1 rounded">
                                            <Loader2 size={12} className="animate-spin" /> Generating...
                                        </span>
                                    )}
                                    {asset.status === 'failed' && (
                                        <span className="flex items-center gap-2 text-red-500 text-xs bg-red-500/10 px-2 py-1 rounded">
                                            <AlertCircle size={12} /> Failed
                                        </span>
                                    )}
                                    {asset.status === 'completed' && (
                                        <a
                                            href={asset.pdf_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 bg-white text-black text-xs font-bold px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            View PDF
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}

                        {assets.length === 0 && (
                            <div className="text-center py-10 text-gray-500 italic text-sm">
                                No assets generated yet. Click a button above!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
