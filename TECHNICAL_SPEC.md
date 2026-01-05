# SermonFlow Master Technical Specification

## 1. System Overview
SermonFlow is a stateless, containerized backend service responsible for the "heavy lifting" of content generation. It connects to Supabase for data and Google Gemini for intelligence, producing high-fidelity PDF assets from raw sermon transcripts and audio.

## 2. Architecture
The system follows a stateless, containerized microservices pattern.

```mermaid
graph TD
    Client[Next.js Frontend] -->|Auth & Data| Supabase[Supabase PaaS]
    Client -->|Trigger Generation| API[FastAPI Core]
    
    subgraph "SermonFlow Core (Backend)"
        API -->|Check Subscription| RevenueService[Revenue Service]
        API -->|Fetch Context (Audio/Text)| Supabase
        API -->|Generate Text| Gemini[Google Gemini 3.0 Flash]
        API -->|Render PDF| PDFEngine[ReportLab]
    end
    
    PDFEngine -->|Upload Asset| Storage[Supabase Storage]
    API -->|Update Status| Supabase
```

## 3. Tech Stack
*   **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Lucide Icons.
*   **Backend**: Python 3.11, FastAPI, Pydantic, ReportLab (for PDF), ffmpeg (Audio).
*   **Database**: PostgreSQL (via Supabase).
*   **Auth**: Supabase Auth (Google OAuth / Email).
*   **Payment**: Stripe (Subscriptions/Gating).
*   **Storage**: Supabase Storage (S3-compatible).
*   **AI**: Google GenAI SDK (`google-genai`), Model: `gemini-3-flash-preview` (Content), `gemini-2.5-flash` (Transcription).

## 4. Database Schema
The database is hosted on Supabase and consists of four primary tables.

### 4.1. `public.churches`
Stores configuration, branding, and subscription status.
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key (Default: `uuid_generate_v4()`) |
| `name` | Text | Display name of the church |
| `deep_research_profile` | JSONB | Contains `insider_lexicon`, `theology`, `voice_tone`, etc. |
| `branding_assets` | JSONB | Contains `primary_color`, `font_header`, `logo_url`, etc. |
| `subscription_status` | Text | 'active', 'inactive', 'past_due' (Stripe managed) |
| `stripe_customer_id` | Text | Stripe Customer Mapping |
| `created_at` | Timestamptz | Creation timestamp |

### 4.2. `public.sermons`
Stores the raw input data (transcripts and audio).
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `church_id` | UUID | FK to `churches.id` |
| `transcript` | Text | Full text of the sermon |
| `title` | Text | Sermon title |
| `series_title` | Text | (Optional) Series name |
| `audio_url` | Text | URL to the raw audio file in Storage |
| `status` | Text | `processing_audio`, `processing_transcription`, `completed` |
| `created_at` | Timestamptz | Creation timestamp |

### 4.3. `public.assets`
Stores the output generated artifacts.
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `sermon_id` | UUID | FK to `sermons.id` |
| `type` | Text | Schema: `email_recap`, `devotional`, `small_group`, etc. |
| `content_markdown` | Text | The raw LLM output |
| `pdf_url` | Text | Public URL to the generated PDF |
| `status` | Text | Enum: `processing`, `completed`, `failed` |
| `error` | Text | Error message if failed |
| `created_at` | Timestamptz | Creation timestamp |

### 4.4. `public.onboarding_requests`
Stores initial user data before admin approval.
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | UUID | FK to Auth Users |
| `church_name` | Text | | 
| `website` | Text | |
| `status` | Text | `pending_research`, `completed` |

## 5. Backend API Reference
Base URL: `http://localhost:8000` (Local)

### 5.1. `POST /generate-asset`
Triggers the synchronous generation process. **Gated by Stripe Subscription**.

**Request:**
```json
{
  "sermon_id": "uuid-string",
  "asset_type": "email_recap" // One of supported types
}
```

### 5.2. `POST /ingest`
Ingests media (YouTube URL or File Upload), strips audio via ffmpeg, uploads to storage, and queues transcription.

## 6. Configuration Variables
Required environment variables (`.env`).

### Backend (`app/.env`)
*   `SUPABASE_URL`: API URL.
*   `SUPABASE_KEY`: Service Key.
*   `GEMINI_API_KEY`: Google AI Studio Key.
*   `STRIPE_SECRET_KEY`: Backend Secret Key.
*   `STRIPE_PUBLISHABLE_KEY`: Frontend Public Key.
*   `STRIPE_WEBHOOK_SECRET`: For webhook verification.
*   `STRIPE_PRICE_ID`: Product Price ID.

### Frontend (`frontend/.env.local`)
*   `NEXT_PUBLIC_SUPABASE_URL`: API URL.
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public API Key.
*   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: For Stripe Elements.
