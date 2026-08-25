import requests
from django.conf import settings


class GitHubError(Exception):
    """GitHub API failure, carrying the HTTP status our API should respond with."""

    def __init__(self, status_code: int, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.message = message


def search_github(search_type: str, search_text: str) -> dict:
    headers = {"Accept": "application/vnd.github+json"}
    if settings.GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"

    try:
        response = requests.get(
            f"{settings.GITHUB_API_BASE}/{search_type}",
            params={"q": search_text, "per_page": 30},
            headers=headers,
            timeout=10,
        )
    except requests.RequestException as exc:
        raise GitHubError(503, "GitHub API is unreachable") from exc

    if response.status_code == 403:
        raise GitHubError(429, "GitHub API rate limit exceeded, please retry later")
    if response.status_code != 200:
        raise GitHubError(502, f"GitHub API returned status {response.status_code}")
    return response.json()
