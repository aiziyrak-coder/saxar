"""Production middleware — health checks must not break under SECURE_SSL_REDIRECT."""


class HealthCheckInternalMiddleware:
    """
    Docker HEALTHCHECK and internal curls often use plain HTTP without
    X-Forwarded-Proto. With DJANGO_BEHIND_PROXY=1 + DJANGO_SECURE_SSL=1,
    SecurityMiddleware would 301 /api/health/ and mark the API unhealthy.
    """

    _HEALTH_PATH = "/api/health/"

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path == self._HEALTH_PATH and not request.META.get("HTTP_X_FORWARDED_PROTO"):
            request.META["HTTP_X_FORWARDED_PROTO"] = "https"
        return self.get_response(request)
