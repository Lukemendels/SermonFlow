import os
from app.services.supabase_client import get_supabase

class StorageService:
    def __init__(self):
        self.supabase = get_supabase()
        self.bucket_name = "sermon-audio"

    def upload_file(self, file_path: str, destination_path: str) -> str:
        """
        Uploads a file to Supabase Storage and returns the public URL.
        """
        try:
            with open(file_path, "rb") as f:
                file_bytes = f.read()
            
            # Check if bucket exists, if not, create it (or rely on setup)
            # The python client api for bucket management might differ, sticking to upload
            
            # Upsert=true to overwrite if exists
            self.supabase.storage.from_(self.bucket_name).upload(
                path=destination_path,
                file=file_bytes,
                file_options={"content-type": "audio/mpeg", "upsert": "true"}
            )
            
            # Get Public URL
            public_url = self.supabase.storage.from_(self.bucket_name).get_public_url(destination_path)
            return public_url
        except Exception as e:
            raise Exception(f"Storage upload failed: {str(e)}")
