# Langnode — Project State & Architectural Documentation

## 1. Project Overview

- **Project Name:** Langnode
- **Phase:** Half 2 — Phase 3: Personalized Learning Roadmap & Competency Loop (ED-02) — **PROJECT COMPLETE**
- **Target Platform:** Expo Go Mobile Application (iOS & Android) & Web
- **Problem Statement ED-01 (Resolved in Half 1):** Conceptual friction due to linguistic diversity and isolation from textbook study materials. Resolved via multilingual AI tutoring across 6 Indian regional languages + English, mixed-language code-switching (Tanglish/Hinglish), mobile voice Q&A, and mobile document RAG (PDF/DOCX/TXT/MD) with page citations.
- **Problem Statement ED-02 (Resolved in Half 2):** Students lack visibility into the competency landscape associated with their intended career paths ("What skills do I need for the career I want?"). Resolved via an interactive mobile career exploration experience mapping real-world roles, skill taxonomies, expected proficiencies, diagnostic assessments, skill gap analysis, personalized phased roadmaps, progress tracking, and seamless 1-tap contextual integration with the Half 1 AI Tutor ("Learn with Langnode").

---

## 2. Complete End-to-End Product Loop Verified

$$\text{Career Goal} \longrightarrow \text{Skill Requirements} \longrightarrow \text{Student Assessment} \longrightarrow \text{Skill Gap} \longrightarrow \text{Learning Priorities} \longrightarrow \text{Personalized Roadmap} \longrightarrow \text{Learn with Langnode} \longrightarrow \text{Progress Tracking}$$

1. **Career Goal Selection (`/career`):** Students explore and select from 7 industry career pathways (Frontend, Backend, Full Stack, Data Analyst, ML Engineer, UI/UX Designer, Cybersecurity Analyst).
2. **Skill Requirements (`/career/[id]`):** Transparent inspection of all required skills, canonical categories, expected industry proficiencies, and importance hierarchies (Essential, Core, Recommended, Bonus).
3. **Diagnostic Assessment (`/career/assess`):** Interactive one-skill-at-a-time self-assessment (`Beginner`, `Basic`, `Intermediate`, `Advanced`, `Expert`, `I Don't Know`) with live progress and save/resume support.
4. **Skill Gap Analysis (`/career/gap`):** Visual classification of Strong Skills, Developing Skills, Skills Requiring Improvement, Missing Skills, and Top Priority Areas.
5. **Personalized Learning Roadmap (`/career/roadmap`):** Non-generic 5-phase progressive curriculum dynamically synthesized from the student's assessed skill profile and gap magnitudes.
6. **"Learn with Langnode" AI Tutor Handshake:** Every roadmap item features 1-tap launch into the existing Half 1 AI Tutor, automatically passing target skill, current level, learning objective, and student's chosen language (Tamil, Hindi, Telugu, Malayalam, Kannada, English) without code duplication.
7. **Progress & Analytics (`/career/progress` & `/career/dashboard`):** Real-time topic completion toggling, skill leveling up, streak tracking, study session counting, and dynamic calculation of the Recommended Next Step.

---

## 3. The 6 Mobile Screens Implemented

1. **Career Dashboard (`src/app/career/dashboard.tsx`):**
   - Active career goal banner with role metrics and switch role capability.
   - Circular readiness indicator and roadmap completion percentage.
   - Recommended Next Step card with 1-tap "Learn with Langnode" in regional languages.
   - Fast access grid: Skill Gap Analysis, Learning Roadmap, Skill Assessment, and Progress Stats.
   - Recent learning activity feed.
2. **Skill Gap Analysis (`src/app/career/gap.tsx`):**
   - Role Readiness overview and summary breakdown.
   - Filtering tabs: Priority, All, Missing, Developing, Improvement, Strong.
   - Detailed competency comparison bar (Current Level vs Target Level) and recommended actions.
   - Direct CTA button to open Personalized Learning Roadmap.
3. **Learning Roadmap (`src/app/career/roadmap.tsx`):**
   - 5-Phase progressive timeline (Foundations, Frameworks & Architecture, Domain Depth, Production Resilience, Capstone).
   - Topic status toggling (`Not Started`, `In Progress`, `Completed`) with tactile haptic feedback.
   - Phase accordion controls and hours estimations.
4. **Roadmap Detail (`src/app/career/roadmap/[itemId].tsx`):**
   - Detailed view of learning objectives and hands-on practice activities.
   - Interactive status toggle updates backend user skill profile and recalculates readiness.
   - Prominent "Learn with Langnode" button launching contextual AI tutoring.
5. **Progress & Analytics (`src/app/career/progress.tsx`):**
   - 2x2 metric grid: Roadmap Completion %, Topics Mastered, AI Tutor Sessions, and Saved Study Notes.
   - Daily study streak flame counter ("On Fire").
   - Milestone achievements checklist (Career Selected, Diagnostic Completed, Phased Roadmap Generated).
6. **Recommended Next Step (Integrated Across Screens):**
   - Highlights the single most immediate next topic to master across Dashboard, Roadmap header, and Progress screen.

---

## 4. Technology Stack & Dependencies

### Mobile Frontend (Expo SDK 57)

- `react-native`: 0.86.3
- `expo`: ~57.0.25
- `expo-router`: ~57.0.23 (Typed file-based routing)
- `expo-document-picker`: ~57.0.2
- `expo-file-system`: ~57.0.7
- `expo-sharing`: ~57.0.22
- `expo-av`: ~16.0.8
- `expo-speech`: ~57.0.3
- `expo-haptics`: ~57.0.3
- `expo-secure-store`: ~57.0.4
- `expo-network`: ~57.0.2
- `@expo/vector-icons`: ~15.1.1
- `nativewind` & `tailwindcss`: Utility styling

### Backend Services (FastAPI)

- `FastAPI`: Asynchronous API framework
- `uvicorn`: ASGI server on `http://0.0.0.0:8000`
- `pypdf`: PDF text extraction with page tracking
- `python-docx`: DOCX parsing
- `httpx`: Async client for LLM connectors
- `pydantic`: Schema validation

---

## 5. API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server status (`version: 2.0.0`, `voice_enabled: true`, `rag_enabled: true`) |
| `GET` | `/api/careers/roles` | Lists career role summaries with search and category filtering |
| `GET` | `/api/careers/roles/{id}` | Retrieves full competency details, required skills, and importance levels |
| `GET` | `/api/careers/categories` | Returns 9 canonical skill categories with skill counts |
| `POST` | `/api/assessment/submit` | Submits student self-assessment and computes instant skill gap analysis |
| `GET` | `/api/assessment/{user_id}/gap/{role_id}` | Retrieves detailed competency gaps, priorities, and readiness |
| `GET` | `/api/assessment/{user_id}/skills` | Retrieves student's current assessed skill ratings dictionary |
| `GET` | `/api/roadmap/{user_id}/{role_id}` | Generates/retrieves 5-phase personalized non-generic roadmap |
| `POST` | `/api/roadmap/item/update` | Updates topic status (`not_started`, `in_progress`, `completed`) & recalculates metrics |
| `GET` | `/api/progress/{user_id}` | Retrieves student progress state, streak, sessions, notes, & next step |
| `GET` | `/api/languages` | Supported languages metadata & sample queries |
| `POST` | `/api/chat` | Core AI tutor response generation with code-switching support |
| `POST` | `/api/documents/upload` | Ingests PDF/DOCX/TXT/MD, chunks text, and builds vector store |
| `POST` | `/api/documents/{id}/query` | Grounded multilingual RAG query answering with page citations |
| `POST` | `/api/documents/{id}/summarize` | Generates Quick, Detailed, Exam Notes, Flashcards, or Q&A |
| `POST` | `/api/notes` | Saves study notes |
| `GET` | `/api/notes` | Retrieves saved study notes |

---

## 6. Verification & Test Results

1. **Personalized Roadmap & Gap Analysis Test Suite (`backend/test_roadmap.py`):**
   - Assessment submission & readiness scoring — **PASSED**.
   - Phased roadmap generation with 5 progressive phases — **PASSED**.
   - Topic status updates and automatic user skill score leveling — **PASSED**.
   - Recommended next step calculation — **PASSED**.
   - FastAPI endpoints (`/api/assessment/submit`, `/api/assessment/gap`, `/api/roadmap`, `/api/roadmap/item/update`, `/api/progress`) verified via `TestClient` — **8 of 8 PASSED**.

2. **Career Pathways Test Suite (`backend/test_careers.py`):**
   - 7 initial roles & 9 canonical skill categories — **8 of 8 PASSED**.

3. **TypeScript Compilation:**
   - Command: `npx tsc --noEmit`
   - Result: **0 errors** (Exit Code 0).

4. **ESLint Static Analysis:**
   - Command: `npm run lint`
   - Result: **0 errors, 0 warnings** (Exit Code 0).

5. **Production Web / Mobile Bundling:**
   - Command: `npm run build:web`
   - Result: **Exported 31 static routes successfully** (including `/career/dashboard`, `/career/gap`, `/career/roadmap`, `/career/roadmap/[itemId]`, `/career/assess`, `/career/progress`).

6. **Browser Subagent End-to-End Verification (`phase3_roadmap_e2e`):**
   - Successfully loaded Career Dashboard with active goal, readiness metrics, and recommended next step.
   - Clicked into Skill Gap Analysis and validated priority areas, current vs expected levels, and gap scores.
   - Opened Personalized Learning Roadmap, browsed 5 phases, and expanded topic details in modal.
   - Verified "Learn with Langnode in English", clicked button, and verified seamless transition to `/chat` with contextual prompt framing.
   - Navigated to Progress & Growth screen, confirming streak, completed topics count, and milestones.

---

## 7. Project Completion Status

- **Half 1 (Multilingual AI Tutor, Voice, Document RAG - ED-01):** **100% COMPLETE & VERIFIED**
- **Half 2 - Phase 1 (Career Pathways & Competency Landscape - ED-02):** **100% COMPLETE & VERIFIED**
- **Half 2 - Phase 2 (Diagnostic Skill Assessment & Gap Analysis - ED-02):** **100% COMPLETE & VERIFIED**
- **Half 2 - Phase 3 (Personalized Learning Roadmap & Progress Tracking - ED-02):** **100% COMPLETE & VERIFIED**
- **Final Product Loop:** **Fully Closed and Verified**
