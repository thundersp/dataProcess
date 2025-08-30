import os
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
import pandas as pd
from .models import Dataset, DatasetStats
from .serializers import DatasetSerializer, DatasetStatsSerializer
from .processing import DataProcessor


class DatasetViewSet(viewsets.ModelViewSet):
    queryset = Dataset.objects.all().order_by('-uploaded_at')
    serializer_class = DatasetSerializer
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        instance = serializer.save()
        # After saving, load CSV and store meta
        df = pd.read_csv(instance.original_file.path)
        instance.rows, instance.cols = df.shape
        instance.save(update_fields=['rows', 'cols'])
        DataProcessor(df)  # just to ensure it loads

    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        dataset = self.get_object()
        df = pd.read_csv(dataset.original_file.path)
        processor = DataProcessor(df)
        stats = processor.compute_all()
        # Save cleaned file
        cleaned_path = None
        if hasattr(processor, 'df'):
            cleaned_dir = os.path.join(
                settings.MEDIA_ROOT, 'datasets', 'cleaned')
            os.makedirs(cleaned_dir, exist_ok=True)
            cleaned_path = os.path.join(
                cleaned_dir, f'{dataset.id}_cleaned.csv')
            processor.df.to_csv(cleaned_path, index=False)
            rel_path = os.path.relpath(cleaned_path, settings.MEDIA_ROOT)
            dataset.cleaned_file.name = rel_path
            dataset.rows, dataset.cols = processor.df.shape
            dataset.save(update_fields=['cleaned_file', 'rows', 'cols'])
        # Store stats
        stats_obj, _ = DatasetStats.objects.get_or_create(dataset=dataset)
        stats_obj.central_tendency = stats['central_tendency']
        stats_obj.dispersion = stats['dispersion']
        stats_obj.cleaning_report = stats['cleaning_report']
        stats_obj.chi_square = stats['chi_square']
        stats_obj.correlation = stats['correlation']
        stats_obj.covariance = stats['covariance']
        stats_obj.normalization = stats['normalization']
        stats_obj.discretization = stats['discretization']
        stats_obj.visualizations = stats['visualizations']
        stats_obj.save()
        return Response(DatasetSerializer(dataset).data)


class DatasetStatsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DatasetStats.objects.select_related('dataset').all()
    serializer_class = DatasetStatsSerializer
