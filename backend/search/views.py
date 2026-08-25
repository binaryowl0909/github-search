from django.conf import settings
from django.core.cache import cache
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import SearchRequestSerializer
from .services import GitHubError, search_github


class SearchView(APIView):
    authentication_classes = []
    permission_classes = []

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

    def post(self, request):
        cache.clear()
        return Response({"detail": "Cache cleared."})
