from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    """Liveness only, deliberately not a database or integration readiness check."""
    return Response({
        "status": "ok",
        "mode": "scaffold",
        "domain_api_implemented": False,
        "external_integrations_connected": False,
    })


@api_view(["GET", "POST", "PATCH", "DELETE"])
def pending_domain_api(request, resource=""):
    # Fail closed. Do not make the in-browser demo into an unauthenticated API.
    # Map the supplied schema and implement object/action authorization first.
    return Response({
        "code": "domain_api_not_implemented",
        "detail": "Domain API awaits SQL schema mapping. Use the synthetic frontend demo.",
    }, status=501)
