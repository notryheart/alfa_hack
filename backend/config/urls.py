from django.urls import path, re_path
from .views import health, pending_domain_api

urlpatterns = [
    path("api/health/", health),
    re_path(r"^api/(?P<resource>.*)$", pending_domain_api),
]
