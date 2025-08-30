from __future__ import annotations
from django.db import models


class Dataset(models.Model):
    name = models.CharField(max_length=200, unique=True)
    original_file = models.FileField(upload_to='datasets/original/')
    cleaned_file = models.FileField(
        upload_to='datasets/cleaned/', null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    rows = models.IntegerField(null=True, blank=True)
    cols = models.IntegerField(null=True, blank=True)

    def __str__(self) -> str:
        return self.name


class DatasetStats(models.Model):
    dataset = models.OneToOneField(
        Dataset, on_delete=models.CASCADE, related_name='stats')
    # JSON fields store computed statistics and metadata
    central_tendency = models.JSONField(default=dict, blank=True)
    dispersion = models.JSONField(default=dict, blank=True)
    cleaning_report = models.JSONField(default=dict, blank=True)
    chi_square = models.JSONField(default=dict, blank=True)
    correlation = models.JSONField(default=dict, blank=True)
    covariance = models.JSONField(default=dict, blank=True)
    normalization = models.JSONField(default=dict, blank=True)
    discretization = models.JSONField(default=dict, blank=True)
    visualizations = models.JSONField(
        default=dict, blank=True)  # store paths or base64
    computed_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"Stats({self.dataset.name})"
