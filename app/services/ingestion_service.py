import os
import uuid
import yt_dlp
import ffmpeg
from fastapi import HTTPException

STATUS_PROCESSING = "processing"
STATUS_FAILED = "failed"

class IngestionService:
    def __init__(self, upload_dir: str = "/tmp/sermonflow_uploads"):
        self.upload_dir = upload_dir
        os.makedirs(self.upload_dir, exist_ok=True)

    def download_youtube_audio(self, url: str) -> str:
        """
        Downloads audio from a YouTube URL and returns the path to the MP3 file.
        """
        try:
            filename = f"{uuid.uuid4()}"
            ydl_opts = {
                'format': 'bestaudio/best',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
                'outtmpl': os.path.join(self.upload_dir, f"{filename}.%(ext)s"),
                'quiet': True,
                'no_warnings': True,
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
            
            # yt-dlp automatically appends the extension
            expected_path = os.path.join(self.upload_dir, f"{filename}.mp3")
            if not os.path.exists(expected_path):
                 # Fallback check if it didn't convert for some reason, though postprocessor should handle it
                 raise Exception("File not found after download.")
            return expected_path
        except Exception as e:
            raise Exception(f"YouTube Download failed: {str(e)}")

    def extract_audio_from_video(self, input_path: str) -> str:
        """
        Extracts audio from a video file and saves it as MP3.
        Returns the path to the new audio file.
        """
        try:
            output_path = f"{os.path.splitext(input_path)[0]}_extracted.mp3"
            # Use ffmpeg to extract audio
            # -y overwrites output
            # -vn disables video recording
            # -acodec libmp3lame sets codec to mp3
            stream = ffmpeg.input(input_path)
            stream = ffmpeg.output(stream, output_path, vn=None, acodec='libmp3lame', qscale=2)
            ffmpeg.run(stream, overwrite_output=True, quiet=True)
            return output_path
        except Exception as e:
            raise Exception(f"Audio extraction failed: {str(e)}")

    def validate_audio_file(self, file_path: str) -> bool:
        """
        Validates if the file is a valid audio format.
        For simplicity, we check extensions, but ideally we'd check headers.
        """
        valid_extensions = ['.mp3', '.m4a', '.wav', '.flac', '.ogg']
        _, ext = os.path.splitext(file_path)
        if ext.lower() not in valid_extensions:
            raise HTTPException(status_code=400, detail=f"Invalid file format. Supported: {valid_extensions}")
        return True

    def cleanup(self, path: str):
        """Removes the temporary file."""
        if os.path.exists(path):
            os.remove(path)
