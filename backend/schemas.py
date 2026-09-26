from typing import List, Optional
from pydantic import BaseModel, Field

class ChatMessagePayload(BaseModel):
    role: str = Field(..., description="Role of the sender: user, assistant, or system")
    content: str = Field(..., description="Message text content")

class ChatRequest(BaseModel):
    message: str = Field(..., description="User's concept question or instructional query (can be mixed-language like 'Photosynthesis epdi work aaguthu?')")
    language: str = Field(default="auto", description="Target language code: auto, en, ta, hi, te, ml, kn")
    explanation_level: str = Field(default="Beginner", description="Explanation level: Beginner, Intermediate, Advanced")
    explanation_mode: Optional[str] = Field(default="standard", description="Explanation mode: standard, simply, example, analogy")
    conversation_id: Optional[str] = Field(default=None, description="Active conversation session ID")
    history: Optional[List[ChatMessagePayload]] = Field(default_factory=list, description="Recent conversation turns")

class ChatResponse(BaseModel):
    conversation_id: str
    response: str
    language: str
    explanation_level: str
    explanation_mode: str = Field(default="standard", description="standard, simply, example, analogy")
    is_mixed: bool = Field(default=False, description="True if code-switching / mixed language detected")
    detected_topic: Optional[str] = Field(default=None, description="Extracted technical concept name")
    key_concepts: List[str] = Field(default_factory=list)
    suggested_followups: List[str] = Field(default_factory=list)
    analogies_used: List[str] = Field(default_factory=list)
    preserved_terms: List[str] = Field(default_factory=list)

class LanguageInfo(BaseModel):
    code: str
    name: str
    native_name: str
    script: str
    sample_topic: str

class ExplanationLevelInfo(BaseModel):
    id: str
    title: str
    subtitle: str
    description: str

class LanguageDetectionResult(BaseModel):
    language: str
    confidence: float
    is_mixed: bool
    script: str
    detected_topic: str
    intent: str
    original_framing: Optional[str] = None

class LanguageDetectionRequest(BaseModel):
    text: str

class TranslationRequest(BaseModel):
    text: str
    source_language: str = Field(default="en")
    target_language: str = Field(default="ta")
    preserve_terms: bool = Field(default=True)

class TranslationResponse(BaseModel):
    original_text: str
    translated_text: str
    source_language: str
    target_language: str
    preserved_terms: List[str] = Field(default_factory=list)

class ExplainModeRequest(BaseModel):
    concept: str
    mode: str = Field(..., description="simply, example, analogy")
    language: str = Field(default="en")
    level: str = Field(default="Beginner")
    conversation_id: Optional[str] = None

class VoiceTranscribeRequest(BaseModel):
    audio_base64: Optional[str] = None
    sample_rate: Optional[int] = 16000
    simulated_transcript: Optional[str] = None
    language_hint: Optional[str] = None

class VoiceTranscribeResponse(BaseModel):
    transcript: str
    detected_language: str
    is_mixed: bool
    confidence: float
    extracted_topic: str

class HealthResponse(BaseModel):
    status: str
    version: str
    supported_languages: int
    supported_levels: int
    voice_enabled: bool = True
    rag_enabled: bool = True

# ==========================================
# PHASE 3: DOCUMENT RAG & SUMMARIZATION SCHEMAS
# ==========================================

class DocumentUploadRequest(BaseModel):
    filename: str
    file_base64: str
    file_type: str = "pdf"
    user_id: str = "student_default"

class DocumentInfo(BaseModel):
    id: str
    user_id: str
    filename: str
    file_type: str
    size_bytes: int
    total_pages: int
    total_chunks: int
    detected_language: str
    status: str = "ready"  # processing, ready, failed
    error_message: Optional[str] = None
    created_at: str

class DocumentListResponse(BaseModel):
    documents: List[DocumentInfo]

class SourceCitation(BaseModel):
    document_id: str
    document_name: str
    page_number: Optional[int] = None
    chunk_index: int
    snippet: str
    similarity: float

class RAGQueryRequest(BaseModel):
    document_id: str
    query: str
    language: Optional[str] = "auto"
    explanation_level: Optional[str] = "Beginner"
    top_k: Optional[int] = 4
    similarity_threshold: Optional[float] = 0.15
    user_id: str = "student_default"

class RAGQueryResponse(BaseModel):
    answer: str
    language: str
    sources: List[SourceCitation]
    key_concepts: List[str] = Field(default_factory=list)
    preserved_terms: List[str] = Field(default_factory=list)

class FlashcardItem(BaseModel):
    front: str
    back: str
    concept: str

class QAItem(BaseModel):
    question: str
    answer: str
    page_reference: Optional[int] = None

class SummarizeRequest(BaseModel):
    document_id: str
    mode: str = "quick"  # quick, detailed, exam_notes, key_points, flashcards, qa
    language: Optional[str] = "en"
    user_id: str = "student_default"

class SummarizeResponse(BaseModel):
    document_id: str
    document_name: str
    mode: str
    language: str
    content: str
    flashcards: Optional[List[FlashcardItem]] = None
    qa_items: Optional[List[QAItem]] = None
    sources: List[SourceCitation] = Field(default_factory=list)

class SavedNoteCreateRequest(BaseModel):
    title: str
    content: str
    document_id: Optional[str] = None
    document_name: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    user_id: str = "student_default"

class SavedNoteInfo(BaseModel):
    id: str
    user_id: str
    title: str
    content: str
    document_id: Optional[str] = None
    document_name: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    created_at: str

class SavedNoteListResponse(BaseModel):
    notes: List[SavedNoteInfo]

# ==========================================
# HALF 2 - PHASE 1: CAREER PATH & SKILLS SCHEMAS (ED-02)
# ==========================================

class SkillInfo(BaseModel):
    id: str
    name: str
    category: str
    description: str
    icon: str

class RoleSkillInfo(BaseModel):
    skill_id: str
    skill_name: str
    category: str
    importance: str  # Essential, Core, Recommended, Bonus
    expected_proficiency: str  # Beginner, Intermediate, Advanced, Expert
    proficiency_level: int = 1  # 1: Beginner, 2: Intermediate, 3: Advanced, 4: Expert
    description: str

class CareerRoleSummary(BaseModel):
    id: str
    name: str
    slug: str
    category: str
    description: str
    icon: str
    badge_color: str
    total_skills: int
    essential_count: int
    growth_outlook: str
    avg_salary: str

class CareerRoleDetail(BaseModel):
    id: str
    name: str
    slug: str
    category: str
    description: str
    icon: str
    badge_color: str
    growth_outlook: str
    avg_salary: str
    why_choose_this: List[str] = Field(default_factory=list)
    skills: List[RoleSkillInfo]
    categories_covered: List[str]

class CareerListResponse(BaseModel):
    roles: List[CareerRoleSummary]
    categories: List[str]

class SkillCategoryInfo(BaseModel):
    name: str
    count: int
    icon: str

# ==========================================
# HALF 2 - PHASE 2 & 3: ASSESSMENT, GAP ANALYSIS & ROADMAP SCHEMAS
# ==========================================

class UserSkillRating(BaseModel):
    skill_id: str
    skill_name: str
    level: str  # Beginner, Basic, Intermediate, Advanced, Expert, I Don't Know
    level_score: int = 0  # 0: I Don't Know / None, 1: Beginner, 2: Basic, 3: Intermediate, 4: Advanced, 5: Expert

class SkillAssessmentSubmission(BaseModel):
    user_id: str = "student_default"
    role_id: str
    ratings: List[UserSkillRating]

class SkillGapItem(BaseModel):
    skill_id: str
    skill_name: str
    category: str
    importance: str  # Essential, Core, Recommended, Bonus
    current_level: str
    current_score: int
    expected_level: str
    expected_score: int
    gap: int
    recommended_action: str
    status: str  # Strong, Developing, Improvement Needed, Missing

class SkillGapAnalysisResponse(BaseModel):
    role_id: str
    role_name: str
    user_id: str
    total_skills: int
    strong_skills: List[SkillGapItem]
    developing_skills: List[SkillGapItem]
    improvement_needed_skills: List[SkillGapItem]
    missing_skills: List[SkillGapItem]
    priority_areas: List[SkillGapItem]
    readiness_percentage: float
    summary: str

class RoadmapItem(BaseModel):
    id: str
    phase_number: int
    phase_name: str
    skill_id: str
    skill_name: str
    topic: str
    current_level: str
    target_level: str
    learning_objective: str
    recommended_activity: str
    status: str = "not_started"  # not_started, in_progress, completed
    completed_at: Optional[str] = None
    estimated_hours: int = 4

class RoadmapPhase(BaseModel):
    phase_number: int
    title: str
    description: str
    items: List[RoadmapItem]
    completed_items_count: int = 0
    total_items_count: int = 0
    is_unlocked: bool = True

class PersonalizedRoadmapResponse(BaseModel):
    id: str
    user_id: str
    role_id: str
    role_name: str
    created_at: str
    updated_at: str
    total_phases: int
    total_topics: int
    completed_topics: int
    completion_percentage: float
    phases: List[RoadmapPhase]
    recommended_next_step: Optional[RoadmapItem] = None

class RoadmapItemUpdateRequest(BaseModel):
    user_id: str = "student_default"
    role_id: str
    item_id: str
    status: str  # not_started, in_progress, completed

class StudentProgressState(BaseModel):
    user_id: str
    active_role_id: Optional[str] = None
    active_role_name: Optional[str] = None
    completion_percentage: float = 0.0
    total_topics_count: int = 0
    completed_topics_count: int = 0
    in_progress_topics_count: int = 0
    skills_leveled_up: int = 0
    learning_sessions_count: int = 0
    saved_notes_count: int = 0
    current_streak_days: int = 1
    recommended_next_step: Optional[RoadmapItem] = None
    recent_activity: List[str] = Field(default_factory=list)

