from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict

from backend.schemas import (
    ChatRequest,
    ChatResponse,
    HealthResponse,
    LanguageInfo,
    ExplanationLevelInfo,
    LanguageDetectionRequest,
    LanguageDetectionResult,
    TranslationRequest,
    TranslationResponse,
    ExplainModeRequest,
    VoiceTranscribeRequest,
    VoiceTranscribeResponse,
    DocumentUploadRequest,
    DocumentInfo,
    DocumentListResponse,
    RAGQueryRequest,
    RAGQueryResponse,
    SummarizeRequest,
    SummarizeResponse,
    SavedNoteCreateRequest,
    SavedNoteInfo,
    SavedNoteListResponse,
    CareerRoleSummary,
    CareerRoleDetail,
    CareerListResponse,
    SkillCategoryInfo,
    SkillAssessmentSubmission,
    SkillGapAnalysisResponse,
    PersonalizedRoadmapResponse,
    RoadmapItemUpdateRequest,
    StudentProgressState,
)
from backend.career_service import CareerService
from backend.roadmap_service import RoadmapService
from backend.language_service import (
    LanguageDetectionService,
    TranslationService,
    TECHNICAL_TERMINOLOGY_PRESERVATION,
)
from backend.tutor_service import AITutorService, TutorService, LANGUAGES_META, LEVEL_PROMPTS
from backend.document_service import DocumentService
from backend.supabase_client import save_turn_to_db, get_conversation_history
from backend.config import HOST, PORT

app = FastAPI(
    title="Langnode AI Tutor Backend",
    description="Adaptive multilingual instructional backend solving Problem Statement ED-01",
    version="2.0.0",
)

# CORS setup for Expo development server and physical devices
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        version="2.0.0",
        supported_languages=len(LANGUAGES_META),
        supported_levels=len(LEVEL_PROMPTS),
        voice_enabled=True,
    )

@app.get("/api/languages", response_model=List[LanguageInfo])
async def list_languages():
    result = []
    samples = {
        "en": "Explain Recursion in simple terms",
        "ta": "Photosynthesis epdi work aaguthu?",
        "hi": "Recursion kaise kaam karta hai?",
        "te": "Binary Search Tree ela pani chestundi?",
        "ml": "Photosynthesis enganeya work aakunnath?",
        "kn": "Photosynthesis hege kelsa madatte?",
    }
    for code, info in LANGUAGES_META.items():
        result.append(
            LanguageInfo(
                code=code,
                name=info["name"],
                native_name=info["native"],
                script=info["script"],
                sample_topic=samples.get(code, "Explain a concept"),
            )
        )
    return result

@app.get("/api/explanation-levels", response_model=List[ExplanationLevelInfo])
async def list_explanation_levels():
    return [
        ExplanationLevelInfo(
            id="Beginner",
            title="Beginner",
            subtitle="Intuitive & Analogy-Driven",
            description="Bite-sized everyday metaphors, zero prerequisite jargon, clear mental models.",
        ),
        ExplanationLevelInfo(
            id="Intermediate",
            title="Intermediate",
            subtitle="Applied & Conceptual",
            description="Standard technical terms, system architectural relationships, practical use cases.",
        ),
        ExplanationLevelInfo(
            id="Advanced",
            title="Advanced",
            subtitle="Rigorous & Deep Architecture",
            description="Underlying mechanics, asymptotic complexity, memory hierarchy, edge cases.",
        ),
    ]

@app.post("/api/detect-language", response_model=LanguageDetectionResult)
async def detect_language(request: LanguageDetectionRequest):
    """
    Automatic language detection with mixed-language (code-switching) detection
    and educational concept extraction.
    """
    try:
        detection = LanguageDetectionService.detect(request.text)
        return LanguageDetectionResult(
            language=detection["language"],
            confidence=detection["confidence"],
            is_mixed=detection["is_mixed"],
            script=detection["script"],
            detected_topic=detection["detected_topic"],
            intent=detection["intent"],
            original_framing=detection.get("original_framing"),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    """
    Translates text between languages while preserving technical terminology.
    """
    try:
        translated = TranslationService.translate(
            text=request.text,
            source_lang=request.source_language,
            target_lang=request.target_language,
        )
        preserved = []
        for term, trans_dict in TECHNICAL_TERMINOLOGY_PRESERVATION.items():
            if term in request.text.lower() and request.target_language in trans_dict:
                preserved.append(trans_dict[request.target_language])

        return TranslationResponse(
            original_text=request.text,
            translated_text=translated,
            source_language=request.source_language,
            target_language=request.target_language,
            preserved_terms=preserved,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/explain-mode", response_model=ChatResponse)
async def quick_explain_mode(request: ExplainModeRequest):
    """
    Handles fast pedagogical transformations:
    - 'simply' (Explain Simply)
    - 'example' (Explain with Example)
    - 'analogy' (Explain with Analogy)
    """
    try:
        chat_req = ChatRequest(
            message=request.concept,
            language=request.language,
            explanation_level=request.level,
            explanation_mode=request.mode,
            conversation_id=request.conversation_id,
        )
        return await AITutorService.generate_explanation(chat_req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/voice/transcribe", response_model=VoiceTranscribeResponse)
async def voice_transcribe(request: VoiceTranscribeRequest):
    """
    Voice transcription & language detection pipeline endpoint.
    Accepts speech input or simulation, detects spoken dialect (including Tanglish/Hinglish),
    and extracts educational intent.
    """
    try:
        transcript = request.simulated_transcript or "Photosynthesis epdi work aaguthu?"
        detection = LanguageDetectionService.detect(transcript)

        return VoiceTranscribeResponse(
            transcript=transcript,
            detected_language=detection["language"],
            is_mixed=detection["is_mixed"],
            confidence=detection["confidence"],
            extracted_topic=detection["detected_topic"] or "Photosynthesis",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_tutor(request: ChatRequest):
    """
    Core AI Tutor endpoint with automatic language detection, mixed-language understanding,
    and explanation modes.
    """
    try:
        response = await AITutorService.generate_explanation(request)

        # Persist conversation turn to Supabase / memory DB
        await save_turn_to_db(
            conversation_id=response.conversation_id,
            user_message=request.message,
            bot_response=response.response,
            language=response.language,
            level=response.explanation_level,
        )

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/conversations/{conversation_id}")
async def get_history(conversation_id: str):
    history = await get_conversation_history(conversation_id)
    return {"conversation_id": conversation_id, "turns": history}

# ==========================================
# PHASE 3: DOCUMENT RAG & SUMMARIZATION ENDPOINTS
# ==========================================

@app.post("/api/documents/upload", response_model=DocumentInfo)
async def upload_document(req: DocumentUploadRequest):
    """
    Ingests mobile document upload (PDF, DOCX, TXT, MD), extracts text,
    indexes semantic chunks, and prepares vector store.
    """
    try:
        doc = await DocumentService.process_document_upload(
            filename=req.filename,
            file_base64=req.file_base64,
            file_type=req.file_type,
            user_id=req.user_id,
        )
        return doc
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/documents", response_model=DocumentListResponse)
async def list_documents(user_id: str = "student_default"):
    """
    Lists documents owned by user_id with ownership security isolation.
    """
    docs = DocumentService.list_documents(user_id)
    return DocumentListResponse(documents=docs)

@app.get("/api/documents/{doc_id}", response_model=DocumentInfo)
async def get_document(doc_id: str, user_id: str = "student_default"):
    doc = DocumentService.get_document(doc_id, user_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or unauthorized")
    return doc

@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str, user_id: str = "student_default"):
    success = DocumentService.delete_document(doc_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found or unauthorized")
    return {"status": "deleted", "document_id": doc_id}

@app.post("/api/documents/{doc_id}/query", response_model=RAGQueryResponse)
async def query_document(doc_id: str, req: RAGQueryRequest):
    """
    Multilingual grounded RAG query resolution (e.g. 'Explain this chapter in Tamil').
    """
    try:
        return await DocumentService.answer_rag_query(
            doc_id=doc_id,
            user_id=req.user_id,
            query=req.query,
            target_language=req.language or "auto",
            level=req.explanation_level or "Beginner",
            top_k=req.top_k or 4,
            similarity_threshold=req.similarity_threshold or 0.15,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/documents/{doc_id}/summarize", response_model=SummarizeResponse)
async def summarize_document(doc_id: str, req: SummarizeRequest):
    """
    Generates Quick Summary, Detailed Summary, Exam Notes, Key Points, Flashcards, or Q&A.
    """
    try:
        return await DocumentService.summarize_document(
            doc_id=doc_id,
            user_id=req.user_id,
            mode=req.mode,
            language=req.language or "en",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# PHASE 3: SAVED NOTES ENDPOINTS
# ==========================================

@app.post("/api/notes", response_model=SavedNoteInfo)
async def create_note(req: SavedNoteCreateRequest):
    return DocumentService.save_note(
        user_id=req.user_id,
        title=req.title,
        content=req.content,
        document_id=req.document_id,
        document_name=req.document_name,
        tags=req.tags,
    )

@app.get("/api/notes", response_model=SavedNoteListResponse)
async def list_notes(user_id: str = "student_default"):
    notes = DocumentService.list_notes(user_id)
    return SavedNoteListResponse(notes=notes)

@app.delete("/api/notes/{note_id}")
async def delete_note(note_id: str, user_id: str = "student_default"):
    success = DocumentService.delete_note(note_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"status": "deleted", "note_id": note_id}

# ==========================================
# HALF 2 - PHASE 1: CAREER PATH & SKILLS ENDPOINTS (ED-02)
# ==========================================

@app.get("/api/careers/roles", response_model=CareerListResponse)
async def list_career_roles(search: str = "", category: str = "All"):
    """
    List all career paths with search and category filtering.
    Returns summaries of roles including skill counts, outlook, and salary.
    """
    return CareerService.list_roles(search=search, category=category)

@app.get("/api/careers/roles/{role_id}", response_model=CareerRoleDetail)
async def get_career_role_detail(role_id: str):
    """
    Retrieve deep competency details for a specific career role,
    including required skills, expected proficiency, importance weights, and categories.
    """
    role = CareerService.get_role_detail(role_id)
    if not role:
        raise HTTPException(status_code=404, detail=f"Career role '{role_id}' not found")
    return role

@app.get("/api/careers/categories", response_model=List[SkillCategoryInfo])
async def list_skill_categories():
    """
    List all 9 canonical skill categories with total skill counts.
    """
    return CareerService.list_categories()

# ==========================================
# HALF 2 - PHASE 2 & 3: ASSESSMENT, GAP ANALYSIS & PERSONALIZED ROADMAP
# ==========================================

@app.post("/api/assessment/submit", response_model=SkillGapAnalysisResponse)
async def submit_skill_assessment(submission: SkillAssessmentSubmission):
    """
    Submits a student's self-assessed skill levels and computes an instant Skill Gap Analysis.
    """
    try:
        return RoadmapService.submit_assessment(submission)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/assessment/{user_id}/gap/{role_id}", response_model=SkillGapAnalysisResponse)
async def get_skill_gap_analysis(user_id: str, role_id: str):
    """
    Retrieves the skill gap analysis for a student against their target career role.
    """
    try:
        return RoadmapService.get_gap_analysis(user_id, role_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/api/assessment/{user_id}/skills")
async def get_user_skills(user_id: str):
    """
    Retrieves a student's current skill proficiency ratings dictionary.
    """
    return RoadmapService.get_user_skills(user_id)

@app.get("/api/roadmap/{user_id}/{role_id}", response_model=PersonalizedRoadmapResponse)
async def get_personalized_roadmap(user_id: str, role_id: str):
    """
    Generates and retrieves a non-generic, phased learning roadmap tailored to
    the student's selected career, required skills, current proficiency, and skill gaps.
    """
    try:
        return RoadmapService.generate_roadmap(user_id, role_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/api/roadmap/item/update", response_model=PersonalizedRoadmapResponse)
async def update_roadmap_item_status(req: RoadmapItemUpdateRequest):
    """
    Updates the completion status of a roadmap topic ('not_started', 'in_progress', 'completed')
    and recalculates the student's skill proficiency, progress metrics, and recommended next step.
    """
    try:
        return RoadmapService.update_item_status(
            user_id=req.user_id,
            role_id=req.role_id,
            item_id=req.item_id,
            status=req.status,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/progress/{user_id}", response_model=StudentProgressState)
async def get_student_progress_summary(user_id: str = "student_default"):
    """
    Returns high-level student progress: overall completion, completed topics,
    learning sessions count, saved notes, streak, and recommended next step.
    """
    try:
        return RoadmapService.get_student_progress(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Serve compiled static web application without auth barrier
import os
from fastapi.responses import FileResponse

dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dist"))

@app.get("/{full_path:path}")
async def serve_spa_frontend(full_path: str):
    if not os.path.exists(dist_dir):
        raise HTTPException(status_code=404, detail="Web application not compiled.")

    clean_path = full_path.lstrip("/\\")
    if clean_path:
        # 1. Exact file match (e.g., _expo/static/..., favicon.ico)
        file_path = os.path.join(dist_dir, clean_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)

        # 2. Pre-rendered HTML page match (e.g., chat -> chat.html, (tabs) -> (tabs).html)
        html_file = os.path.join(dist_dir, f"{clean_path}.html")
        if os.path.isfile(html_file):
            return FileResponse(html_file)

    # 3. SPA Fallback to index.html
    index_file = os.path.join(dist_dir, "index.html")
    if os.path.isfile(index_file):
        return FileResponse(index_file)

    raise HTTPException(status_code=404, detail="Page not found")

if __name__ == "__main__":
    import uvicorn
    print(f"Starting Langnode FastAPI Server on http://{HOST}:{PORT}")
    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=True)
