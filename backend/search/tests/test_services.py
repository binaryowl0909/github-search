from unittest import mock

from django.test import SimpleTestCase

from search.services import GitHubError, search_github


def fake_response(status_code=200, payload=None):
    response = mock.Mock()
    response.status_code = status_code
    response.json.return_value = payload or {}
    return response


class SearchGithubTests(SimpleTestCase):
    @mock.patch("search.services.requests.get")
    def test_calls_github_search_endpoint_and_returns_json(self, mock_get):
        payload = {"total_count": 1, "items": [{"login": "octocat"}]}
        mock_get.return_value = fake_response(200, payload)

        result = search_github("users", "octocat")

        self.assertEqual(result, payload)
        url = mock_get.call_args.args[0]
        kwargs = mock_get.call_args.kwargs
        self.assertEqual(url, "https://api.github.com/search/users")
        self.assertEqual(kwargs["params"]["q"], "octocat")
        self.assertEqual(kwargs["timeout"], 10)

    @mock.patch("search.services.requests.get")
    def test_rate_limit_maps_to_429(self, mock_get):
        mock_get.return_value = fake_response(403)
        with self.assertRaises(GitHubError) as ctx:
            search_github("users", "octocat")
        self.assertEqual(ctx.exception.status_code, 429)

    @mock.patch("search.services.requests.get")
    def test_upstream_error_maps_to_502(self, mock_get):
        mock_get.return_value = fake_response(500)
        with self.assertRaises(GitHubError) as ctx:
            search_github("repositories", "react")
        self.assertEqual(ctx.exception.status_code, 502)

    @mock.patch("search.services.requests.get")
    def test_network_failure_maps_to_503(self, mock_get):
        import requests as requests_lib

        mock_get.side_effect = requests_lib.ConnectionError("boom")
        with self.assertRaises(GitHubError) as ctx:
            search_github("users", "octocat")
        self.assertEqual(ctx.exception.status_code, 503)
