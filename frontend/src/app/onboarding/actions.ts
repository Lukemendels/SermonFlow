'use server';

import { createClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export type OnboardingData = {
    churchName: string;
    website: string;
    denomination: string;
    socials: {
        instagram: string;
        facebook: string;
    };
};

export async function submitOnboardingRequest(data: OnboardingData) {
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        // Ideally redirect to login, but for this flow we might just return error
        throw new Error('User not authenticated');
    }

    const { error } = await supabase.from('onboarding_requests').insert({
        user_id: user.id,
        church_name: data.churchName,
        website: data.website,
        denomination: data.denomination,
        social_links: data.socials,
        status: 'pending_research',
    });

    if (error) {
        console.error('Error submitting onboarding request:', error);
        throw new Error('Failed to submit request');
    }

    // Mock Email Trigger
    console.log('Sending system email to admin@sermonflow.com...');
    console.log(`New Church Ready for Research: ${data.churchName}`);

    // Redirect happens on client side usually for smoother transition, or here
    // But we'll return success and let client redirect or show success message then redirect
    return { success: true };
}
