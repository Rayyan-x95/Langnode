"""
Unit tests for CareerService and Career Path endpoints (Half 2 - Phase 1 / ED-02).
"""

import sys
import unittest
from backend.career_service import CareerService, SKILL_CATEGORIES, ROLES_DB, SKILLS_DB, ROLE_SKILLS_DB

class TestCareerService(unittest.TestCase):
    def test_initial_roles_exist(self):
        expected_roles = [
            "Frontend Developer",
            "Backend Developer",
            "Full Stack Developer",
            "Data Analyst",
            "Machine Learning Engineer",
            "UI/UX Designer",
            "Cybersecurity Analyst",
        ]
        res = CareerService.list_roles()
        role_names = [r.name for r in res.roles]
        self.assertEqual(len(res.roles), 7)
        for expected in expected_roles:
            self.assertIn(expected, role_names, f"Expected {expected} in roles list")

    def test_canonical_categories(self):
        expected_cats = [
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
        self.assertEqual(len(SKILL_CATEGORIES), 9)
        for cat in expected_cats:
            self.assertIn(cat, SKILL_CATEGORIES)

        categories = CareerService.list_categories()
        cat_names = [c.name for c in categories]
        self.assertEqual(len(cat_names), 9)
        for cat in expected_cats:
            self.assertIn(cat, cat_names)

    def test_role_detail_competency_fields(self):
        for role_id in ROLES_DB.keys():
            detail = CareerService.get_role_detail(role_id)
            self.assertIsNotNone(detail)
            self.assertTrue(len(detail.skills) > 0, f"Role {role_id} must have skills")
            self.assertTrue(len(detail.categories_covered) > 0)

            for s in detail.skills:
                # Must contain: Name, Description, Expected proficiency, Skill category, Importance
                self.assertTrue(bool(s.skill_name), "Skill name must not be empty")
                self.assertTrue(bool(s.description), "Skill description must not be empty")
                self.assertIn(s.category, SKILL_CATEGORIES, f"Category {s.category} must be canonical")
                self.assertIn(s.importance, ["Essential", "Core", "Recommended", "Bonus"])
                self.assertIn(s.expected_proficiency, ["Beginner", "Basic", "Intermediate", "Advanced", "Expert"])
                self.assertTrue(1 <= s.proficiency_level <= 4)

    def test_search_and_filtering(self):
        # Search by keyword
        res_fe = CareerService.list_roles(search="Frontend Developer")
        self.assertEqual(len(res_fe.roles), 1)
        self.assertEqual(res_fe.roles[0].name, "Frontend Developer")

        # Search by description keyword
        res_sec = CareerService.list_roles(search="vulnerabilities")
        self.assertTrue(any(r.name == "Cybersecurity Analyst" for r in res_sec.roles))

        # Filter by category
        res_eng = CareerService.list_roles(category="Engineering")
        self.assertTrue(len(res_eng.roles) >= 3)

    def test_slug_lookup(self):
        detail = CareerService.get_role_detail("full-stack-developer")
        self.assertIsNotNone(detail)
        self.assertEqual(detail.name, "Full Stack Developer")

class TestCareerAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from fastapi.testclient import TestClient
        from backend.main import app
        cls.client = TestClient(app)

    def test_get_roles_endpoint(self):
        response = self.client.get("/api/careers/roles")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("roles", data)
        self.assertEqual(len(data["roles"]), 7)

    def test_get_role_detail_endpoint(self):
        response = self.client.get("/api/careers/roles/role_frontend")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["name"], "Frontend Developer")
        self.assertTrue(len(data["skills"]) > 0)
        # Check required fields
        first_skill = data["skills"][0]
        self.assertIn("skill_name", first_skill)
        self.assertIn("importance", first_skill)
        self.assertIn("expected_proficiency", first_skill)
        self.assertIn("category", first_skill)

    def test_get_categories_endpoint(self):
        response = self.client.get("/api/careers/categories")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 9)

if __name__ == "__main__":
    unittest.main()
