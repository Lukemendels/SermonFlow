import { createClient } from '@/lib/supabase-server';
import { LayoutDashboard, LogOut, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect('/login');
    }

    return (
        <div className="flex h-screen bg-gray-950 text-white">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold tracking-tight">SermonFlow</h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <LayoutDashboard size={20} />
                        Overview
                    </Link>
                    <Link
                        href="/dashboard/new"
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <PlusCircle size={20} />
                        New Sermon
                    </Link>
                </nav>

                <div className="p-4 border-t border-white/10">
                    <form action="/auth/signout" method="post">
                        {/* Simple signout for now, or just a button that calls client side logic. 
                 Since this is a server component, we need client component for interactivity or a server action. 
                 Let's stick to a simple form post to specific route if we had one, or a client component button.
                 Actually, let's keep it simple and make a SignOut button client component later. 
                 For now, just a placeholder.
             */}
                        <div className="text-xs text-center text-gray-500">Logged in as {session.user.email}</div>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="container mx-auto max-w-7xl p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
