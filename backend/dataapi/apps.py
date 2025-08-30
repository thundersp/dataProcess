from django.apps import AppConfig
import logging
from django.db import connections
from django.db.utils import OperationalError

logger = logging.getLogger(__name__)


class DataApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'dataapi'
    verbose_name = 'Data API'

    def ready(self):  # type: ignore[override]
        # Attempt a simple DB connection to log status at startup
        try:
            db_conn = connections['default']
            db_conn.cursor()
            engine = db_conn.settings_dict.get('ENGINE')
            name = db_conn.settings_dict.get('NAME')
            logger.info(
                f"Database connection successful: engine={engine} name={name}")
        except OperationalError as e:
            logger.error(f"Database connection failed: {e}")
        except Exception as e:  # Catch-all to avoid breaking startup
            logger.warning(
                f"Unexpected issue checking database connection: {e}")
