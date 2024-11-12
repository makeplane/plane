from plane.db.models import APIActivityLog
from django.urls import resolve


class APITokenLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_body = request.body
        response = self.get_response(request)
        rewriten_path = self.project_rewiter(request)
        request.path = rewriten_path
        request.path_info = rewriten_path
        resolver_match = resolve(request.path_info)
        request.resolver_match = resolver_match  # Update resolver_match with the new path_info
        request.kwargs = resolver_match.kwargs 
        # print(request.__dict__)
        self.process_request(request, response, request_body)
        return response

    def project_rewiter(self, request):
        # Modify `kwargs` as needed
        path_split  = request.path.split('/')
        print(len(path_split))
        if len(path_split) <= 6:
            return request.path
        if request.path.split('/')[6] == 'DEFAULT':
            path_parts = request.path.split('/')
            path_parts[6] = 'dab178af-a6bb-4bfb-a0a8-ae8fd702b587'
            import pdb;pdb.set_trace()
            return '/'.join(path_parts)
        
        return request.path
        
        

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
                    body=(
                        request_body.decode("utf-8") if request_body else None
                    ),
                    response_body=(
                        response.content.decode("utf-8")
                        if response.content
                        else None
                    ),
                    response_code=response.status_code,
                    ip_address=request.META.get("REMOTE_ADDR", None),
                    user_agent=request.META.get("HTTP_USER_AGENT", None),
                )

            except Exception as e:
                print(e)
                # If the token does not exist, you can decide whether to log this as an invalid attempt

        return None
