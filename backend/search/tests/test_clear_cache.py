from django.core.cache import cache
from django.test import TestCase, override_settings

LOCMEM_CACHE = {
    "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}
}


@override_settings(CACHES=LOCMEM_CACHE)
class ClearCacheViewTests(TestCase):
    def test_clears_all_cached_entries(self):
        cache.set("search:users:octocat", {"total_count": 1}, 60)

        response = self.client.post("/api/clear-cache")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"detail": "Cache cleared."})
        self.assertIsNone(cache.get("search:users:octocat"))

    def test_get_is_not_allowed(self):
        response = self.client.get("/api/clear-cache")
        self.assertEqual(response.status_code, 405)
