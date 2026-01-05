import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { activateUser } from '../../actions'

export default async function AdminUserDetail(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch { }
                },
            },
        }
    )

    const { data: request, error } = await supabase
        .from('onboarding_requests')
        .select('*')
        .eq('id', params.id)
        .single()

    if (error || !request) {
        return <div>Request not found</div>
    }

    const defaultLexicon = "Grace, Redemption, Stewardship, Fellowship"
    const defaultBranding = JSON.stringify({
        primary_color: "#000000",
        secondary_color: "#ffffff",
        font_header: "Inter",
        font_body: "Inter"
    }, null, 2)

    const defaultTone = "Warm, Invitational, Modern"

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Inject Research: {request.church_name}</h1>

            <div className="bg-gray-50 p-4 mb-8 rounded border">
                <h2 className="font-semibold mb-2">Request Details</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">User ID:</span> {request.user_id}</div>
                    <div><span className="font-medium">Website:</span> <a href={request.website} target="_blank" className="text-blue-600">{request.website}</a></div>
                    <div><span className="font-medium">Denomination:</span> {request.denomination}</div>
                    <div><span className="font-medium">Status:</span> {request.status}</div>
                    <div className="col-span-2">
                        <span className="font-medium">Social Links:</span>
                        <pre className="mt-1 text-xs bg-gray-200 p-2 rounded overflow-auto">
                            {JSON.stringify(request.social_links, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>

            <form action={activateUser} className="space-y-6">
                <input type="hidden" name="requestId" value={request.id} />
                <input type="hidden" name="churchName" value={request.church_name} />

                <div>
                    <label className="block text-sm font-medium text-gray-700">Theological Leaning</label>
                    <input
                        name="theology"
                        defaultValue={request.denomination || "Non-Denominational"}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">Short description of theological stance.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Voice Tone (Comma separated adjectives)</label>
                    <input
                        name="voiceTone"
                        defaultValue={defaultTone}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Insider Lexicon (Comma separated)</label>
                    <textarea
                        name="insiderLexicon"
                        defaultValue={defaultLexicon}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">Specific words/phrases used by this church.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Brand Hex Codes & Fonts (JSON)</label>
                    <textarea
                        name="brandingJson"
                        defaultValue={defaultBranding}
                        rows={6}
                        className="font-mono mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">Valid JSON object required.</p>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Activate & Inject Research
                    </button>
                </div>
            </form>
        </div>
    )
}
