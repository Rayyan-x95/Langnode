"""
Personalized Learning Roadmap & Skill Gap Analysis Engine (Langnode Half 2 - Phase 3 / ED-02)
Connects Career Goal -> Skill Requirements -> Assessment -> Skill Gaps -> Personalized Roadmap -> Learn with Langnode.
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from backend.schemas import (
    SkillAssessmentSubmission,
    UserSkillRating,
    SkillGapItem,
    SkillGapAnalysisResponse,
    RoadmapItem,
    RoadmapPhase,
    PersonalizedRoadmapResponse,
    StudentProgressState,
)
from backend.career_service import ROLES_DB, SKILLS_DB, ROLE_SKILLS_DB

# Numeric mapping for proficiency levels
LEVEL_NAMES_TO_SCORE: Dict[str, int] = {
    "I Don't Know": 0,
    "None": 0,
    "Beginner": 1,
    "Basic": 2,
    "Intermediate": 3,
    "Advanced": 4,
    "Expert": 5,
}

SCORE_TO_LEVEL_NAMES: Dict[int, str] = {
    0: "I Don't Know",
    1: "Beginner",
    2: "Basic",
    3: "Intermediate",
    4: "Advanced",
    5: "Expert",
}

# User skills store: user_id -> Dict[skill_id, score]
USER_SKILLS_STORE: Dict[str, Dict[str, int]] = {
    "student_default": {
        "sk_js": 2,        # Basic
        "sk_html_css": 2,  # Basic
        "sk_py": 1,        # Beginner
        "sk_git": 2,       # Basic
        "sk_sql": 1,       # Beginner
    }
}

# Active user career selections: user_id -> role_id
USER_ACTIVE_ROLE: Dict[str, str] = {
    "student_default": "role_frontend"
}

# In-memory store for generated personalized roadmaps: (user_id, role_id) -> PersonalizedRoadmapResponse
ROADMAPS_STORE: Dict[str, PersonalizedRoadmapResponse] = {}

# Learning history activity log: user_id -> List[str]
USER_ACTIVITY_LOG: Dict[str, List[str]] = {
    "student_default": [
        "Selected Career: Frontend Developer",
        "Completed Diagnostic Assessment for Web Technologies",
    ]
}

# Curated topic curriculum database by skill key
SKILL_TOPIC_CURRICULUM: Dict[str, List[Dict[str, Any]]] = {
    "sk_js": [
        {"topic": "ES6+ Fundamentals & Scope", "objective": "Master const/let, arrow functions, destructuring, and lexical closures", "activity": "Implement deep clone and curry helper functions", "target": "Intermediate"},
        {"topic": "Async Programming & Promises", "objective": "Understand event loop, Promises, async/await, and error handling", "activity": "Build an async API request queue with retry logic", "target": "Advanced"},
    ],
    "sk_ts": [
        {"topic": "TypeScript Type Foundations", "objective": "Master strict interfaces, unions, tuples, and type assertions", "activity": "Type a complete REST API payload with strict safety", "target": "Intermediate"},
        {"topic": "Generics & Advanced Utilities", "objective": "Implement generic constraints, mapped types, and conditional types", "activity": "Create a type-safe form validator utility", "target": "Advanced"},
    ],
    "sk_py": [
        {"topic": "Python Syntax & Data Structures", "objective": "Master Python idioms, list comprehensions, dicts, and generators", "activity": "Build an in-memory data processing pipeline", "target": "Basic"},
        {"topic": "Async Python & OOP Patterns", "objective": "Learn asyncio, decorators, context managers, and type hinting", "activity": "Construct a concurrent web scraper with error recovery", "target": "Advanced"},
    ],
    "sk_html_css": [
        {"topic": "Semantic HTML5 & Accessibility", "objective": "Design WCAG-compliant accessible landmarks, ARIA labels, and forms", "activity": "Audit and repair screen-reader accessibility on a signup form", "target": "Advanced"},
        {"topic": "Modern CSS Layouts (Grid & Flexbox)", "objective": "Master responsive grid tracks, auto-fit, and fluid typography", "activity": "Build an adaptive bento-grid dashboard layout", "target": "Advanced"},
    ],
    "sk_react": [
        {"topic": "React Hooks & Component Lifecycle", "objective": "Master useState, useEffect, useMemo, and custom hooks", "activity": "Build a custom useDebounce and useFetch hook library", "target": "Advanced"},
        {"topic": "State Management & Architecture", "objective": "Structure complex state flow with Context, reducer patterns, and memoization", "activity": "Architect an offline-first shopping cart state machine", "target": "Advanced"},
    ],
    "sk_nextjs": [
        {"topic": "Expo Router & File-based Routing", "objective": "Understand nested stacks, tab navigators, and deep linking", "activity": "Create dynamic param routes with safe navigation transitions", "target": "Advanced"},
    ],
    "sk_fastapi": [
        {"topic": "FastAPI Async Routing & Pydantic Validation", "objective": "Build high-throughput REST endpoints with strict Pydantic schemas", "activity": "Create authenticated CRUD endpoints with automatic Swagger docs", "target": "Advanced"},
    ],
    "sk_nodejs": [
        {"topic": "Node.js Streams & Event Emitter", "objective": "Manage non-blocking I/O, buffers, and pipeline streams", "activity": "Stream large CSV files without memory exhaustion", "target": "Advanced"},
    ],
    "sk_postgres": [
        {"topic": "Relational Schema Design & Indexing", "objective": "Design normalized tables, composite indexes, and foreign key constraints", "activity": "Write EXPLAIN ANALYZE queries to optimize slow joins", "target": "Intermediate"},
        {"topic": "Vector Similarity Search (pgvector)", "objective": "Store and query high-dimensional embeddings using cosine similarity", "activity": "Implement semantic similarity search over document chunks", "target": "Advanced"},
    ],
    "sk_docker": [
        {"topic": "Containerization & Multi-stage Builds", "objective": "Author minimal production Dockerfiles with non-root security", "activity": "Containerize a full-stack Python and React application", "target": "Intermediate"},
    ],
    "sk_aws": [
        {"topic": "Cloud Deployment & Serverless Functions", "objective": "Deploy scalable APIs with CloudFront, S3 buckets, and IAM roles", "activity": "Configure an automated deployment script for static web assets", "target": "Intermediate"},
    ],
    "sk_cicd": [
        {"topic": "GitHub Actions Automated Pipelines", "objective": "Write automated CI workflows for linting, testing, and branch protection", "activity": "Set up a pipeline that gates pull requests on passing unit tests", "target": "Intermediate"},
    ],
    "sk_ml_basics": [
        {"topic": "Supervised Learning with Scikit-Learn", "objective": "Train classification, regression, and clustering models with train-test splits", "activity": "Train a customer churn predictor and evaluate ROC-AUC", "target": "Intermediate"},
    ],
    "sk_deep_learning": [
        {"topic": "Neural Networks & PyTorch Fundamentals", "objective": "Implement tensors, backpropagation, and multilayer perceptrons", "activity": "Build and train an image classification network from scratch", "target": "Advanced"},
    ],
    "sk_rag_embeddings": [
        {"topic": "RAG Architecture & Semantic Chunking", "objective": "Master chunking strategies, embeddings, vector stores, and prompt context", "activity": "Build an end-to-end document question answering system", "target": "Advanced"},
    ],
    "sk_figma": [
        {"topic": "Figma Auto-Layout & Component Variants", "objective": "Build responsive design components with interactive states and variants", "activity": "Create a reusable mobile navigation component system", "target": "Advanced"},
    ],
    "sk_design_systems": [
        {"topic": "Design Tokens & Atomic Component Architecture", "objective": "Standardize color palettes, typography scales, and spacing tokens", "activity": "Define theme tokens compatible with dark and light modes", "target": "Intermediate"},
    ],
    "sk_user_research": [
        {"topic": "Usability Testing & Heuristic Evaluation", "objective": "Conduct qualitative user testing sessions and synthesize user friction", "activity": "Produce a heuristic evaluation report for an onboarding funnel", "target": "Intermediate"},
    ],
    "sk_tech_writing": [
        {"topic": "Technical Documentation & Architecture Decision Records", "objective": "Draft precise API documentation, quickstarts, and ADRs", "activity": "Write a comprehensive developer README and integration guide", "target": "Intermediate"},
    ],
    "sk_stakeholder": [
        {"topic": "Communicating Architecture & Trade-Offs", "objective": "Present engineering constraints clearly to non-technical stakeholders", "activity": "Synthesize a 5-minute technical trade-off proposal", "target": "Intermediate"},
    ],
    "sk_dsa": [
        {"topic": "Data Structures & Time/Space Complexity", "objective": "Analyze Big-O bounds and implement trees, graphs, and hash maps", "activity": "Solve binary search and graph traversal interview problems", "target": "Advanced"},
    ],
    "sk_system_design": [
        {"topic": "Scalable System Architecture & Load Balancing", "objective": "Design fault-tolerant architectures with caching, queues, and replication", "activity": "Draw and defend a system design diagram for a high-traffic app", "target": "Advanced"},
    ],
    "sk_debugging": [
        {"topic": "Root Cause Debugging & Memory Profiling", "objective": "Inspect call stacks, trace memory leaks, and analyze network logs", "activity": "Diagnose and fix an artificial race condition in a web app", "target": "Advanced"},
    ],
    "sk_git": [
        {"topic": "Git Branching, Rebasing & Conflict Resolution", "objective": "Master feature branches, interactive rebasing, and merge resolution", "activity": "Simulate and resolve a complex three-way merge conflict", "target": "Intermediate"},
    ],
    "sk_api_tools": [
        {"topic": "API Testing, Mocking & Automated Collections", "objective": "Validate HTTP requests, query params, auth tokens, and response schemas", "activity": "Create an automated Postman test collection with assertion checks", "target": "Intermediate"},
    ],
    "sk_security_tools": [
        {"topic": "OWASP Top 10 & Vulnerability Scanning", "objective": "Identify SQL injection, XSS, CSRF, and broken authorization flaws", "activity": "Perform a security audit on an API and patch authorization loopholes", "target": "Advanced"},
    ],
    "sk_redis": [
        {"topic": "Redis In-Memory Caching & Rate Limiting", "objective": "Implement TTL key-value caching and sliding-window rate limiters", "activity": "Add Redis caching to a high-latency database endpoint", "target": "Intermediate"},
    ],
    "sk_nosql": [
        {"topic": "Document Modeling & NoSQL Schema Design", "objective": "Design schema-flexible document collections with aggregation pipelines", "activity": "Model a hierarchical user commenting system in MongoDB", "target": "Intermediate"},
    ],
    "sk_bash": [
        {"topic": "Linux Shell Scripting & CLI Automation", "objective": "Automate routine deployments, cron tasks, and log parsing with Bash", "activity": "Write a bash utility that audits server disk space and triggers alerts", "target": "Advanced"},
    ],
}


class RoadmapService:
    @classmethod
    def get_user_skills(cls, user_id: str) -> Dict[str, int]:
        return USER_SKILLS_STORE.get(user_id, USER_SKILLS_STORE["student_default"].copy())

    @classmethod
    def submit_assessment(cls, submission: SkillAssessmentSubmission) -> SkillGapAnalysisResponse:
        user_id = submission.user_id
        if user_id not in USER_SKILLS_STORE:
            USER_SKILLS_STORE[user_id] = {}

        for rating in submission.ratings:
            score = rating.level_score
            if score == 0 and rating.level in LEVEL_NAMES_TO_SCORE:
                score = LEVEL_NAMES_TO_SCORE[rating.level]
            USER_SKILLS_STORE[user_id][rating.skill_id] = score

        USER_ACTIVE_ROLE[user_id] = submission.role_id
        cls.record_activity(user_id, f"Completed skill assessment for {submission.role_id}")

        # Invalidate old roadmap cache so a fresh one reflects newly assessed levels
        cache_key = f"{user_id}:{submission.role_id}"
        if cache_key in ROADMAPS_STORE:
            del ROADMAPS_STORE[cache_key]

        return cls.get_gap_analysis(user_id, submission.role_id)

    @classmethod
    def get_gap_analysis(cls, user_id: str, role_id: str) -> SkillGapAnalysisResponse:
        role = ROLES_DB.get(role_id)
        if not role:
            # Try slug
            for r in ROLES_DB.values():
                if r["slug"] == role_id:
                    role = r
                    role_id = r["id"]
                    break

        if not role:
            raise ValueError(f"Role '{role_id}' not found")

        role_skills = ROLE_SKILLS_DB.get(role_id, [])
        user_skills = cls.get_user_skills(user_id)

        strong_skills: List[SkillGapItem] = []
        developing_skills: List[SkillGapItem] = []
        improvement_needed_skills: List[SkillGapItem] = []
        missing_skills: List[SkillGapItem] = []
        all_gap_items: List[SkillGapItem] = []

        total_target_score = 0
        total_current_score = 0

        for rs in role_skills:
            skill = SKILLS_DB.get(rs["skill_id"])
            if not skill:
                continue

            current_score = user_skills.get(skill["id"], 0)
            expected_score = rs["proficiency_level"]
            gap = max(0, expected_score - current_score)

            total_target_score += expected_score
            total_current_score += min(current_score, expected_score)

            current_level_name = SCORE_TO_LEVEL_NAMES.get(current_score, "I Don't Know")
            expected_level_name = rs["expected_proficiency"]

            # Determine recommended action
            if gap <= 0:
                status = "Strong"
                action = f"Maintain mastery through project applications and mentoring."
            elif gap == 1:
                status = "Developing"
                action = f"Bridge the final step to reach {expected_level_name} with advanced practice."
            elif gap == 2:
                status = "Improvement Needed"
                action = f"Deepen conceptual fundamentals and complete structured exercises."
            else:
                status = "Missing"
                action = f"Start foundational study from scratch with Langnode AI Tutor."

            gap_item = SkillGapItem(
                skill_id=skill["id"],
                skill_name=skill["name"],
                category=skill["category"],
                importance=rs["importance"],
                current_level=current_level_name,
                current_score=current_score,
                expected_level=expected_level_name,
                expected_score=expected_score,
                gap=gap,
                recommended_action=action,
                status=status,
            )

            all_gap_items.append(gap_item)

            if gap <= 0:
                strong_skills.append(gap_item)
            elif gap == 1:
                developing_skills.append(gap_item)
            elif gap == 2:
                improvement_needed_skills.append(gap_item)
            else:
                missing_skills.append(gap_item)

        # Priority areas: Essential and Core skills with gap >= 1
        importance_rank = {"Essential": 1, "Core": 2, "Recommended": 3, "Bonus": 4}
        priority_candidates = [item for item in all_gap_items if item.gap > 0]
        priority_candidates.sort(key=lambda x: (importance_rank.get(x.importance, 5), -x.gap, x.skill_name))
        priority_areas = priority_candidates[:6]

        readiness = (total_current_score / total_target_score * 100) if total_target_score > 0 else 0.0

        summary = (
            f"You possess {len(strong_skills)} strong competencies out of {len(role_skills)} required for {role['name']}. "
            f"Focus on {len(priority_areas)} priority areas to accelerate your career readiness from {readiness:.0f}%."
        )

        return SkillGapAnalysisResponse(
            role_id=role["id"],
            role_name=role["name"],
            user_id=user_id,
            total_skills=len(role_skills),
            strong_skills=strong_skills,
            developing_skills=developing_skills,
            improvement_needed_skills=improvement_needed_skills,
            missing_skills=missing_skills,
            priority_areas=priority_areas,
            readiness_percentage=round(readiness, 1),
            summary=summary,
        )

    @classmethod
    def generate_roadmap(cls, user_id: str, role_id: str) -> PersonalizedRoadmapResponse:
        cache_key = f"{user_id}:{role_id}"
        if cache_key in ROADMAPS_STORE:
            return ROADMAPS_STORE[cache_key]

        role = ROLES_DB.get(role_id)
        if not role:
            for r in ROLES_DB.values():
                if r["slug"] == role_id:
                    role = r
                    role_id = r["id"]
                    break

        if not role:
            raise ValueError(f"Role '{role_id}' not found")

        gap_analysis = cls.get_gap_analysis(user_id, role_id)
        role_skills = ROLE_SKILLS_DB.get(role_id, [])

        # Build personalized phased roadmap (5 canonical progressive phases)
        # Phase 1: Foundational Core & Prerequisites (Essential skills with biggest gaps)
        # Phase 2: Core Engineering & Architecture (Core frameworks & databases)
        # Phase 3: Domain Specialization & Advanced Competencies (Role-specific depth)
        # Phase 4: Production Tooling, Testing & System Resilience (CI/CD, Docker, Debugging)
        # Phase 5: Capstone Project, Portfolio & Career Readiness (End-to-end demonstration)

        phase_buckets: Dict[int, List[RoadmapItem]] = {1: [], 2: [], 3: [], 4: [], 5: []}

        # 1. Distribute skills into phases based on gap analysis and importance
        item_counter = 1

        # Phase 1: High priority foundational gaps (Programming, HTML/CSS, Git)
        foundational_skills = [
            s for s in role_skills
            if s["importance"] == "Essential" and SKILLS_DB.get(s["skill_id"], {}).get("category") in ["Programming", "Design"]
        ]
        for rs in foundational_skills:
            skill_id = rs["skill_id"]
            user_score = cls.get_user_skills(user_id).get(skill_id, 0)
            topics = SKILL_TOPIC_CURRICULUM.get(skill_id, [])
            for t in topics:
                item = RoadmapItem(
                    id=f"item_{item_counter}",
                    phase_number=1,
                    phase_name="Phase 1: Foundational Core & Prerequisites",
                    skill_id=skill_id,
                    skill_name=SKILLS_DB[skill_id]["name"],
                    topic=t["topic"],
                    current_level=SCORE_TO_LEVEL_NAMES.get(user_score, "Beginner"),
                    target_level=rs["expected_proficiency"],
                    learning_objective=t["objective"],
                    recommended_activity=t["activity"],
                    status="completed" if user_score >= rs["proficiency_level"] else "not_started",
                    estimated_hours=4,
                )
                phase_buckets[1].append(item)
                item_counter += 1

        # Phase 2: Frameworks and Databases
        framework_skills = [
            s for s in role_skills
            if SKILLS_DB.get(s["skill_id"], {}).get("category") in ["Frameworks", "Databases"]
        ]
        for rs in framework_skills:
            skill_id = rs["skill_id"]
            user_score = cls.get_user_skills(user_id).get(skill_id, 0)
            topics = SKILL_TOPIC_CURRICULUM.get(skill_id, [])
            for t in topics:
                item = RoadmapItem(
                    id=f"item_{item_counter}",
                    phase_number=2,
                    phase_name="Phase 2: Frameworks & System Architecture",
                    skill_id=skill_id,
                    skill_name=SKILLS_DB[skill_id]["name"],
                    topic=t["topic"],
                    current_level=SCORE_TO_LEVEL_NAMES.get(user_score, "Beginner"),
                    target_level=rs["expected_proficiency"],
                    learning_objective=t["objective"],
                    recommended_activity=t["activity"],
                    status="completed" if user_score >= rs["proficiency_level"] else "not_started",
                    estimated_hours=5,
                )
                phase_buckets[2].append(item)
                item_counter += 1

        # Phase 3: AI/ML, Cloud, Security or Advanced Domain Depth
        specialized_skills = [
            s for s in role_skills
            if SKILLS_DB.get(s["skill_id"], {}).get("category") in ["AI/ML", "Cloud", "Tools", "Problem Solving"]
            and s["skill_id"] not in [i.skill_id for i in phase_buckets[1] + phase_buckets[2]]
        ]
        for rs in specialized_skills:
            skill_id = rs["skill_id"]
            user_score = cls.get_user_skills(user_id).get(skill_id, 0)
            topics = SKILL_TOPIC_CURRICULUM.get(skill_id, [])
            for t in topics:
                item = RoadmapItem(
                    id=f"item_{item_counter}",
                    phase_number=3,
                    phase_name="Phase 3: Domain Specialization & Depth",
                    skill_id=skill_id,
                    skill_name=SKILLS_DB[skill_id]["name"],
                    topic=t["topic"],
                    current_level=SCORE_TO_LEVEL_NAMES.get(user_score, "Beginner"),
                    target_level=rs["expected_proficiency"],
                    learning_objective=t["objective"],
                    recommended_activity=t["activity"],
                    status="completed" if user_score >= rs["proficiency_level"] else "not_started",
                    estimated_hours=5,
                )
                phase_buckets[3].append(item)
                item_counter += 1

        # Phase 4: Production Tooling, Testing & System Resilience
        production_skills = [
            s for s in role_skills
            if SKILLS_DB.get(s["skill_id"], {}).get("category") in ["Cloud", "Tools", "Problem Solving"]
            and s["skill_id"] in ["sk_docker", "sk_cicd", "sk_debugging", "sk_security_tools"]
        ]
        for rs in production_skills:
            skill_id = rs["skill_id"]
            user_score = cls.get_user_skills(user_id).get(skill_id, 0)
            topics = SKILL_TOPIC_CURRICULUM.get(skill_id, [])
            for t in topics:
                # Avoid duplicate items across phases
                if any(existing.topic == t["topic"] for existing in phase_buckets[1] + phase_buckets[2] + phase_buckets[3]):
                    continue
                item = RoadmapItem(
                    id=f"item_{item_counter}",
                    phase_number=4,
                    phase_name="Phase 4: Production Resilience & Tooling",
                    skill_id=skill_id,
                    skill_name=SKILLS_DB[skill_id]["name"],
                    topic=t["topic"],
                    current_level=SCORE_TO_LEVEL_NAMES.get(user_score, "Beginner"),
                    target_level=rs["expected_proficiency"],
                    learning_objective=t["objective"],
                    recommended_activity=t["activity"],
                    status="completed" if user_score >= rs["proficiency_level"] else "not_started",
                    estimated_hours=4,
                )
                phase_buckets[4].append(item)
                item_counter += 1

        # Phase 5: Capstone, Communication & Professional Portfolio
        capstone_items = [
            RoadmapItem(
                id=f"item_{item_counter}",
                phase_number=5,
                phase_name="Phase 5: Capstone Portfolio & Interview Mastery",
                skill_id="sk_tech_writing",
                skill_name="Technical Documentation & System Design",
                topic=f"{role['name']} Production Capstone Application",
                current_level="Intermediate",
                target_level="Advanced",
                learning_objective=f"Build and document an end-to-end production-grade {role['name']} project with unit tests and clear architecture decisions",
                recommended_activity="Deploy the capstone project live and prepare a walkthrough for mock technical interviews",
                status="not_started",
                estimated_hours=8,
            )
        ]
        phase_buckets[5].extend(capstone_items)

        # Assemble RoadmapPhase objects
        phase_titles = {
            1: ("Phase 1: Foundational Core & Prerequisites", "Establish required baseline syntax, language idioms, and structural concepts."),
            2: ("Phase 2: Frameworks & System Architecture", "Master primary frameworks, component lifecycles, and database interactions."),
            3: ("Phase 3: Domain Specialization & Depth", "Develop competitive depth in algorithms, vector search, or cloud orchestration."),
            4: ("Phase 4: Production Resilience & Tooling", "Harden workflows with containerization, CI/CD automated gates, and root-cause debugging."),
            5: ("Phase 5: Capstone Portfolio & Interview Mastery", "Prove competency through an integrated capstone project and technical interview defense."),
        }

        phases_list: List[RoadmapPhase] = []
        total_topics = 0
        completed_topics = 0

        for p_num in range(1, 6):
            items = phase_buckets.get(p_num, [])
            p_comp = sum(1 for i in items if i.status == "completed")
            total_topics += len(items)
            completed_topics += p_comp
            title, desc = phase_titles[p_num]

            # Phase is unlocked if previous phase is at least partially completed or it's Phase 1
            is_unlocked = (p_num == 1) or (p_num == 2) or (completed_topics > 0)

            phases_list.append(
                RoadmapPhase(
                    phase_number=p_num,
                    title=title,
                    description=desc,
                    items=items,
                    completed_items_count=p_comp,
                    total_items_count=len(items),
                    is_unlocked=is_unlocked,
                )
            )

        # Find the single recommended next step
        recommended_next_step: Optional[RoadmapItem] = None
        for p in phases_list:
            for item in p.items:
                if item.status != "completed":
                    recommended_next_step = item
                    break
            if recommended_next_step:
                break

        completion_pct = (completed_topics / total_topics * 100) if total_topics > 0 else 0.0
        now_iso = datetime.now(timezone.utc).isoformat()

        roadmap = PersonalizedRoadmapResponse(
            id=f"roadmap_{user_id}_{role_id}",
            user_id=user_id,
            role_id=role_id,
            role_name=role["name"],
            created_at=now_iso,
            updated_at=now_iso,
            total_phases=5,
            total_topics=total_topics,
            completed_topics=completed_topics,
            completion_percentage=round(completion_pct, 1),
            phases=phases_list,
            recommended_next_step=recommended_next_step,
        )

        ROADMAPS_STORE[cache_key] = roadmap
        USER_ACTIVE_ROLE[user_id] = role_id
        return roadmap

    @classmethod
    def update_item_status(
        cls, user_id: str, role_id: str, item_id: str, status: str
    ) -> PersonalizedRoadmapResponse:
        cache_key = f"{user_id}:{role_id}"
        roadmap = cls.generate_roadmap(user_id, role_id)

        target_item: Optional[RoadmapItem] = None
        for p in roadmap.phases:
            for item in p.items:
                if item.id == item_id:
                    target_item = item
                    item.status = status
                    if status == "completed":
                        item.completed_at = datetime.now(timezone.utc).isoformat()
                        # Increment user skill in user skills store if completed
                        curr_score = USER_SKILLS_STORE.get(user_id, {}).get(item.skill_id, 1)
                        if curr_score < 4:
                            USER_SKILLS_STORE.setdefault(user_id, {})[item.skill_id] = curr_score + 1
                        cls.record_activity(user_id, f"Completed roadmap topic: {item.topic} ({item.skill_name})")
                    break
            if target_item:
                break

        if not target_item:
            raise ValueError(f"Roadmap item '{item_id}' not found")

        # Recalculate totals
        total_topics = sum(len(p.items) for p in roadmap.phases)
        completed_topics = sum(
            sum(1 for i in p.items if i.status == "completed") for p in roadmap.phases
        )
        roadmap.completed_topics = completed_topics
        roadmap.completion_percentage = round((completed_topics / total_topics * 100), 1) if total_topics > 0 else 0.0

        for p in roadmap.phases:
            p.completed_items_count = sum(1 for i in p.items if i.status == "completed")

        # Recalculate recommended next step
        recommended: Optional[RoadmapItem] = None
        for p in roadmap.phases:
            for item in p.items:
                if item.status != "completed":
                    recommended = item
                    break
            if recommended:
                break
        roadmap.recommended_next_step = recommended
        roadmap.updated_at = datetime.now(timezone.utc).isoformat()

        ROADMAPS_STORE[cache_key] = roadmap
        return roadmap

    @classmethod
    def record_activity(cls, user_id: str, text: str) -> None:
        if user_id not in USER_ACTIVITY_LOG:
            USER_ACTIVITY_LOG[user_id] = []
        USER_ACTIVITY_LOG[user_id].insert(0, text)
        if len(USER_ACTIVITY_LOG[user_id]) > 10:
            USER_ACTIVITY_LOG[user_id] = USER_ACTIVITY_LOG[user_id][:10]

    @classmethod
    def get_student_progress(cls, user_id: str = "student_default") -> StudentProgressState:
        from backend.document_service import DocumentService

        active_role_id = USER_ACTIVE_ROLE.get(user_id, "role_frontend")
        role = ROLES_DB.get(active_role_id)
        role_name = role["name"] if role else "Frontend Developer"

        # Generate or load roadmap
        roadmap = cls.generate_roadmap(user_id, active_role_id)

        in_progress_count = sum(
            sum(1 for i in p.items if i.status == "in_progress") for p in roadmap.phases
        )

        notes = DocumentService.list_notes(user_id)

        # Count skills leveled up (score >= 2)
        user_skills = cls.get_user_skills(user_id)
        skills_leveled_up = sum(1 for score in user_skills.values() if score >= 2)

        return StudentProgressState(
            user_id=user_id,
            active_role_id=active_role_id,
            active_role_name=role_name,
            completion_percentage=roadmap.completion_percentage,
            total_topics_count=roadmap.total_topics,
            completed_topics_count=roadmap.completed_topics,
            in_progress_topics_count=in_progress_count,
            skills_leveled_up=skills_leveled_up,
            learning_sessions_count=roadmap.completed_topics + 2,
            saved_notes_count=len(notes),
            current_streak_days=3,
            recommended_next_step=roadmap.recommended_next_step,
            recent_activity=USER_ACTIVITY_LOG.get(user_id, []),
        )
