"""
LanguageDetectionService and TranslationService
Addresses ED-01: Multilingual understanding, mixed-language (code-switching) detection,
and technical terminology preservation across English, Tamil, Hindi, Telugu, Malayalam, Kannada.
"""

import re
from typing import Dict, List, Optional, Tuple, Any

# Unicode script ranges for supported regional languages
SCRIPT_RANGES = {
    "ta": (0x0B80, 0x0BFF),  # Tamil
    "hi": (0x0900, 0x097F),  # Devanagari (Hindi)
    "te": (0x0C00, 0x0C7F),  # Telugu
    "ml": (0x0D00, 0x0D7F),  # Malayalam
    "kn": (0x0C80, 0x0CFF),  # Kannada
}

# Transliterated / romanized marker patterns for mixed languages (code-switching)
MIXED_LANGUAGE_PATTERNS = {
    "ta": {
        "name": "Tamil",
        "markers": [
            r"\bepdi\b", r"\beppadi\b", r"\bwork aaguthu\b", r"\baaguthu\b", r"\baagum\b",
            r"\benna\b", r"\bendral\b", r"\bsolunga\b", r"\bsollunga\b", r"\btheriyuma\b",
            r"\bpuriyala\b", r"\bpuriyala\b", r"\bvenum\b", r"\bpanna\b", r"\bpannum\b",
            r"\birukku\b", r"\bpaththi\b", r"\bvishayam\b", r"\bkonjam\b", r"\bvilakku\b",
            r"\bvilakkavum\b", r"\bezhuthu\b", r"\bpadikkanum\b"
        ],
        "affixes": [r"aaguthu$", r"pannunga$", r"la$", r"nga$"]
    },
    "hi": {
        "name": "Hindi",
        "markers": [
            r"\bkaise\b", r"\bkaam karta\b", r"\bkarta hai\b", r"\bkya hota\b", r"\bkya hai\b",
            r"\bbatao\b", r"\bbataiye\b", r"\bsamjhao\b", r"\bsamjhaiye\b", r"\bkyu\b",
            r"\bkyun\b", r"\bchahiye\b", r"\bhoga\b", r"\bkarte hain\b", r"\bke baare me\b",
            r"\bkaro\b", r"\bkarna\b", r"\bmujhe\b", r"\bsamajh nahi\b", r"\baasan\b"
        ],
        "affixes": [r"karta$", r"raha$", r"hoga$", r"hai$"]
    },
    "te": {
        "name": "Telugu",
        "markers": [
            r"\bela\b", r"\bwork avtundi\b", r"\bavtundi\b", r"\bpanichey\b", r"\bpani chestundi\b",
            r"\bante enti\b", r"\benti\b", r"\bcheppandi\b", r"\bcheppu\b", r"\bvivarinchandi\b",
            r"\bthelusukovali\b", r"\belaaga\b", r"\bcheyali\b", r"\bundi\b", r"\bgurinchi\b",
            r"\bkonchem\b", r"\bsulabhamga\b", r"\bardham\b"
        ],
        "affixes": [r"avtundi$", r"chestundi$", r"andi$", r"lo$"]
    },
    "ml": {
        "name": "Malayalam",
        "markers": [
            r"\bengane\b", r"\benganeya\b", r"\bwork aakunnath\b", r"\baakunnath\b", r"\benthannu\b",
            r"\benthanu\b", r"\bparayumo\b", r"\bparanju\b", r"\bvisadheekarikku\b", r"\bengane aanu\b",
            r"\bariyaan\b", r"\bpattumo\b", r"\bcheyunnath\b", r"\bkuri\b", r"\bariyilla\b",
            r"\blalithamayi\b", r"\bithinte\b", r"\banu\b"
        ],
        "affixes": [r"aakunnath$", r"aanu$", r"aano$", r"il$"]
    },
    "kn": {
        "name": "Kannada",
        "markers": [
            r"\bhege\b", r"\bkelsa madatte\b", r"\bmadatte\b", r"\bwork aagatte\b", r"\bandre yenu\b",
            r"\byenu\b", r"\bheli\b", r"\bhelikodi\b", r"\bvivarisi\b", r"\bgotthilla\b",
            r"\bhege madodu\b", r"\bmaadodu\b", r"\baguthe\b", r"\bbagge\b", r"\bswalpa\b",
            r"\bsaralavagi\b", r"\barthe\b"
        ],
        "affixes": [r"madatte$", r"aagatte$", r"alli$", r"anthe$"]
    }
}

# Technical keywords known to appear in educational queries
COMMON_TECH_CONCEPTS = [
    "photosynthesis", "recursion", "binary search", "binary tree", "binary search tree",
    "linked list", "polymorphism", "inheritance", "encapsulation", "abstraction",
    "dynamic programming", "bubble sort", "quick sort", "merge sort", "depth first search",
    "breadth first search", "graph", "hash table", "hashmap", "queue", "stack",
    "big o", "time complexity", "space complexity", "call stack", "memory allocation",
    "pointers", "garbage collection", "neural network", "machine learning", "deep learning",
    "backpropagation", "gradient descent", "transformer", "attention mechanism",
    "operating system", "process", "thread", "concurrency", "deadlock", "mutex",
    "database", "sql", "nosql", "indexing", "normalization", "acid properties",
    "http", "tcp", "udp", "dns", "api", "rest api", "websocket", "docker", "kubernetes",
    "mitochondria", "dna", "rna", "cellular respiration", "osmosis", "mitosis", "meiosis",
    "newtons laws", "gravity", "thermodynamics", "quantum physics", "electromagnetism"
]

# High frequency technical vocabulary translation dictionary preserving English keywords
TECHNICAL_TERMINOLOGY_PRESERVATION: Dict[str, Dict[str, str]] = {
    "photosynthesis": {
        "ta": "ஒளிச்சேர்க்கை (Photosynthesis)",
        "hi": "प्रकाश संश्लेषण (Photosynthesis)",
        "te": "కిరణజన్య సంయోగక్రియ (Photosynthesis)",
        "ml": "പ്രകാശസംശ്ലേഷണം (Photosynthesis)",
        "kn": "ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ (Photosynthesis)",
    },
    "recursion": {
        "ta": "தன்னழைப்பு (Recursion)",
        "hi": "रिकर्शन (Recursion)",
        "te": "రికర్శన్ (Recursion)",
        "ml": "റിക്കർഷൻ (Recursion)",
        "kn": "ರಿಕರ್ಶನ್ (Recursion)",
    },
    "binary search": {
        "ta": "இருகூறு தேடல் (Binary Search)",
        "hi": "बाइनरी सर्च (Binary Search)",
        "te": "బైనరీ సెర్చ్ (Binary Search)",
        "ml": "ബൈനറി സെർച്ച് (Binary Search)",
        "kn": "ಬೈನರಿ ಸರ್ಚ್ (Binary Search)",
    },
    "binary search tree": {
        "ta": "இருகூறு தேடல் மரம் (Binary Search Tree)",
        "hi": "बाइनरी सर्च ट्री (Binary Search Tree)",
        "te": "బైనరీ సెర్చ్ ట్రీ (Binary Search Tree)",
        "ml": "ബൈനറി സെർച്ച് ട്രീ (Binary Search Tree)",
        "kn": "ಬೈನರಿ ಸರ್ಚ್ ಟ್ರೀ (Binary Search Tree)",
    },
    "polymorphism": {
        "ta": "பன்முகத்தன்மை (Polymorphism)",
        "hi": "बहुरूपता (Polymorphism)",
        "te": "పాలిమార్ఫిజం (Polymorphism)",
        "ml": "പോളിമോർഫിസം (Polymorphism)",
        "kn": "ಪಾಲಿಮಾರ್ಫಿಸಂ (Polymorphism)",
    },
    "inheritance": {
        "ta": "மரபுரிமை (Inheritance)",
        "hi": "वंशानुक्रम (Inheritance)",
        "te": "వారసత్వం (Inheritance)",
        "ml": "ഇൻഹെറിറ്റൻസ് (Inheritance)",
        "kn": "ಇನ್ಹೆರಿಟೆನ್ಸ್ (Inheritance)",
    },
    "encapsulation": {
        "ta": "பொதியாக்கம் (Encapsulation)",
        "hi": "संपुटीकरण (Encapsulation)",
        "te": "ఎన్‌క్యాప్సులేషన్ (Encapsulation)",
        "ml": "എൻക്യാപ്സുലേഷൻ (Encapsulation)",
        "kn": "ಎನ್‌ಕ್ಯಾಪ್ಸುಲೇಶನ್ (Encapsulation)",
    },
    "stack": {
        "ta": "அடுக்கு (Stack)",
        "hi": "स्टैक (Stack)",
        "te": "స్టాక్ (Stack)",
        "ml": "സ്റ്റാക്ക് (Stack)",
        "kn": "ಸ್ಟ್ಯಾಕ್ (Stack)",
    },
    "queue": {
        "ta": "வரிசை (Queue)",
        "hi": "पंक्ति (Queue)",
        "te": "క్యూ (Queue)",
        "ml": "ക്യൂ (Queue)",
        "kn": "ಕ್ಯೂ (Queue)",
    },
    "time complexity": {
        "ta": "நேரச் சிக்கல் (Time Complexity)",
        "hi": "समय जटिलता (Time Complexity)",
        "te": "సమయ సంక్లిష్టత (Time Complexity)",
        "ml": "സമയ സങ്കീർണ്ണത (Time Complexity)",
        "kn": "ಸಮಯ ಸಂಕೀರ್ಣತೆ (Time Complexity)",
    },
    "algorithm": {
        "ta": "படிமுறைத் தீர்வு (Algorithm)",
        "hi": "कलन विधि (Algorithm)",
        "te": "అల్గోరిథం (Algorithm)",
        "ml": "അൽഗോരിതം (Algorithm)",
        "kn": "ಅಲ್ಗಾರಿದಮ್ (Algorithm)",
    }
}


class LanguageDetectionService:
    """
    Intelligent language detection service with native script recognition
    and mixed-language (code-switching) intent extraction.
    """

    @classmethod
    def detect(cls, text: str) -> Dict[str, Any]:
        """
        Detects primary language, mixed-language presence, script, confidence,
        and extracts educational technical topic from the query.
        """
        if not text or not text.strip():
            return {
                "language": "en",
                "confidence": 1.0,
                "is_mixed": False,
                "script": "Latin",
                "detected_topic": "",
                "intent": "general",
            }

        cleaned = text.strip()
        lower_cleaned = cleaned.lower()

        # Step 1: Check native unicode script character frequencies
        script_counts = {lang: 0 for lang in SCRIPT_RANGES}
        total_chars = len(cleaned)

        for char in cleaned:
            code_point = ord(char)
            for lang, (start, end) in SCRIPT_RANGES.items():
                if start <= code_point <= end:
                    script_counts[lang] += 1

        # Check if native script dominates (>15% of non-whitespace characters)
        for lang, count in script_counts.items():
            if count >= max(2, int(total_chars * 0.15)):
                topic = cls.extract_topic(cleaned)
                return {
                    "language": lang,
                    "confidence": min(0.99, round(count / max(1, total_chars) + 0.4, 2)),
                    "is_mixed": any(ord(c) < 128 and c.isalpha() for c in cleaned),
                    "script": cls.get_script_name(lang),
                    "detected_topic": topic,
                    "intent": cls.infer_intent(cleaned),
                }

        # Step 2: Check for Mixed-Language / Transliterated Code-Switching (Tanglish, Hinglish, etc.)
        mixed_scores: Dict[str, int] = {lang: 0 for lang in MIXED_LANGUAGE_PATTERNS}

        for lang, config in MIXED_LANGUAGE_PATTERNS.items():
            for marker in config["markers"]:
                if re.search(marker, lower_cleaned, re.IGNORECASE):
                    mixed_scores[lang] += 3
            for affix in config["affixes"]:
                if re.search(affix, lower_cleaned, re.IGNORECASE):
                    mixed_scores[lang] += 2

        best_mixed_lang = max(mixed_scores.keys(), key=lambda k: mixed_scores[k])
        if mixed_scores[best_mixed_lang] >= 3:
            topic = cls.extract_topic(cleaned)
            return {
                "language": best_mixed_lang,
                "confidence": min(0.95, 0.65 + (mixed_scores[best_mixed_lang] * 0.05)),
                "is_mixed": True,
                "script": "Latin (Code-Switching)",
                "detected_topic": topic,
                "intent": cls.infer_intent(cleaned),
                "original_framing": MIXED_LANGUAGE_PATTERNS[best_mixed_lang]["name"]
            }

        # Step 3: Default to English if no regional markers found
        topic = cls.extract_topic(cleaned)
        return {
            "language": "en",
            "confidence": 0.90,
            "is_mixed": False,
            "script": "Latin",
            "detected_topic": topic,
            "intent": cls.infer_intent(cleaned),
        }

    @staticmethod
    def extract_topic(text: str) -> str:
        """
        Extracts the primary educational noun/concept from mixed or English sentences.
        Example: 'Photosynthesis epdi work aaguthu?' -> 'Photosynthesis'
        """
        lower = text.lower()
        # Direct dictionary match
        for concept in sorted(COMMON_TECH_CONCEPTS, key=len, reverse=True):
            if concept in lower:
                # Return proper capitalized version
                return concept.title()

        # Remove known marker words and query phrases
        stripped = text
        for config in MIXED_LANGUAGE_PATTERNS.values():
            for m in config["markers"]:
                stripped = re.sub(m, " ", stripped, flags=re.IGNORECASE)

        # Remove question punctuation and query words
        stripped = re.sub(r"[?!.,]", " ", stripped)
        stripped = re.sub(r"\b(how|what|explain|why|does|work|tell|me|about|in|simple|terms)\b", " ", stripped, flags=re.IGNORECASE)
        words = [w.strip() for w in stripped.split() if len(w.strip()) > 2]

        if words:
            # First remaining significant word is likely the technical subject
            return words[0].title()
        return text[:30].strip()

    @staticmethod
    def infer_intent(text: str) -> str:
        lower = text.lower()
        if any(w in lower for w in ["epdi", "kaise", "ela", "engane", "hege", "how", "work"]):
            return "mechanism"
        if any(w in lower for w in ["enna", "kya", "enti", "enthanu", "yenu", "what is"]):
            return "definition"
        if any(w in lower for w in ["example", "udharanam", "misal", "udaharan"]):
            return "example"
        if any(w in lower for w in ["analogy", "metaphor", "mathiri"]):
            return "analogy"
        return "explanation"

    @staticmethod
    def get_script_name(lang: str) -> str:
        names = {
            "en": "Latin",
            "ta": "Tamil",
            "hi": "Devanagari",
            "te": "Telugu",
            "ml": "Malayalam",
            "kn": "Kannada"
        }
        return names.get(lang, "Unknown")


class TranslationService:
    """
    Translates instructional queries and explanations between English and regional languages
    while preserving technical terminology in Latin script alongside native terms.
    """

    @classmethod
    def preserve_terminology(cls, text: str, target_lang: str) -> str:
        """
        Ensures technical terminology is preserved in English or dual-script form
        so learners don't lose the foundational keyword when reading regional explanations.
        Uses single-pass replacement to avoid double-replacing substrings.
        """
        if target_lang == "en":
            return text

        # Sort terms by length descending
        sorted_terms = sorted(TECHNICAL_TERMINOLOGY_PRESERVATION.keys(), key=len, reverse=True)
        pattern = re.compile(
            r"\b(" + "|".join(re.escape(term) for term in sorted_terms) + r")\b",
            re.IGNORECASE
        )

        def replace_match(match: re.Match) -> str:
            matched_text = match.group(0).lower()
            translations = TECHNICAL_TERMINOLOGY_PRESERVATION.get(matched_text, {})
            return translations.get(target_lang, match.group(0))

        return pattern.sub(replace_match, text)

    @classmethod
    def translate(cls, text: str, source_lang: str, target_lang: str) -> str:
        """
        Translates text with technical keyword preservation.
        """
        if source_lang == target_lang:
            return text

        # Map common educational phrases
        dictionary: Dict[Tuple[str, str], Dict[str, str]] = {
            ("en", "ta"): {
                "how does it work?": "இது எவ்வாறு இயங்குகிறது?",
                "explain simply": "எளிமையாக விளக்குக",
                "explain with example": "உதாரணத்துடன் விளக்குக",
                "explain with analogy": "உவமையுடன் விளக்குக",
                "key concepts": "முக்கிய கருத்துக்கள்",
                "core flow": "அடிப்படை ஓட்டம்",
            },
            ("en", "hi"): {
                "how does it work?": "यह कैसे काम करता है?",
                "explain simply": "सरल शब्दों में समझाएं",
                "explain with example": "उदाहरण के साथ समझाएं",
                "explain with analogy": "उपमा के साथ समझाएं",
                "key concepts": "प्रमुख अवधारणाएं",
                "core flow": "मूल प्रवाह",
            },
            ("en", "te"): {
                "how does it work?": "ఇది ఎలా పనిచేస్తుంది?",
                "explain simply": "సులభంగా వివరించండి",
                "explain with example": "ఉదాహరణతో వివరించండి",
                "explain with analogy": "పోలికతో వివరించండి",
                "key concepts": "కీలక అంశాలు",
                "core flow": "పనితీరు",
            },
            ("en", "ml"): {
                "how does it work?": "ഇത് എങ്ങനെ പ്രവർത്തിക്കുന്നു?",
                "explain simply": "ലളിതമായി വിശദീകരിക്കുക",
                "explain with example": "ഉദാഹരണസഹിതം വിശദീകരിക്കുക",
                "explain with analogy": "ഉപമയിലൂടെ വിശദീകരിക്കുക",
                "key concepts": "പ്രധാന ആശയങ്ങൾ",
                "core flow": "പ്രക്രിയ",
            },
            ("en", "kn"): {
                "how does it work?": "ಇದು ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ?",
                "explain simply": "ಸರಳವಾಗಿ ವಿವರಿಸಿ",
                "explain with example": "ಉದಾಹರಣೆಯೊಂದಿಗೆ ವಿವರಿಸಿ",
                "explain with analogy": "ಉಪಮೆಯೊಂದಿಗೆ ವಿವರಿಸಿ",
                "key concepts": "ಪ್ರಮುಖ ಪರಿಕಲ್ಪನೆಗಳು",
                "core flow": "ಮೂಲ ಹರಿವು",
            }
        }

        # Apply dictionary replacements
        mapping = dictionary.get((source_lang, target_lang), {})
        lowered = text.lower()
        for src, dest in mapping.items():
            if src in lowered:
                text = re.sub(re.escape(src), dest, text, flags=re.IGNORECASE)

        # Always preserve technical terminology
        return cls.preserve_terminology(text, target_lang)
