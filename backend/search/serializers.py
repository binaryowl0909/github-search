from rest_framework import serializers

SEARCH_TYPES = ("users", "repositories", "issues")


class SearchRequestSerializer(serializers.Serializer):
    search_type = serializers.ChoiceField(choices=SEARCH_TYPES)
    search_text = serializers.CharField(max_length=256, trim_whitespace=True)
