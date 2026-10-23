from types import SimpleNamespace
from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from .views import health, pending_domain_api


class ScaffoldTests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def test_health_does_not_claim_domain_or_external_services_are_ready(self):
        response = health(self.factory.get("/api/health/"))
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["domain_api_implemented"])
        self.assertFalse(response.data["external_integrations_connected"])

    def test_domain_endpoints_require_authentication(self):
        response = pending_domain_api(self.factory.get("/api/applications/"))
        self.assertEqual(response.status_code, 403)

    def test_authenticated_domain_request_fails_explicitly_not_as_fake_success(self):
        request = self.factory.post("/api/applications/", {}, format="json")
        force_authenticate(request, user=SimpleNamespace(is_authenticated=True))
        response = pending_domain_api(request)
        self.assertEqual(response.status_code, 501)
