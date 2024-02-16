# Python imports
import os

# Django imports
from plane.db.mongodb import Database


class APITokenLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.database = Database(os.environ.get("MONGO_DB_URL"), "plane")

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
                db = self.database.get_db()
                collection = db["api_activity_logs"]
                _ = collection.insert_one(
                    {
                        "token_identifier": api_key,
                        "path": request.path,
                        "method": request.method,
                        "query_params": request.META.get("QUERY_STRING", ""),
                        "headers": str(request.headers),
                        "body": (
                            request_body.decode("utf-8")
                            if request_body
                            else None
                        ),
                        "response_body": (
                            response.content.decode("utf-8")
                            if response.content
                            else None
                        ),
                        "response_code": response.status_code,
                        "ip_address": request.META.get("REMOTE_ADDR", None),
                        "user_agent": request.META.get(
                            "HTTP_USER_AGENT", None
                        ),
                    }
                )

            except Exception as e:
                print(e)
                # If the token does not exist, you can decide whether to log this as an invalid attempt
                pass

        return None
