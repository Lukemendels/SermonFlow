'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function activateUser(formData: FormData) {
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
                    // handled by middleware usually, but good for completeness
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch { }
                },
            },
        }
    )

    const requestId = formData.get('requestId') as string
    const churchName = formData.get('churchName') as string
    const theology = formData.get('theology') as string
    const voiceTone = formData.get('voiceTone') as string
    const insiderLexiconRaw = formData.get('insiderLexicon') as string
    const brandingJsonRaw = formData.get('brandingJson') as string

    // Parse JSON fields
    const insiderLexicon = insiderLexiconRaw.split(',').map(s => s.trim())

    let brandingAssets = {}
    try {
        brandingAssets = JSON.parse(brandingJsonRaw)
    } catch (e) {
        throw new Error('Invalid JSON for Branding Assets')
    }

    // Construct Deep Research Profile
    const deepResearchProfile = {
        church_name: churchName,
        theology,
        voice_tone: voiceTone.split(',').map(s => s.trim()),
        insider_lexicon: insiderLexicon,
        // Default/placeholder values for other fields if needed
        slogan: "Welcome Home",
    }

    // 1. Get request details to get user_id
    const { data: requestData, error: requestError } = await supabase
        .from('onboarding_requests')
        .select('user_id')
        .eq('id', requestId)
        .single()

    if (requestError || !requestData) {
        throw new Error('Request not found')
    }

    // 2. Insert into churches
    const { error: insertError } = await supabase
        .from('churches')
        .insert({
            name: churchName,
            deep_research_profile: deepResearchProfile,
            branding_assets: brandingAssets
        })

    if (insertError) {
        throw new Error('Failed to create church: ' + insertError.message)
    }

    // 3. Update onboarding_requests status
    const { error: updateError } = await supabase
        .from('onboarding_requests')
        .update({ status: 'active' })
        .eq('id', requestId)

    if (updateError) {
        throw new Error('Failed to update request status')
    }

    // 4. Mock Email Trigger
    console.log(`[MOCK EMAIL] To: User ${requestData.user_id}, Subject: Your profile is ready!`)

    redirect('/admin')
}
