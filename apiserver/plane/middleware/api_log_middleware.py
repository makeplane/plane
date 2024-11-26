from plane.db.models import APIActivityLog


class APITokenLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_body = request.body
        response = self.get_response(request)
        self.process_request(request, response, request_body)
        return response

    def process_request(self, request, response, request_body):
        api_key_header = "X-Api-Key"
        api_key = request.headers.get(api_key_header)
        # If the API key is present, log the request
        if api_key:
            try:
                APIActivityLog.objects.create(
                    token_identifier=api_key,
                    path=request.path,
                    method=request.method,
                    query_params=request.META.get("QUERY_STRING", ""),
                    headers=str(request.headers),
                    body=(request_body.decode("utf-8") if request_body else None),
                    response_body=(
                        response.content.decode("utf-8") if response.content else None
                    ),
                    response_code=response.status_code,
                    ip_address=request.META.get("REMOTE_ADDR", None),
                    user_agent=request.META.get("HTTP_USER_AGENT", None),
                )

            except Exception as e:
                print(e)
                # If the token does not exist, you can decide whether to log this as an invalid attempt

        return None
