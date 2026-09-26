"""
Unit & Integration Tests for Skill Assessment, Gap Analysis, and Personalized Roadmap (Langnode Half 2 - Phase 3 / ED-02).
"""

import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.schemas import (
    SkillAssessmentSubmission,
    UserSkillRating,
    RoadmapItemUpdateRequest,
)
from backend.roadmap_service import RoadmapService

class TestRoadmapService(unittest.TestCase):
    def setUp(self):
        self.user_id = "test_student_123"
        self.role_id = "role_frontend"

    def test_assessment_and_gap_analysis(self):
        # Submit diagnostic rating
        ratings = [
            UserSkillRating(skill_id="sk_html_css", skill_name="HTML5 & Modern CSS", level="Intermediate", level_score=3),
            UserSkillRating(skill_id="sk_js", skill_name="JavaScript (ES6+)", level="Basic", level_score=2),
            UserSkillRating(skill_id="sk_react", skill_name="React & React Native", level="Beginner", level_score=1),
            UserSkillRating(skill_id="sk_ts", skill_name="TypeScript", level="I Don't Know", level_score=0),
        ]
        sub = SkillAssessmentSubmission(user_id=self.user_id, role_id=self.role_id, ratings=ratings)
        res = RoadmapService.submit_assessment(sub)

        self.assertEqual(res.role_id, "role_frontend")
        self.assertTrue(len(res.priority_areas) > 0)
        self.assertTrue(0 <= res.readiness_percentage <= 100)

        # Check gap categories
        # HTML/CSS is Intermediate (3) vs Advanced (3 or 4)
        total_items = (
            len(res.strong_skills)
            + len(res.developing_skills)
            + len(res.improvement_needed_skills)
            + len(res.missing_skills)
        )
        self.assertEqual(total_items, res.total_skills)

    def test_personalized_roadmap_generation(self):
        roadmap = RoadmapService.generate_roadmap(self.user_id, self.role_id)
        self.assertEqual(roadmap.role_id, "role_frontend")
        self.assertEqual(len(roadmap.phases), 5)
        self.assertTrue(roadmap.total_topics > 0)

        # Validate that each item has all required fields
        for p in roadmap.phases:
            for item in p.items:
                self.assertTrue(bool(item.topic))
                self.assertTrue(bool(item.learning_objective))
                self.assertTrue(bool(item.recommended_activity))
                self.assertTrue(bool(item.current_level))
                self.assertTrue(bool(item.target_level))
                self.assertIn(item.status, ["not_started", "in_progress", "completed"])

        # Validate recommended next step
        self.assertIsNotNone(roadmap.recommended_next_step)

    def test_item_status_update_and_progress_recalculation(self):
        roadmap = RoadmapService.generate_roadmap(self.user_id, self.role_id)
        first_item = roadmap.phases[0].items[0]
        initial_comp = roadmap.completed_topics

        # Mark first item as completed
        updated = RoadmapService.update_item_status(
            user_id=self.user_id,
            role_id=self.role_id,
            item_id=first_item.id,
            status="completed",
        )
        self.assertEqual(updated.completed_topics, initial_comp + 1)
        self.assertTrue(updated.completion_percentage >= roadmap.completion_percentage)

        # Verify progress summary
        progress = RoadmapService.get_student_progress(self.user_id)
        self.assertEqual(progress.user_id, self.user_id)
        self.assertTrue(progress.completed_topics_count >= 1)
        self.assertTrue(progress.learning_sessions_count >= 1)


class TestRoadmapAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_api_submit_assessment(self):
        payload = {
            "user_id": "api_student",
            "role_id": "role_backend",
            "ratings": [
                {"skill_id": "sk_py", "skill_name": "Python", "level": "Basic", "level_score": 2},
                {"skill_id": "sk_fastapi", "skill_name": "FastAPI", "level": "Beginner", "level_score": 1},
            ],
        }
        res = self.client.post("/api/assessment/submit", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("priority_areas", data)
        self.assertIn("readiness_percentage", data)

    def test_api_get_gap_analysis(self):
        res = self.client.get("/api/assessment/api_student/gap/role_backend")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["role_id"], "role_backend")

    def test_api_get_roadmap(self):
        res = self.client.get("/api/roadmap/api_student/role_backend")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data["phases"]), 5)
        self.assertIn("recommended_next_step", data)

    def test_api_update_item_status(self):
        # Fetch roadmap to find item ID
        res = self.client.get("/api/roadmap/api_student/role_backend")
        data = res.json()
        item_id = data["phases"][0]["items"][0]["id"]

        update_payload = {
            "user_id": "api_student",
            "role_id": "role_backend",
            "item_id": item_id,
            "status": "completed",
        }
        res_update = self.client.post("/api/roadmap/item/update", json=update_payload)
        self.assertEqual(res_update.status_code, 200)
        data_update = res_update.json()
        self.assertTrue(data_update["completed_topics"] >= 1)

    def test_api_get_progress(self):
        res = self.client.get("/api/progress/api_student")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("completion_percentage", data)
        self.assertIn("learning_sessions_count", data)

if __name__ == "__main__":
    unittest.main()
