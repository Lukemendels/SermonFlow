'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { submitOnboardingRequest, OnboardingData } from './actions';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

type Message = {
    role: 'system' | 'user';
    content: string;
};

type Step = 'none' | 'churchName' | 'website' | 'denomination' | 'socials' | 'summary' | 'completed';

export default function OnboardingPage() {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [currentStep, setCurrentStep] = useState<Step>('none');
    const [data, setData] = useState<OnboardingData>({
        churchName: '',
        website: '',
        denomination: '',
        socials: { instagram: '', facebook: '' },
    });
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Helper functions
    const addSystemMessage = (text: string) => {
        setMessages((prev) => [...prev, { role: 'system', content: text }]);
    };

    const addUserMessage = (text: string) => {
        setMessages((prev) => [...prev, { role: 'user', content: text }]);
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userText = inputValue.trim();
        setInputValue('');
        addUserMessage(userText);

        // Simulate thinking/typing delay
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 600));
        setLoading(false);

        switch (currentStep) {
            case 'churchName':
                setData((prev) => ({ ...prev, churchName: userText }));
                addSystemMessage(`Thank you. It is a blessing to serve ${userText}. Do you have a website URL we can reference?`);
                setCurrentStep('website');
                break;

            case 'website':
                setData((prev) => ({ ...prev, website: userText }));
                addSystemMessage("Excellent. Understanding your theological tradition helps us tailor the experience. What represents your theology or denomination?");
                setCurrentStep('denomination');
                break;

            case 'denomination':
                setData((prev) => ({ ...prev, denomination: userText }));
                addSystemMessage("Understood. Finally, to help us connect with your community's voice, could you share your Instagram or Facebook handles? (You can say 'none' if skipped)");
                setCurrentStep('socials');
                break;

            case 'socials':
                // Basic parsing for demo purposes
                setData((prev) => ({
                    ...prev,
                    socials: { instagram: userText, facebook: userText }, // Storing same for now or simple string
                }));
                addSystemMessage("I have gathered all the necessary details. Please review the summary below.");
                setCurrentStep('summary');
                break;

            default:
                break;
        }
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await submitOnboardingRequest(data);
            addSystemMessage("Your request has been submitted. Our researchers will now begin the deep work of analyzing your sermons and style. You will be redirected shortly.");
            setCurrentStep('completed');
            setTimeout(() => {
                router.push('/dashboard');
            }, 3000);
        } catch (error) {
            console.error(error);
            addSystemMessage("Forgive me, there was an issue submitting your information. Please try again.");
            setLoading(false);
        }
    };

    // Initialize chat
    useEffect(() => {
        if (currentStep === 'none') {
            // Small delay for natural feel
            setTimeout(() => {
                addSystemMessage("Greetings. I am the SermonFlow steward. I'm here to help set up your sanctuary in our system. To begin, may I ask the name of your church?");
                setCurrentStep('churchName');
            }, 500);
        }
    }, [currentStep]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex flex-col h-screen max-w-2xl mx-auto p-4 md:p-8">
            {/* Header */}
            <header className="mb-8 text-center">
                <h1 className="text-3xl font-[family-name:var(--font-instrument-serif)] italic text-gray-800">
                    Sanctuary Setup
                </h1>
                <p className="text-sm text-gray-500 mt-2">Let us prepare your space.</p>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto space-y-6 mb-4 px-2 scrollbar-hide">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
                            msg.role === 'user' ? "justify-end" : "justify-start"
                        )}
                    >
                        <div
                            className={cn(
                                "max-w-[80%] px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                                msg.role === 'user'
                                    ? "bg-gray-900 text-white rounded-br-none"
                                    : "bg-white border border-gray-100 text-gray-700 rounded-bl-none font-medium"
                            )}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}

                {currentStep === 'summary' && (
                    <div className="mx-auto w-full max-w-sm bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-4 animate-in zoom-in-95 duration-500">
                        <h3 className="font-[family-name:var(--font-instrument-serif)] text-xl text-gray-800 mb-4 text-center">Summary</h3>
                        <div className="space-y-3 text-sm text-gray-600">
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="font-medium">Church Name</span>
                                <span>{data.churchName}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="font-medium">Website</span>
                                <span className="truncate max-w-[150px]">{data.website}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="font-medium">Denomination</span>
                                <span>{data.denomination}</span>
                            </div>
                            <div className="flex justify-between pb-2">
                                <span className="font-medium">Socials</span>
                                <span className="truncate max-w-[150px]">{data.socials.instagram}</span>
                            </div>
                        </div>
                        <button
                            onClick={handleConfirm}
                            disabled={loading}
                            className="mt-6 w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-black transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? "Consecrating..." : "Confirm & Submit"}
                        </button>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {currentStep !== 'summary' && currentStep !== 'completed' && (
                <div className="relative mt-auto">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type your answer..."
                        className="w-full bg-white border border-gray-200 rounded-full px-6 py-4 pr-12 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 shadow-sm transition-shadow"
                        autoFocus
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m5 12 7-7 7 7" />
                            <path d="M12 19V5" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}
