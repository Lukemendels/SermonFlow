import uuid
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.services.supabase_client import get_supabase
from app.services.content_engine import ContentGenerator
from app.services.pdf_engine import PDFEngine
from app.models.schemas import DeepResearchProfile, BrandingAssets

app = FastAPI(title="SermonFlow Core")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    sermon_id: str
    asset_type: str

@app.post("/generate-asset")
async def generate_asset(request: GenerateRequest, background_tasks: BackgroundTasks):
    import httpx
    import os
    import tempfile

    # Retrieve Sermon & Church Data from Supabase
    supabase = get_supabase()
    
    # Fetch sermon with Joined Church Data
    response = supabase.table("sermons").select("*, churches(*)").eq("id", request.sermon_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Sermon not found")
        
    sermon_row = response.data[0]
    church_row = sermon_row.get("churches")
    
    if not church_row:
        raise HTTPException(status_code=404, detail="Church not found for this sermon")

    transcript = sermon_row.get("transcript", "")
    # Note: We now allow missing transcript IF we have audio, but prompt builder logic prefers transcript.
    # We'll stick to requiring transcript or at least safe fallback.
    
    audio_url = sermon_row.get("audio_url")
    temp_audio_path = None
    
    if audio_url:
        try:
            # Download audio to temp file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp_file:
                temp_audio_path = tmp_file.name
                
            # Use httpx to stream download
            print(f"Downloading Audio: {audio_url}")
            with httpx.Client() as client:
                with client.stream("GET", audio_url) as r:
                    r.raise_for_status()
                    with open(temp_audio_path, "wb") as f:
                        for chunk in r.iter_bytes():
                            f.write(chunk)
            print("Audio Downloaded")
        except Exception as e:
            print(f"Warning: Failed to download audio for context: {e}")
            # Non-blocking, we proceed without audio if download fails
            if temp_audio_path and os.path.exists(temp_audio_path):
                 os.remove(temp_audio_path)
            temp_audio_path = None

    # Parse Profiles
    try:
        profile_data = church_row.get("deep_research_profile", {})
        if "church_name" not in profile_data:
            profile_data["church_name"] = church_row.get("name", "Unknown Church")
            
        profile = DeepResearchProfile(**profile_data)
        
        branding_data = church_row.get("branding_assets", {})
        branding = BrandingAssets(**branding_data)
    except Exception as e:
        if temp_audio_path: os.remove(temp_audio_path)
        raise HTTPException(status_code=500, detail=f"Data validation error: {str(e)}")

    # 1. Content Generation
    content_engine = ContentGenerator()
    try:
        # Pass audio path!
        markdown_content = content_engine.generate(profile, transcript, request.asset_type, audio_path=temp_audio_path)
    except Exception as e:
         if temp_audio_path: os.remove(temp_audio_path)
         raise HTTPException(status_code=500, detail=f"Content generation failed: {str(e)}")
    
    # Cleanup audio immediately after generation
    if temp_audio_path and os.path.exists(temp_audio_path):
        os.remove(temp_audio_path)

    # 2. Save Markdown Asset
    asset_entry = {
        "sermon_id": request.sermon_id,
        "type": request.asset_type,
        "content_markdown": markdown_content,
        "status": "processing"
    }
    asset_res = supabase.table("assets").insert(asset_entry).execute()
    asset_id = asset_res.data[0].get("id") if asset_res.data else str(uuid.uuid4())

    # 3. PDF Generation & Upload
    pdf_engine = PDFEngine()
    try:
        pdf_bytes = pdf_engine.generate_pdf(markdown_content, branding)
        public_url = pdf_engine.upload_to_supabase(
            pdf_bytes, 
            profile.church_name, 
            request.sermon_id, 
            file_name=f"{request.asset_type}_{asset_id}.pdf"
        )
    except Exception as e:
         # Update status to failed
         supabase.table("assets").update({"status": "failed", "error": str(e)}).eq("id", asset_id).execute()
         raise HTTPException(status_code=500, detail=f"PDF Generation failed: {str(e)}")

    # 4. Update Asset Record
    supabase.table("assets").update({
        "status": "completed", 
        "pdf_url": public_url
    }).eq("id", asset_id).execute()

    return {"status": "success", "asset_id": asset_id, "pdf_url": public_url}

# --- Ingestion Pipeline ---

from fastapi import UploadFile, File, Form, Body
from app.services.ingestion_service import IngestionService
from app.services.storage_service import StorageService
from app.services.transcription_service import TranscriptionService
import shutil
import os

# Pydantic model for JSON input
class IngestRequest(BaseModel):
    youtube_url: str
    church_id: str

def process_sermon_task(sermon_id: str, input_path: str, is_youtube: bool = False):
    """
    Background task to process the sermon:
    1. Extract/Download Audio
    2. Upload to Supabase
    3. Transcribe with Gemini
    4. Update DB
    """
    supabase = get_supabase()
    ingestion = IngestionService()
    storage = StorageService()
    transcription = TranscriptionService()
    
    clean_audio_path = None
    
    try:
        # Update status
        supabase.table("sermons").update({"status": "processing_audio"}).eq("id", sermon_id).execute()
        
        # 1. Process Audio
        if is_youtube:
            clean_audio_path = ingestion.download_youtube_audio(input_path)
        else:
            # It's a file path
            if input_path.lower().endswith(('.mp4', '.mov', '.avi', '.mkv')):
                clean_audio_path = ingestion.extract_audio_from_video(input_path)
            else:
                # Assume audio, just validate
                ingestion.validate_audio_file(input_path)
                clean_audio_path = input_path
        
        # 2. Upload to Storage
        filename = os.path.basename(clean_audio_path)
        storage_path = f"{sermon_id}/{filename}"
        public_url = storage.upload_file(clean_audio_path, storage_path)
        
        supabase.table("sermons").update({
            "status": "processing_transcription",
            "audio_url": public_url
        }).eq("id", sermon_id).execute()
        
        # 3. Transcribe
        transcript_text = transcription.generate_transcript(clean_audio_path)
        
        # 4. Finish
        supabase.table("sermons").update({
            "status": "completed",
            "transcript": transcript_text
        }).eq("id", sermon_id).execute()
        
    except Exception as e:
        print(f"Error processing sermon {sermon_id}: {e}")
        supabase.table("sermons").update({
            "status": "failed",
            "processing_error": str(e)
        }).eq("id", sermon_id).execute()
        
    finally:
        # Cleanup temp files
        if clean_audio_path and os.path.exists(clean_audio_path):
             os.remove(clean_audio_path)
        # If we downloaded a youtube file or uploaded a temp file, ensure it's gone
        # Note: input_path might be same as clean_audio_path if direct audio upload
        if input_path and os.path.exists(input_path) and input_path != clean_audio_path:
             os.remove(input_path)


@app.post("/ingest")
async def ingest_media(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(None),
    church_id: str = Form(None),
    body: IngestRequest = None, 
    # Note: Body and Form together can be tricky in FastAPI. 
    # Best practice: 2 separate endpoints or dependency injection.
    # But instructions asked for one endpoint "Accept either file OR JSON".
    # simpler to check logic inside.
):
    supabase = get_supabase()
    
    # 1. Determine Input Type
    youtube_url = None
    target_church_id = None
    
    if body:
        youtube_url = body.youtube_url
        target_church_id = body.church_id
    elif file and church_id:
        target_church_id = church_id
    else:
        # Fallback if mixed (e.g. JSON body passed to file endpoint often fails content-type, 
        # but let's assume client sends correct Content-Type)
        raise HTTPException(status_code=400, detail="Must provide either file upload with church_id OR JSON body with youtube_url and church_id")

    if not target_church_id:
        raise HTTPException(status_code=400, detail="church_id is required")

    # 2. Create Initial Sermon Record
    sermon_entry = {
        "church_id": target_church_id,
        "title": "New Import", # Can be updated later
        "transcript": "", # Placeholder
        "status": "queued"
    }
    res = supabase.table("sermons").insert(sermon_entry).execute()
    if not res.data:
         raise HTTPException(status_code=500, detail="Failed to create sermon record")
    
    sermon_id = res.data[0]['id']
    
    # 3. Handle Input & Queue Task
    if youtube_url:
        background_tasks.add_task(process_sermon_task, sermon_id, youtube_url, is_youtube=True)
    else:
        # Save uploaded file to temp
        temp_dir = "/tmp/sermonflow_uploads"
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, f"{sermon_id}_{file.filename}")
        
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        background_tasks.add_task(process_sermon_task, sermon_id, temp_path, is_youtube=False)

    return {"status": "queued", "sermon_id": sermon_id}
