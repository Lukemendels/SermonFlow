import os
import time
from google import genai
from google.genai import types
from app.models.schemas import DeepResearchProfile
from app.config import Config
from app.services.prompt_builder import PromptBuilder

class ContentGenerator:
    def __init__(self):
        self.prompt_builder = PromptBuilder()

    def _upload_file(self, client: genai.Client, path: str, mime_type: str = "audio/mp3"):
        """Uploads a file to the Gemini File API."""
        print(f"Uploading file: {path}")
        file_ref = client.files.upload(file=path, config={"mime_type": mime_type})
        print(f"Uploaded file: {file_ref.name}")
        return file_ref

    def _call_llm(self, system_prompt: str, user_prompt: str, audio_path: str = None) -> str:
        if not Config.GEMINI_API_KEY:
            return "Error: GEMINI_API_KEY not set. Cannot generate content."
            
        try:
            client = genai.Client(api_key=Config.GEMINI_API_KEY)
            
            contents = []
            
            # If audio is present, upload and add to contents
            if audio_path and os.path.exists(audio_path):
                # We assume MP3 for now, but could detect
                audio_file = self._upload_file(client, audio_path)
                contents.append(audio_file)
            
            # Add text prompt
            contents.append(user_prompt)

            # Gemini 3.0 Configuration
            # "everything else should be 3 flash" -> gemini-3-flash-preview
            # We use system_instruction in the config
            response = client.models.generate_content(
                model="gemini-3-flash-preview",
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.7, 
                )
            )
            return response.text
        except Exception as e:
            # Clean up logic for file could go here if we tracked the file_name
            return f"Error calling Gemini API: {str(e)}"

    def generate(self, profile: DeepResearchProfile, transcript: str, asset_type: str, audio_path: str = None) -> str:
        # Build Prompts
        system_prompt = self.prompt_builder.build_system_prompt(profile)
        user_prompt = self.prompt_builder.build_user_prompt(asset_type, transcript)
        
        # Call LLM
        return self._call_llm(system_prompt, user_prompt, audio_path)
