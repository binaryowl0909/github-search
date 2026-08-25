from unittest import mock

from django.core.cache import cache
from django.test import TestCase, override_settings

from search.services import GitHubError

LOCMEM_CACHE = {
    "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}
}
PAYLOAD = {"total_count": 1, "incomplete_results": False, "items": [{"id": 1}]}


@override_settings(CACHES=LOCMEM_CACHE)
class SearchViewTests(TestCase):
    def setUp(self):
        cache.clear()

    def post(self, body):
        return self.client.post("/api/search", body, content_type="application/json")

    @mock.patch("search.views.search_github", return_value=PAYLOAD)
    def test_fetches_from_github_and_returns_results(self, mock_search):
        response = self.post({"search_type": "users", "search_text": "octocat"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), PAYLOAD)
        mock_search.assert_called_once_with("users", "octocat")

    @mock.patch("search.views.search_github", return_value=PAYLOAD)
    def test_second_identical_request_hits_cache_not_github(self, mock_search):
        self.post({"search_type": "users", "search_text": "octocat"})
        response = self.post({"search_type": "users", "search_text": "octocat"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), PAYLOAD)
        mock_search.assert_called_once()  # not called again

    @mock.patch("search.views.search_github", return_value=PAYLOAD)
    def test_cache_key_is_normalized(self, mock_search):
        self.post({"search_type": "users", "search_text": "  OctoCat "})
        self.post({"search_type": "users", "search_text": "octocat"})
        mock_search.assert_called_once_with("users", "octocat")

    @mock.patch("search.views.search_github", return_value=PAYLOAD)
    def test_different_type_same_text_is_a_cache_miss(self, mock_search):
        self.post({"search_type": "users", "search_text": "react"})
        self.post({"search_type": "repositories", "search_text": "react"})
        self.assertEqual(mock_search.call_count, 2)

    def test_invalid_payload_returns_400(self):
        response = self.post({"search_type": "users"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("search_text", response.json())

    @mock.patch(
        "search.views.search_github",
        side_effect=GitHubError(429, "rate limited"),
    )
    def test_github_error_status_is_passed_through(self, mock_search):
        response = self.post({"search_type": "users", "search_text": "octocat"})
        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.json(), {"detail": "rate limited"})

    @mock.patch("search.views.search_github", return_value=PAYLOAD)
    def test_results_are_cached_with_configured_ttl(self, mock_search):
        with mock.patch("search.views.cache.set") as mock_set:
            self.post({"search_type": "users", "search_text": "octocat"})
        from django.conf import settings

        mock_set.assert_called_once_with(
            "search:users:octocat", PAYLOAD, settings.SEARCH_CACHE_TTL
        )
