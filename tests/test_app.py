import json
import os
import unittest
from app import app, QUOTES

class QuoteAppTestCase(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True

    def test_dataset_integrity(self):
        """Verify quotes.json contains exactly 100 valid quotes."""
        self.assertEqual(len(QUOTES), 100, "Dataset must contain exactly 100 quotes")
        ids = set()
        categories = set()
        authors = set()

        for q in QUOTES:
            self.assertIn("id", q)
            self.assertIn("quote", q)
            self.assertIn("author", q)
            self.assertIn("category", q)

            self.assertTrue(isinstance(q["id"], int))
            self.assertTrue(len(q["quote"].strip()) > 0)
            self.assertTrue(len(q["author"].strip()) > 0)
            self.assertTrue(len(q["category"].strip()) > 0)

            # Check unique IDs
            self.assertNotIn(q["id"], ids, f"Duplicate ID found: {q['id']}")
            ids.add(q["id"])
            categories.add(q["category"])
            authors.add(q["author"])

        self.assertEqual(len(ids), 100)
        self.assertGreaterEqual(len(categories), 5)
        self.assertGreaterEqual(len(authors), 50)

    def test_index_page(self):
        """Verify the root route renders the HTML template."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"QuoteWise", response.data)
        self.assertIn(b"app.js", response.data)
        self.assertIn(b"style.css", response.data)

    def test_get_all_quotes(self):
        """Verify /api/quotes returns 100 quotes."""
        response = self.client.get("/api/quotes")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["count"], 100)
        self.assertEqual(len(data["quotes"]), 100)

    def test_get_random_quote(self):
        """Verify /api/quotes/random returns a single valid quote."""
        response = self.client.get("/api/quotes/random")
        self.assertEqual(response.status_code, 200)
        quote = response.get_json()
        self.assertIn("id", quote)
        self.assertIn("quote", quote)
        self.assertIn("author", quote)
        self.assertIn("category", quote)

    def test_get_random_quote_filtered(self):
        """Verify /api/quotes/random respects category and author filters."""
        # By category
        response = self.client.get("/api/quotes/random?category=Philosophy")
        self.assertEqual(response.status_code, 200)
        quote = response.get_json()
        self.assertEqual(quote["category"].lower(), "philosophy")

        # By author
        response = self.client.get("/api/quotes/random?author=Einstein")
        self.assertEqual(response.status_code, 200)
        quote = response.get_json()
        self.assertIn("einstein", quote["author"].lower())

    def test_get_random_quote_not_found(self):
        """Verify /api/quotes/random returns 404 when filters match no quotes."""
        response = self.client.get("/api/quotes/random?author=NonExistentPerson12345")
        self.assertEqual(response.status_code, 404)
        data = response.get_json()
        self.assertIn("error", data)

    def test_search_quotes_by_query(self):
        """Verify /api/quotes/search filters by text keyword."""
        response = self.client.get("/api/quotes/search?q=wisdom")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertGreater(data["count"], 0)
        for q in data["quotes"]:
            self.assertTrue(
                "wisdom" in q["quote"].lower() or "wisdom" in q["author"].lower()
            )

    def test_search_quotes_by_author(self):
        """Verify /api/quotes/search filters by author name."""
        response = self.client.get("/api/quotes/search?author=Turing")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["count"], 1)
        self.assertEqual(data["quotes"][0]["author"], "Alan Turing")

    def test_search_quotes_by_category(self):
        """Verify /api/quotes/search filters by category."""
        response = self.client.get("/api/quotes/search?category=Philosophy")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertGreater(data["count"], 0)
        for q in data["quotes"]:
            self.assertEqual(q["category"].lower(), "philosophy")

    def test_get_categories(self):
        """Verify /api/categories returns categories and accurate counts summing to 100."""
        response = self.client.get("/api/categories")
        self.assertEqual(response.status_code, 200)
        categories = response.get_json()
        self.assertTrue(isinstance(categories, list))
        self.assertGreaterEqual(len(categories), 5)
        total_sum = sum(c["count"] for c in categories)
        self.assertEqual(total_sum, 100)

    def test_get_authors(self):
        """Verify /api/authors returns distinct sorted list."""
        response = self.client.get("/api/authors")
        self.assertEqual(response.status_code, 200)
        authors = response.get_json()
        self.assertTrue(isinstance(authors, list))
        self.assertGreaterEqual(len(authors), 50)
        self.assertEqual(authors, sorted(authors))

if __name__ == "__main__":
    unittest.main()
