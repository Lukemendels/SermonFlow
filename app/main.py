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
    # Retrieve Sermon & Church Data from Supabase
    supabase = get_supabase()
    
    # Fetch sermon with Joined Church Data
    # Assuming "churches" is the foreign table name
    response = supabase.table("sermons").select("*, churches(*)").eq("id", request.sermon_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Sermon not found")
        
    sermon_row = response.data[0]
    church_row = sermon_row.get("churches")
    
    if not church_row:
        raise HTTPException(status_code=404, detail="Church not found for this sermon")

    transcript = sermon_row.get("transcript", "")
    if not transcript:
         raise HTTPException(status_code=400, detail="Sermon has no transcript")

    # Parse Profiles
    # Assuming these fields are JSONB in Supabase, the pyton client returns them as Dicts naturally.
    # We validate them via Pydantic.
    try:
        profile_data = church_row.get("deep_research_profile", {})
        # Enrich profile with church name if not inside jsonb, or ensure consistency
        if "church_name" not in profile_data:
            profile_data["church_name"] = church_row.get("name", "Unknown Church")
            
        profile = DeepResearchProfile(**profile_data)
        
        branding_data = church_row.get("branding_assets", {})
        branding = BrandingAssets(**branding_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data validation error: {str(e)}")

    # 1. Content Generation
    content_engine = ContentGenerator()
    try:
        markdown_content = content_engine.generate(profile, transcript, request.asset_type)
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Content generation failed: {str(e)}")

    # 2. Save Markdown Asset (Optional step, but good for history)
    # instructions said: "Save Markdown to Supabase assets table immediately."
    # We need an asset ID for the filename maybe?
    
    asset_entry = {
        "sermon_id": request.sermon_id,
        "type": request.asset_type,
        "content_markdown": markdown_content,
        "status": "processing"
    }
    asset_res = supabase.table("assets").insert(asset_entry).execute()
    # Assuming we get an ID back
    asset_id = asset_res.data[0].get("id") if asset_res.data else str(uuid.uuid4())

    # 3. PDF Generation & Upload
    # We can run this in background or sync. Instructions imply explicit flow. 
    # Let's do it sync for simplicity unless requested otherwise, or use BackgroundTasks if latency is concern.
    # Given "POST /generate-asset", usually users wait for result or get a job ID.
    # "Return the PDF file" was V1. V2 implies "Upload ... Update assets table".
    # So we act as an async trigger or wait-for-completion.
    # I will do it synchronously to ensure errors are caught, as it's a "process" endpoint.
    
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
