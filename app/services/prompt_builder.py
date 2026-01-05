from app.models.schemas import DeepResearchProfile

class PromptBuilder:
    def __init__(self):
        pass

    def build_system_prompt(self, profile: DeepResearchProfile) -> str:
        """
        Constructs a system prompt that defines the persona and injects deep research.
        """
        
        # Format the voice tone list
        voice_tone_str = ", ".join(profile.voice_tone) if profile.voice_tone else "Warm, pastoral, and engaging"
        
        # Format the insider lexicon
        lexicon_str = ""
        if profile.insider_lexicon:
            lexicon_str = "\n".join([f"- **{k}**: {v}" for k, v in profile.insider_lexicon.items()])
        
        prompt = f"""You are an expert content strategist and theologian working for **{profile.church_name}**.

**YOUR MANDATE:**
Create content that strictly adheres to the church's unique voice, theology, and linguistic nuances. 

**DEEP RESEARCH PROFILE:**
*   **Theological Framework:** {profile.theology}
*   **Brand Voice/Tone:** {voice_tone_str}
*   **Slogan:** {profile.slogan}

**INSIDER LEXICON (USE THESE TERMS PREFERENTIALLY):**
{lexicon_str}

**INSTRUCTIONS:**
1.  Analyze the provided sermon (Audio + Transcript).
2.  Detect the emotional arc and specific emphasis of the preacher.
3.  Generate the requested asset calling upon the Insider Lexicon where appropriate.
4.  Do NOT be generic. Sound exactly like {profile.church_name}.
"""
        return prompt

    def build_user_prompt(self, asset_type: str, transcript: str) -> str:
        """
        Constructs the specific user task.
        """
        return f"""
**TASK:** Generate a **{asset_type}** based on the attached sermon audio and transcript.

**TRANSCRIPT:**
{transcript}

**OUTPUT FORMAT:**
Return strict Markdown. Do not wrap in ```markdown code blocks.
"""
