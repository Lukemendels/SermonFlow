import os
import time
from google import genai
from google.genai import types

class TranscriptionService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY environment variable not set")
        self.client = genai.Client(api_key=self.api_key)
        self.model_id = "gemini-2.5-flash" # Use Stable 2.5 Flash

    def generate_transcript(self, audio_uri: str) -> str:
        """
        Generates a timestamped transcript from an audio file URI (Supabase URL or local path).
        Ideally, we should upload the file to Gemini's File API first if it's large.
        If it's a public URL, we might need to download it first or pass it if supported (Vertex supports, AI Studio often needs File API).
        
        For this implementation, we will assume we need to upload the file to Gemini File API.
        Input `audio_uri` here is assumed to be a local path for the upload step in the pipeline, 
        OR we can download from the Supabase URL if needed. 
        Given the flow: Ingest -> Process -> Upload to Supabase -> Transcribe. 
        We have the local file available during the background task before cleanup.
        So we should pass the local file path to this method.
        """
        
        try:
            # 1. Upload file to Gemini
            print(f"Uploading file {audio_uri} to Gemini...")
            # The SDK might have a different method signature, assuming 'files.upload' pattern
            # For google-genai SDK 0.x/1.x patterns vary. 
            # Using the patterns for the newer SDK based on recent docs knoweldge:
            
            with open(audio_uri, "rb") as f:
                upload_result = self.client.files.upload(file=f, config={'display_name': os.path.basename(audio_uri)})
            
            file_name = upload_result.name
            
            # Wait for processing state if needed (usually for video, audio is fast but checks are good)
            while True:
                file_meta = self.client.files.get(name=file_name)
                if file_meta.state.name == "ACTIVE":
                    break
                elif file_meta.state.name == "FAILED":
                    raise Exception("Gemini File processing failed.")
                time.sleep(2)

            # 2. Generate Transcript
            prompt = "Generate a full transcript of this audio file with timestamps."
            
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=[
                    types.Content(
                        parts=[
                            types.Part.from_uri(
                                file_uri=file_meta.uri,
                                mime_type=file_meta.mime_type or "audio/mpeg"
                            ),
                            types.Part.from_text(text=prompt)
                        ]
                    )
                ]
            )
            
            return response.text
            
        except Exception as e:
            raise Exception(f"Transcription failed: {str(e)}")
