from django.conf import settings
from django.core.cache import cache
from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import SearchRequestSerializer
from .services import GitHubError, search_github


class SearchView(APIView):
    authentication_classes = []
    permission_classes = []

    @extend_schema(
        summary="Search GitHub",
        description=(
            "Searches GitHub for users, repositories or issues. Results are "
            "fetched from the GitHub Search API and cached in Redis for 2 hours; "
            "an identical request within the TTL is served from cache."
        ),
        request=SearchRequestSerializer,
        responses={
            200: OpenApiResponse(description="Raw GitHub Search API payload"),
            400: OpenApiResponse(description="Validation error"),
            429: OpenApiResponse(description="GitHub rate limit exceeded"),
            502: OpenApiResponse(description="GitHub upstream error"),
        },
        examples=[
            OpenApiExample(
                "Search users",
                value={"search_type": "users", "search_text": "octocat"},
                request_only=True,
            ),
            OpenApiExample(
                "Search repositories",
                value={"search_type": "repositories", "search_text": "react"},
                request_only=True,
            ),
        ],
    )
    def post(self, request):
        serializer = SearchRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        search_type = serializer.validated_data["search_type"]
        search_text = serializer.validated_data["search_text"].strip().lower()
        cache_key = f"search:{search_type}:{search_text}"

        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        try:
            data = search_github(search_type, search_text)
        except GitHubError as exc:
            return Response({"detail": exc.message}, status=exc.status_code)

        cache.set(cache_key, data, settings.SEARCH_CACHE_TTL)
        return Response(data)


class ClearCacheView(APIView):
    authentication_classes = []
    permission_classes = []

    @extend_schema(
        summary="Clear the search cache",
        description="Flushes every cached GitHub search result from Redis.",
        request=None,
        responses={200: OpenApiResponse(description='{"detail": "Cache cleared."}')},
    )
    def post(self, request):
        cache.clear()
        return Response({"detail": "Cache cleared."})
