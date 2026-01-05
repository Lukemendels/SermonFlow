import os
import markdown2
from jinja2 import Template
from playwright.sync_api import sync_playwright
from app.models.schemas import BrandingAssets
from app.services.supabase_client import get_supabase

class PDFEngine:
    def __init__(self):
        self.template_path = os.path.join(os.path.dirname(__file__), "..", "templates", "agency_pdf.html")

    def _render_html(self, markdown_text: str, branding: BrandingAssets) -> str:
        # Convert Markdown to HTML
        html_content = markdown2.markdown(markdown_text, extras=["tables"])
        
        # Load Template
        with open(self.template_path, "r", encoding="utf-8") as f:
            template = Template(f.read())
        
        # Render HTML with branding
        return template.render(content=html_content, branding=branding)

    def generate_pdf(self, markdown_text: str, branding: BrandingAssets, output_path: str = "output.pdf") -> bytes:
        html = self._render_html(markdown_text, branding)
        
        with sync_playwright() as p:
            # We strictly use chromium as requested
            browser = p.chromium.launch() 
            page = browser.new_page()
            
            # Set content
            page.set_content(html)
            
            # CRITICAL: Wait for Paged.js
            # Note: Paged.js often adds a class or element when done. 
            # The prompt requested: await page.wait_for_selector(".pagedjs_pages")
            try:
                page.wait_for_selector(".pagedjs_pages", timeout=10000)
            except:
                # Fallback or log if it times out
                print("Warning: Timeout waiting for Paged.js selector")
            
            pdf_bytes = page.pdf(format="A4", print_background=True)
            browser.close()
            
        return pdf_bytes

    def upload_to_supabase(self, pdf_bytes: bytes, church_name: str, sermon_id: str, file_name: str = "asset.pdf") -> str:
        supabase = get_supabase()
        bucket_name = "sermon-assets" 
        
        # Clean church name for path
        safe_church_name = church_name.replace(" ", "_").lower()
        path = f"{safe_church_name}/{sermon_id}/{file_name}"
        
        # Upload
        # Supabase storage upload logic
        response = supabase.storage.from_(bucket_name).upload(
            path=path,
            file=pdf_bytes,
            file_options={"content-type": "application/pdf", "upsert": "true"}
        )
        
        # Construct Public URL (or get it)
        # Assuming public bucket
        public_url = supabase.storage.from_(bucket_name).get_public_url(path)
        return public_url
