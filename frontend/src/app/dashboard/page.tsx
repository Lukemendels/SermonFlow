import { createClient } from '@/lib/supabase-server';
import { Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
    const supabase = await createClient();

    // Fetch recent sermons
    const { data: sermons } = await supabase
        .from('sermons')
        .select('*, churches(name)')
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Your Sermons</h2>
                <Link
                    href="/dashboard/new"
                    className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                    Upload New
                </Link>
            </div>

            <div className="grid gap-4">
                {sermons?.map((sermon: any) => (
                    <Link
                        key={sermon.id}
                        href={`/dashboard/sermon/${sermon.id}`}
                        className="block group"
                    >
                        <div className="border border-white/10 bg-white/5 rounded-xl p-6 transition-colors hover:border-white/20 hover:bg-white/10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold mb-1">
                                        {sermon.title || 'Untitled Sermon'}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {new Date(sermon.created_at).toLocaleDateString()}
                                        </span>
                                        <span>{sermon.churches?.name}</span>
                                    </div>
                                </div>
                                <ChevronRight className="text-gray-500 group-hover:text-white transition-colors" />
                            </div>
                        </div>
                    </Link>
                ))}

                {(!sermons || sermons.length === 0) && (
                    <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
                        <p className="text-gray-400">No sermons found. Upload your first one!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
