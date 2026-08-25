from django.test import SimpleTestCase

from search.serializers import SearchRequestSerializer


class SearchRequestSerializerTests(SimpleTestCase):
    def test_valid_payload(self):
        serializer = SearchRequestSerializer(
            data={"search_type": "users", "search_text": "octocat"}
        )
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["search_type"], "users")
        self.assertEqual(serializer.validated_data["search_text"], "octocat")

    def test_accepts_all_three_types(self):
        for search_type in ("users", "repositories", "issues"):
            serializer = SearchRequestSerializer(
                data={"search_type": search_type, "search_text": "react"}
            )
            self.assertTrue(serializer.is_valid(), search_type)

    def test_missing_text_is_invalid(self):
        serializer = SearchRequestSerializer(data={"search_type": "users"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("search_text", serializer.errors)

    def test_blank_text_is_invalid(self):
        serializer = SearchRequestSerializer(
            data={"search_type": "users", "search_text": "   "}
        )
        self.assertFalse(serializer.is_valid())

    def test_unknown_type_is_invalid(self):
        serializer = SearchRequestSerializer(
            data={"search_type": "orgs", "search_text": "react"}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("search_type", serializer.errors)
