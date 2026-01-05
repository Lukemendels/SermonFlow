from typing import List, Dict, Optional
from pydantic import BaseModel

class BrandingAssets(BaseModel):
    primary_color: str
    secondary_color: str
    logo_url: str
    font_header: str
    font_body: str

class DeepResearchProfile(BaseModel):
    church_name: str
    theology: str
    voice_tone: List[str]
    slogan: str
    insider_lexicon: Dict[str, str]
    
# We might need a wrapper if the supabase result returns "profile" field as JSONB
# But for now these models represent the shape of the data *inside* the JSONB columns.
