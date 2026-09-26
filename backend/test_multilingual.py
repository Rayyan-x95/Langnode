"""
Test suite for Langnode Multilingual Services & AI Tutor (Phase 2).
Tests:
- Automatic language detection across 6 languages (en, ta, hi, te, ml, kn)
- Mixed-language (code-switching) detection: "Photosynthesis epdi work aaguthu?", Hinglish, etc.
- Technical terminology preservation
- Explain Simply, Explain with Example, Explain with Analogy
- Translation service
"""

import sys
import asyncio

# Ensure Windows terminal outputs UTF-8 without cp1252 charmap errors
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from backend.schemas import ChatRequest, TranslationRequest
from backend.language_service import LanguageDetectionService, TranslationService
from backend.tutor_service import AITutorService

async def run_multilingual_tests():
    print("=" * 60)
    print("LANGNODE MULTILINGUAL & MIXED-LANGUAGE VERIFICATION")
    print("=" * 60)

    # 1. Test Language Detection & Mixed Language Intent
    queries = [
        # Mixed Tamil-English (Tanglish) - from User Prompt!
        ("Photosynthesis epdi work aaguthu?", "ta", True, "Photosynthesis"),
        # Native Tamil
        ("ஒளிச்சேர்க்கை எவ்வாறு செயல்படுகிறது?", "ta", False, ""),
        # Mixed Hindi-English (Hinglish)
        ("Recursion kaise kaam karta hai?", "hi", True, "Recursion"),
        # Native Hindi
        ("रिकर्शन को एक आसान उदाहरण से समझाएं", "hi", False, ""),
        # Mixed Telugu-English (Tenglish)
        ("Binary Search Tree ela pani chestundi?", "te", True, "Binary Search Tree"),
        # Mixed Malayalam-English (Manglish)
        ("Photosynthesis enganeya work aakunnath?", "ml", True, "Photosynthesis"),
        # Mixed Kannada-English (Kanglish)
        ("Photosynthesis hege kelsa madatte?", "kn", True, "Photosynthesis"),
        # Pure English
        ("Explain Dynamic Programming and memoization", "en", False, "Dynamic Programming"),
    ]

    print("\n--- 1. Testing Automatic Language Detection & Mixed Language Understanding ---")
    all_detect_passed = True
    for text, exp_lang, exp_mixed, exp_topic in queries:
        res = LanguageDetectionService.detect(text)
        passed_lang = res["language"] == exp_lang
        passed_mixed = res["is_mixed"] == exp_mixed if exp_mixed else True
        if exp_topic:
            passed_topic = exp_topic.lower() in res["detected_topic"].lower()
        else:
            passed_topic = True

        status = "PASSED" if (passed_lang and passed_mixed and passed_topic) else "FAILED"
        if status == "FAILED":
            all_detect_passed = False
        print(f"[{status}] Query: '{text}'")
        print(f"         Detected: lang={res['language']}, mixed={res['is_mixed']}, topic='{res['detected_topic']}', intent='{res['intent']}'")

    assert all_detect_passed, "Some language detection tests failed!"
    print("\n>>> All Language & Mixed Query Detection tests PASSED!")

    # 2. Test Technical Terminology Preservation
    print("\n--- 2. Testing Technical Terminology Preservation ---")
    pres_ta = TranslationService.preserve_terminology("Photosynthesis is a process where plants make food.", "ta")
    print(f"Tamil Preserved: {pres_ta}")
    assert "Photosynthesis" in pres_ta and "ஒளிச்சேர்க்கை" in pres_ta, "Tamil terminology preservation failed!"

    pres_hi = TranslationService.preserve_terminology("Recursion is used in divide and conquer algorithms.", "hi")
    print(f"Hindi Preserved: {pres_hi}")
    assert "Recursion" in pres_hi and "रिकर्शन" in pres_hi, "Hindi terminology preservation failed!"

    pres_te = TranslationService.preserve_terminology("Binary Search Tree provides O(log n) lookup.", "te")
    print(f"Telugu Preserved: {pres_te}")
    assert "Binary Search Tree" in pres_te and "బైనరీ సెర్చ్ ట్రీ" in pres_te, "Telugu terminology preservation failed!"

    print(">>> Technical Terminology Preservation tests PASSED!")

    # 3. Test 3 Quick Explanation Modes: Simply, Example, Analogy
    print("\n--- 3. Testing Explanation Modes (Simply, Example, Analogy) ---")
    modes = ["simply", "example", "analogy", "standard"]
    for mode in modes:
        req = ChatRequest(
            message="Photosynthesis epdi work aaguthu?",
            language="auto",
            explanation_level="Beginner",
            explanation_mode=mode,
        )
        resp = await AITutorService.generate_explanation(req)
        print(f"\n[MODE: {mode.upper()}] (Lang: {resp.language}, Topic: {resp.detected_topic}, Mixed: {resp.is_mixed})")
        print(f"Snippet:\n{resp.response[:160]}...")
        assert resp.language == "ta", f"Expected 'ta' for Tanglish query, got {resp.language}"
        assert resp.is_mixed is True, "Expected is_mixed=True"
        assert len(resp.response) > 50, "Response is too short!"

    print("\n>>> Explanation Modes tests PASSED!")

    # 4. Test All 6 Languages via ChatRequest
    print("\n--- 4. Testing End-to-End Chat across all 6 Languages ---")
    languages = ["en", "ta", "hi", "te", "ml", "kn"]
    for l in languages:
        req = ChatRequest(
            message="Explain Recursion in computer science",
            language=l,
            explanation_level="Beginner",
            explanation_mode="standard"
        )
        resp = await AITutorService.generate_explanation(req)
        assert resp.language == l, f"Failed for language {l}"
        print(f"[OK] Language '{l}' generated response with {len(resp.response)} chars and concepts: {resp.key_concepts}")

    print("\n" + "=" * 60)
    print("ALL MULTILINGUAL BACKEND TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_multilingual_tests())
