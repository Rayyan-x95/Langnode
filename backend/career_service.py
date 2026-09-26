"""
CareerService & Competency Landscape Engine for Langnode Half 2 - Phase 1.
Addresses Problem Statement ED-02:
Students often lack visibility into the competency landscape associated with their intended career paths.
Provides database models and queries for roles, skills, and role_skills.
"""

from typing import Dict, List, Optional, Any
from backend.schemas import (
    CareerRoleSummary,
    CareerRoleDetail,
    RoleSkillInfo,
    SkillInfo,
    CareerListResponse,
    SkillCategoryInfo,
)

# 9 Canonical Skill Categories required by ED-02
SKILL_CATEGORIES = [
    "Programming",
    "Frameworks",
    "Databases",
    "Cloud",
    "AI/ML",
    "Design",
    "Communication",
    "Problem Solving",
    "Tools",
]

# Database Table: skills
SKILLS_DB: Dict[str, Dict[str, Any]] = {
    # Programming
    "sk_js": {"id": "sk_js", "name": "JavaScript (ES6+)", "category": "Programming", "description": "Core language for modern web and node ecosystems.", "icon": "logo-javascript"},
    "sk_ts": {"id": "sk_ts", "name": "TypeScript", "category": "Programming", "description": "Typed JavaScript for large-scale enterprise maintainability.", "icon": "code-slash"},
    "sk_py": {"id": "sk_py", "name": "Python", "category": "Programming", "description": "Versatile language for backend, data science, automation, and AI.", "icon": "logo-python"},
    "sk_sql": {"id": "sk_sql", "name": "SQL & Relational Querying", "category": "Programming", "description": "Declarative querying, schema design, and query optimization.", "icon": "server"},
    "sk_html_css": {"id": "sk_html_css", "name": "HTML5 & Modern CSS", "category": "Programming", "description": "Semantic markup, flexbox, grid, accessibility, and animations.", "icon": "logo-html5"},
    "sk_bash": {"id": "sk_bash", "name": "Bash & Shell Scripting", "category": "Programming", "description": "Terminal automation, process orchestration, and scripting.", "icon": "terminal"},

    # Frameworks
    "sk_react": {"id": "sk_react", "name": "React & React Native", "category": "Frameworks", "description": "Component architecture, hooks, state management, and mobile UI.", "icon": "logo-react"},
    "sk_nextjs": {"id": "sk_nextjs", "name": "Next.js & Expo Router", "category": "Frameworks", "description": "File-based routing, SSR, static export, and hybrid mobile navigation.", "icon": "layers"},
    "sk_fastapi": {"id": "sk_fastapi", "name": "FastAPI & Python ASGI", "category": "Frameworks", "description": "High-performance async REST APIs with Pydantic validation.", "icon": "flash"},
    "sk_nodejs": {"id": "sk_nodejs", "name": "Node.js & Express", "category": "Frameworks", "description": "Event-driven asynchronous server-side JavaScript runtimes.", "icon": "logo-nodejs"},

    # Databases
    "sk_postgres": {"id": "sk_postgres", "name": "PostgreSQL & pgvector", "category": "Databases", "description": "Advanced open-source relational DB with vector similarity search.", "icon": "cylinder"},
    "sk_redis": {"id": "sk_redis", "name": "Redis In-Memory Caching", "category": "Databases", "description": "High-throughput key-value store, sessions, and pub/sub queues.", "icon": "speedometer"},
    "sk_nosql": {"id": "sk_nosql", "name": "MongoDB / NoSQL Document Stores", "category": "Databases", "description": "Schema-flexible document databases for rapid prototyping.", "icon": "folder"},

    # Cloud
    "sk_docker": {"id": "sk_docker", "name": "Docker & Containerization", "category": "Cloud", "description": "Consistent environments, Dockerfiles, and container orchestration.", "icon": "cube"},
    "sk_aws": {"id": "sk_aws", "name": "Cloud Infrastructure (AWS / GCP)", "category": "Cloud", "description": "Compute instances, S3 storage, serverless functions, and IAM.", "icon": "cloud"},
    "sk_cicd": {"id": "sk_cicd", "name": "CI/CD & GitHub Actions", "category": "Cloud", "description": "Automated linting, testing, and continuous deployment pipelines.", "icon": "git-network"},

    # AI/ML
    "sk_ml_basics": {"id": "sk_ml_basics", "name": "Scikit-Learn & Machine Learning", "category": "AI/ML", "description": "Classification, regression, clustering, and model evaluation.", "icon": "analytics"},
    "sk_deep_learning": {"id": "sk_deep_learning", "name": "PyTorch & Neural Networks", "category": "AI/ML", "description": "Tensors, autograd, backpropagation, and transformer models.", "icon": "hardware-chip"},
    "sk_rag_embeddings": {"id": "sk_rag_embeddings", "name": "RAG & Vector Search", "category": "AI/ML", "description": "Document chunking, semantic retrieval, embeddings, and LLMs.", "icon": "sparkles"},

    # Design
    "sk_figma": {"id": "sk_figma", "name": "Figma & UI Prototyping", "category": "Design", "description": "Component design systems, auto-layout, wireframes, and prototypes.", "icon": "color-palette"},
    "sk_user_research": {"id": "sk_user_research", "name": "User Research & Usability Testing", "category": "Design", "description": "Heuristic evaluation, user interviews, and accessibility standards.", "icon": "people"},
    "sk_design_systems": {"id": "sk_design_systems", "name": "Design Systems & Tokens", "category": "Design", "description": "Consistent typography, spacing, palettes, and atomic components.", "icon": "grid"},

    # Communication
    "sk_tech_writing": {"id": "sk_tech_writing", "name": "Technical Documentation", "category": "Communication", "description": "API contracts, architecture decision records, and onboarding guides.", "icon": "document-text"},
    "sk_stakeholder": {"id": "sk_stakeholder", "name": "Stakeholder Presentations", "category": "Communication", "description": "Translating technical constraints into business and user outcomes.", "icon": "chatbubble-ellipses"},

    # Problem Solving
    "sk_dsa": {"id": "sk_dsa", "name": "Data Structures & Algorithms", "category": "Problem Solving", "description": "Asymptotic bounds (Big-O), trees, graphs, sorting, and recursion.", "icon": "git-branch"},
    "sk_system_design": {"id": "sk_system_design", "name": "System Architecture & Design", "category": "Problem Solving", "description": "Distributed systems, scalability, load balancing, and failure modes.", "icon": "git-merge"},
    "sk_debugging": {"id": "sk_debugging", "name": "Root-Cause Debugging & Observability", "category": "Problem Solving", "description": "Profiling, memory leak investigation, logs, and network inspections.", "icon": "bug"},

    # Tools
    "sk_git": {"id": "sk_git", "name": "Git & GitHub Version Control", "category": "Tools", "description": "Branching, PRs, merge conflict resolution, and code review.", "icon": "logo-github"},
    "sk_api_tools": {"id": "sk_api_tools", "name": "Postman & API Testing Tools", "category": "Tools", "description": "HTTP request validation, mock endpoints, and auth headers.", "icon": "send"},
    "sk_security_tools": {"id": "sk_security_tools", "name": "Security Auditing & Vulnerability Scanners", "category": "Tools", "description": "OWASP Top 10, penetration testing tools, and secret scanners.", "icon": "shield"},
}

# Database Table: roles
ROLES_DB: Dict[str, Dict[str, Any]] = {
    "role_frontend": {
        "id": "role_frontend",
        "name": "Frontend Developer",
        "slug": "frontend-developer",
        "category": "Engineering",
        "description": "Crafts intuitive, accessible, and high-performance user interfaces across web and mobile platforms.",
        "icon": "desktop-outline",
        "badge_color": "#3B82F6",
        "growth_outlook": "High Demand (+22% YoY)",
        "avg_salary": "₹6 - 18 LPA",
        "why_choose_this": [
            "Immediate visual feedback on everything you build",
            "Direct impact on user experience and satisfaction",
            "Thriving ecosystem with React, React Native, and TypeScript",
        ],
    },
    "role_backend": {
        "id": "role_backend",
        "name": "Backend Developer",
        "slug": "backend-developer",
        "category": "Engineering",
        "description": "Architects resilient server systems, scalable APIs, database schemas, and background computing workers.",
        "icon": "server-outline",
        "badge_color": "#10B981",
        "growth_outlook": "Very High Demand (+25% YoY)",
        "avg_salary": "₹7 - 22 LPA",
        "why_choose_this": [
            "Solve complex algorithmic and data consistency challenges",
            "Design the foundational infrastructure powering applications",
            "High leverage across databases, security, and cloud scalability",
        ],
    },
    "role_fullstack": {
        "id": "role_fullstack",
        "name": "Full Stack Developer",
        "slug": "full-stack-developer",
        "category": "Engineering",
        "description": "Bridges frontend client experiences with backend infrastructure, managing end-to-end feature delivery.",
        "icon": "layers-outline",
        "badge_color": "#8B5CF6",
        "growth_outlook": "Exceptional Demand (+28% YoY)",
        "avg_salary": "₹8 - 25 LPA",
        "why_choose_this": [
            "Complete autonomy to build products from idea to production",
            "Highest versatility and startup hiring preference",
            "Cross-disciplinary understanding of both user and system needs",
        ],
    },
    "role_data_analyst": {
        "id": "role_data_analyst",
        "name": "Data Analyst",
        "slug": "data-analyst",
        "category": "Data & Analytics",
        "description": "Transforms raw operational telemetry and metrics into actionable business decisions through statistical modeling and dashboards.",
        "icon": "pie-chart-outline",
        "badge_color": "#F59E0B",
        "growth_outlook": "Steady Growth (+20% YoY)",
        "avg_salary": "₹5 - 15 LPA",
        "why_choose_this": [
            "Guide strategic decisions with hard quantitative evidence",
            "Strong hybrid of coding (SQL/Python) and business communication",
            "Universal demand across finance, tech, healthcare, and retail",
        ],
    },
    "role_ml_engineer": {
        "id": "role_ml_engineer",
        "name": "Machine Learning Engineer",
        "slug": "machine-learning-engineer",
        "category": "Artificial Intelligence",
        "description": "Researches, trains, and deploys predictive models, LLMs, and intelligent automation pipelines into production systems.",
        "icon": "hardware-chip-outline",
        "badge_color": "#EC4899",
        "growth_outlook": "Explosive Growth (+38% YoY)",
        "avg_salary": "₹10 - 32 LPA",
        "why_choose_this": [
            "Work at the cutting edge of modern AI advancements",
            "Combine mathematical theory with high-performance engineering",
            "Create transformative automated features and generative AI",
        ],
    },
    "role_uiux_designer": {
        "id": "role_uiux_designer",
        "name": "UI/UX Designer",
        "slug": "ui-ux-designer",
        "category": "Design & Product",
        "description": "Champions the user journey through empathy, user research, wireframes, and design systems.",
        "icon": "color-palette-outline",
        "badge_color": "#06B6D4",
        "growth_outlook": "Strong Demand (+18% YoY)",
        "avg_salary": "₹6 - 16 LPA",
        "why_choose_this": [
            "Express creativity while solving human psychological problems",
            "Advocate for accessibility, simplicity, and delight",
            "Collaborate closely with product managers and engineers",
        ],
    },
    "role_cybersecurity": {
        "id": "role_cybersecurity",
        "name": "Cybersecurity Analyst",
        "slug": "cybersecurity-analyst",
        "category": "Security & Infrastructure",
        "description": "Defends networks, data pipelines, and application services from vulnerabilities, intrusions, and security exploits.",
        "icon": "shield-checkmark-outline",
        "badge_color": "#EF4444",
        "growth_outlook": "Critical Shortage (+32% YoY)",
        "avg_salary": "₹7 - 24 LPA",
        "why_choose_this": [
            "Play an indispensable defense role protecting student and company data",
            "High job security and mission-critical responsibility",
            "Dynamic adversarial cat-and-mouse puzzle solving",
        ],
    },
}

# Database Table: role_skills
# Maps role_id -> List of skill requirements with importance and expected proficiency
ROLE_SKILLS_DB: Dict[str, List[Dict[str, Any]]] = {
    "role_frontend": [
        {"skill_id": "sk_html_css", "importance": "Essential", "expected_proficiency": "Expert", "proficiency_level": 4},
        {"skill_id": "sk_js", "importance": "Essential", "expected_proficiency": "Advanced", "proficiency_level": 3},
        {"skill_id": "sk_ts", "importance": "Essential", "expected_proficiency": "Advanced", "proficiency_level": 3},
        {"skill_id": "sk_react", "importance": "Essential", "expected_proficiency": "Advanced", "proficiency_level": 3},
        {"skill_id": "sk_nextjs", "importance": "Core", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_figma", "importance": "Core", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_design_systems", "importance": "Core", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_git", "importance": "Essential", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_debugging", "importance": "Core", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_dsa", "importance": "Recommended", "expected_proficiency": "Beginner", "proficiency_level": 1},
        {"skill_id": "sk_tech_writing", "importance": "Recommended", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_cicd", "importance": "Bonus", "expected_proficiency": "Beginner", "proficiency_level": 1},
    ],
    "role_backend": [
        {"skill_id": "sk_py", "importance": "Essential", "expected_proficiency": "Advanced", "proficiency_level": 3},
        {"skill_id": "sk_sql", "importance": "Essential", "expected_proficiency": "Advanced", "proficiency_level": 3},
        {"skill_id": "sk_postgres", "importance": "Essential", "expected_proficiency": "Advanced", "proficiency_level": 3},
        {"skill_id": "sk_fastapi", "importance": "Essential", "expected_proficiency": "Advanced", "proficiency_level": 3},
        {"skill_id": "sk_dsa", "importance": "Essential", "expected_proficiency": "Advanced", "proficiency_level": 3},
        {"skill_id": "sk_system_design", "importance": "Core", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_redis", "importance": "Core", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_docker", "importance": "Core", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_git", "importance": "Essential", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_api_tools", "importance": "Core", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_aws", "importance": "Recommended", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_cicd", "importance": "Recommended", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_tech_writing", "importance": "Recommended", "expected_proficiency": "Intermediate", "proficiency_level": 2},
    ],
    "role_fullstack": [
        {"skill_id": "sk_js", "importance": "Essential", "expected_proficiency": "Advanced", "proficiency_level": 3},
        {"skill_id": "sk_ts", "importance": "Essential", "expected_proficiency": "Advanced", "proficiency_level": 3},
        {"skill_id": "sk_react", "importance": "Essential", "expected_proficiency": "Advanced", "proficiency_level": 3},
        {"skill_id": "sk_nodejs", "importance": "Essential", "expected_proficiency": "Advanced", "proficiency_level": 3},
        {"skill_id": "sk_sql", "importance": "Essential", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_postgres", "importance": "Essential", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_nextjs", "importance": "Core", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_git", "importance": "Essential", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_docker", "importance": "Core", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_system_design", "importance": "Core", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_figma", "importance": "Recommended", "expected_proficiency": "Beginner", "proficiency_level": 1},
        {"skill_id": "sk_aws", "importance": "Recommended", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_stakeholder", "importance": "Recommended", "expected_proficiency": "Intermediate", "proficiency_level": 2},
    ],
    "role_data_analyst": [
        {"skill_id": "sk_sql", "importance": "Essential", "expected_proficiency": "Expert", "proficiency_level": 4},
        {"skill_id": "sk_py", "importance": "Essential", "expected_proficiency": "Advanced", "proficiency_level": 3},
        {"skill_id": "sk_ml_basics", "importance": "Core", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_stakeholder", "importance": "Essential", "expected_proficiency": "Advanced", "proficiency_level": 3},
        {"skill_id": "sk_postgres", "importance": "Core", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_git", "importance": "Core", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_tech_writing", "importance": "Essential", "expected_proficiency": "Advanced", "proficiency_level": 3},
        {"skill_id": "sk_dsa", "importance": "Recommended", "expected_proficiency": "Beginner", "proficiency_level": 1},
    ],
    "role_ml_engineer": [
        {"skill_id": "sk_py", "importance": "Essential", "expected_proficiency": "Expert", "proficiency_level": 4},
        {"skill_id": "sk_ml_basics", "importance": "Essential", "expected_proficiency": "Advanced", "proficiency_level": 3},
        {"skill_id": "sk_deep_learning", "importance": "Essential", "expected_proficiency": "Advanced", "proficiency_level": 3},
        {"skill_id": "sk_rag_embeddings", "importance": "Core", "expected_proficiency": "Advanced", "proficiency_level": 3},
        {"skill_id": "sk_sql", "importance": "Core", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_docker", "importance": "Core", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_fastapi", "importance": "Core", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_dsa", "importance": "Essential", "expected_proficiency": "Advanced", "proficiency_level": 3},
        {"skill_id": "sk_system_design", "importance": "Core", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_git", "importance": "Essential", "expected_proficiency": "Intermediate", "proficiency_level": 2},
    ],
    "role_uiux_designer": [
        {"skill_id": "sk_figma", "importance": "Essential", "expected_proficiency": "Expert", "proficiency_level": 4},
        {"skill_id": "sk_user_research", "importance": "Essential", "expected_proficiency": "Advanced", "proficiency_level": 3},
        {"skill_id": "sk_design_systems", "importance": "Essential", "expected_proficiency": "Advanced", "proficiency_level": 3},
        {"skill_id": "sk_stakeholder", "importance": "Essential", "expected_proficiency": "Advanced", "proficiency_level": 3},
        {"skill_id": "sk_html_css", "importance": "Core", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_tech_writing", "importance": "Core", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_debugging", "importance": "Recommended", "expected_proficiency": "Beginner", "proficiency_level": 1},
    ],
    "role_cybersecurity": [
        {"skill_id": "sk_security_tools", "importance": "Essential", "expected_proficiency": "Advanced", "proficiency_level": 3},
        {"skill_id": "sk_bash", "importance": "Essential", "expected_proficiency": "Advanced", "proficiency_level": 3},
        {"skill_id": "sk_py", "importance": "Core", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_sql", "importance": "Core", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_system_design", "importance": "Core", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_docker", "importance": "Core", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_tech_writing", "importance": "Essential", "expected_proficiency": "Advanced", "proficiency_level": 3},
        {"skill_id": "sk_git", "importance": "Core", "expected_proficiency": "Intermediate", "proficiency_level": 2},
        {"skill_id": "sk_debugging", "importance": "Essential", "expected_proficiency": "Advanced", "proficiency_level": 3},
    ],
}


class CareerService:
    """
    Service layer providing career paths, required competency mappings, and filtering.
    """

    @classmethod
    def list_roles(cls, search: Optional[str] = None, category: Optional[str] = None) -> CareerListResponse:
        results: List[CareerRoleSummary] = []

        for role_id, role in ROLES_DB.items():
            # Filter by search
            if search:
                s = search.lower()
                if s not in role["name"].lower() and s not in role["description"].lower():
                    continue

            # Filter by category
            if category and category.lower() != "all" and role["category"].lower() != category.lower():
                continue

            role_skills = ROLE_SKILLS_DB.get(role_id, [])
            essential_count = sum(1 for rs in role_skills if rs["importance"] == "Essential")

            results.append(
                CareerRoleSummary(
                    id=role["id"],
                    name=role["name"],
                    slug=role["slug"],
                    category=role["category"],
                    description=role["description"],
                    icon=role["icon"],
                    badge_color=role["badge_color"],
                    total_skills=len(role_skills),
                    essential_count=essential_count,
                    growth_outlook=role["growth_outlook"],
                    avg_salary=role["avg_salary"],
                )
            )

        categories = sorted(list(set(r["category"] for r in ROLES_DB.values())))
        return CareerListResponse(roles=results, categories=categories)

    @classmethod
    def get_role_detail(cls, role_id: str) -> Optional[CareerRoleDetail]:
        role = ROLES_DB.get(role_id)
        if not role:
            # Try searching by slug
            for r in ROLES_DB.values():
                if r["slug"] == role_id:
                    role = r
                    role_id = r["id"]
                    break

        if not role:
            return None

        role_skills_raw = ROLE_SKILLS_DB.get(role_id, [])
        skills_enriched: List[RoleSkillInfo] = []
        categories_set = set()

        for rs in role_skills_raw:
            skill = SKILLS_DB.get(rs["skill_id"])
            if not skill:
                continue

            categories_set.add(skill["category"])
            skills_enriched.append(
                RoleSkillInfo(
                    skill_id=skill["id"],
                    skill_name=skill["name"],
                    category=skill["category"],
                    importance=rs["importance"],
                    expected_proficiency=rs["expected_proficiency"],
                    proficiency_level=rs["proficiency_level"],
                    description=skill["description"],
                )
            )

        # Sort skills by importance weight
        importance_rank = {"Essential": 1, "Core": 2, "Recommended": 3, "Bonus": 4}
        skills_enriched.sort(key=lambda x: (importance_rank.get(x.importance, 5), x.skill_name))

        return CareerRoleDetail(
            id=role["id"],
            name=role["name"],
            slug=role["slug"],
            category=role["category"],
            description=role["description"],
            icon=role["icon"],
            badge_color=role["badge_color"],
            growth_outlook=role["growth_outlook"],
            avg_salary=role["avg_salary"],
            why_choose_this=role.get("why_choose_this", []),
            skills=skills_enriched,
            categories_covered=sorted(list(categories_set)),
        )

    @classmethod
    def list_categories(cls) -> List[SkillCategoryInfo]:
        counts: Dict[str, int] = {}
        for skill in SKILLS_DB.values():
            cat = skill["category"]
            counts[cat] = counts.get(cat, 0) + 1

        icons = {
            "Programming": "code-slash",
            "Frameworks": "layers",
            "Databases": "server",
            "Cloud": "cloud",
            "AI/ML": "hardware-chip",
            "Design": "color-palette",
            "Communication": "chatbubble-ellipses",
            "Problem Solving": "git-branch",
            "Tools": "build",
        }

        return [
            SkillCategoryInfo(
                name=cat,
                count=counts.get(cat, 0),
                icon=icons.get(cat, "bulb"),
            )
            for cat in SKILL_CATEGORIES
        ]
