import os
from jinja2 import Template
from google import genai
from app.models.schemas import DeepResearchProfile
from app.config import Config

class ContentGenerator:
    def __init__(self):
        # Base path for prompts
        self.prompts_dir = os.path.join(os.path.dirname(__file__), "..", "prompts")

    def _load_template(self, asset_type: str) -> Template:
        # construct filename, e.g. email_recap.md
        # Map generic types if necessary, or assume 1:1 mapping
        filename = f"{asset_type}.md"
        path = os.path.join(self.prompts_dir, filename)
        
        if not os.path.exists(path):
            raise FileNotFoundError(f"Prompt template for {asset_type} not found at {path}")
            
        with open(path, "r", encoding="utf-8") as f:
            return Template(f.read())

    def _call_llm(self, prompt_text: str) -> str:
        if not Config.GEMINI_API_KEY:
            return "Error: GEMINI_API_KEY not set. Cannot generate content."
            
        try:
            client = genai.Client(api_key=Config.GEMINI_API_KEY)
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt_text
            )
            return response.text
        except Exception as e:
            return f"Error calling Gemini API: {str(e)}"

        except Exception as e:
            return f"Error calling Gemini API: {str(e)}"

    def _build_context(self, profile: DeepResearchProfile, transcript: str) -> dict:
        # Flatten profile and map to UPPERCASE keys used in prompts
        lexicon = profile.insider_lexicon or {}
        
        # Base Context
        context = {
            "CHURCH_NAME": profile.church_name,
            "THEOLOGICAL_FRAMEWORK": profile.theology,
            "SLOGAN": profile.slogan,
            "SERMON_TRANSCRIPT": transcript,
            "VOICE_TONE_ADJECTIVES": ", ".join(profile.voice_tone) if profile.voice_tone else "Warm, Inviting",
        }
        
        # Dynamic Mapping from Insider Lexicon
        # Tries to find keys like "AI_NAME" or "ai_name" in lexicon and puts them in context as "AI_NAME"
        # Also maps known specific keys if they exist in standard snake_case in lexicon
        
        # We start with the lexicon itself, upper-casing keys
        for k, v in lexicon.items():
            context[k.upper()] = v
            
        # Helper for common mappings if not present
        if "PREFERRED_BIBLE_TRANSLATION" not in context:
             context["PREFERRED_BIBLE_TRANSLATION"] = lexicon.get("bible_version", "NIV")
             
        if "SENDER_NAME" not in context:
             context["SENDER_NAME"] = profile.church_name # Fallback
             
        # Add profile object itself just in case (legacy support)
        context["profile"] = profile
        
        return context

    def generate(self, profile: DeepResearchProfile, transcript: str, asset_type: str) -> str:
        template = self._load_template(asset_type)
        context = self._build_context(profile, transcript)
        
        # Hydrate
        prompt_text = template.render(**context)
        
        # Generate
        return self._call_llm(prompt_text)
