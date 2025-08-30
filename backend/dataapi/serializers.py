from rest_framework import serializers
from .models import Dataset, DatasetStats


class DatasetStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DatasetStats
        fields = '__all__'


class DatasetSerializer(serializers.ModelSerializer):
    stats = DatasetStatsSerializer(read_only=True)

    class Meta:
        model = Dataset
        fields = ['id', 'name', 'original_file', 'cleaned_file',
                  'uploaded_at', 'rows', 'cols', 'stats']
        read_only_fields = ['uploaded_at', 'rows', 'cols', 'stats']
