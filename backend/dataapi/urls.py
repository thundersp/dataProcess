from rest_framework.routers import DefaultRouter
from .views import DatasetViewSet, DatasetStatsViewSet

router = DefaultRouter()
router.register('datasets', DatasetViewSet)
router.register('stats', DatasetStatsViewSet)

urlpatterns = router.urls
