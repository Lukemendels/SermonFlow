import os
import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from app.models.schemas import BrandingAssets
from app.services.supabase_client import get_supabase

class PDFEngine:
    def __init__(self):
        self.bucket_name = "sermon-assets"

    def _hex_to_color(self, hex_code: str):
        try:
            return colors.HexColor(hex_code)
        except:
            return colors.black

    def _draw_header_footer(self, canvas, doc, branding: BrandingAssets):
        """
        Draws header and footer on every page.
        """
        canvas.saveState()
        
        # Header - Primary Color Bar
        primary_color = self._hex_to_color(branding.primary_color)
        canvas.setFillColor(primary_color)
        canvas.rect(0, A4[1] - 1 * inch, A4[0], 1 * inch, fill=True, stroke=False)
        
        # Header Text (Church Name or Logo Placeholder)
        canvas.setFillColor(colors.white)
        canvas.setFont("Helvetica-Bold", 16)
        # We don't have church name passed safely here in variable, 
        # so we rely on what's available or keep it simple.
        # Let's just put "Generated Asset" or leave it as a style element.
        canvas.drawString(0.5 * inch, A4[1] - 0.65 * inch, "SermonFlow Asset")

        # Footer
        canvas.setFillColor(primary_color)
        canvas.rect(0, 0, A4[0], 0.5 * inch, fill=True, stroke=False)
        
        canvas.setFillColor(colors.white)
        canvas.setFont("Helvetica", 9)
        page_num = canvas.getPageNumber()
        canvas.drawString(0.5 * inch, 0.2 * inch, f"Page {page_num}")
        
        canvas.restoreState()

    def _markdown_to_flowables(self, markdown_text: str, branding: BrandingAssets):
        styles = getSampleStyleSheet()
        
        # Custom Styles based on branding fonts (generic fallback to Helvetica for now)
        # In a real app, we would register generic fonts or use branding.font_header if it maps to a file.
        
        h1_style = ParagraphStyle(
            'CustomH1', 
            parent=styles['Heading1'], 
            textColor=self._hex_to_color(branding.secondary_color)
        )
        norm_style = styles['Normal']
        
        flowables = []
        
        lines = markdown_text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                flowables.append(Spacer(1, 0.1 * inch))
                continue
            
            if line.startswith('# '):
                flowables.append(Paragraph(line[2:], h1_style))
                flowables.append(Spacer(1, 0.1 * inch))
            elif line.startswith('## '):
                # Map to h2
                flowables.append(Paragraph(line[3:], styles['Heading2']))
                flowables.append(Spacer(1, 0.1 * inch))
            elif line.startswith('### '):
                flowables.append(Paragraph(line[4:], styles['Heading3']))
            elif line.startswith('* ') or line.startswith('- '):
                # List item
                flowables.append(Paragraph(f"• {line[2:]}", norm_style, bulletText='•'))
            else:
                flowables.append(Paragraph(line, norm_style))
                
        return flowables

    def generate_pdf(self, markdown_text: str, branding: BrandingAssets) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=A4,
            rightMargin=0.5*inch, leftMargin=0.5*inch,
            topMargin=1.2*inch, bottomMargin=0.8*inch
        )
        
        try:
            story = self._markdown_to_flowables(markdown_text, branding)
        except Exception as e:
            # Robust fallback logic
            print(f"MD Parsing failed: {e}. Falling back to plain text.")
            styles = getSampleStyleSheet()
            story = [Paragraph("Error parsing content format. Raw content below:", styles['Heading3']), Spacer(1, 0.2*inch)]
            for line in markdown_text.split('\n'):
                 story.append(Paragraph(line, styles['Normal']))
        
        # Build PDF
        def on_page(canvas, doc):
            self._draw_header_footer(canvas, doc, branding)

        doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
        
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes

    def upload_to_supabase(self, pdf_bytes: bytes, church_name: str, sermon_id: str, file_name: str = "asset.pdf") -> str:
        supabase = get_supabase()
        
        # Clean church name for path
        safe_church_name = church_name.replace(" ", "_").lower().strip()
        path = f"{safe_church_name}/{sermon_id}/{file_name}"
        
        # Upload
        response = supabase.storage.from_(self.bucket_name).upload(
            path=path,
            file=pdf_bytes,
            file_options={"content-type": "application/pdf", "upsert": "true"}
        )
        
        # Get Public URL
        public_url = supabase.storage.from_(self.bucket_name).get_public_url(path)
        return public_url
