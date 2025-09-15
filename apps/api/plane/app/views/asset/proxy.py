# Python imports
import base64
import json
import time
import hashlib

# Django imports
from django.conf import settings
from django.http import HttpResponse
from django.http import StreamingHttpResponse

# Third party imports
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from botocore.exceptions import ClientError

# Module imports
from plane.settings.storage import S3Storage
from plane.utils.exception_logger import log_exception
from plane.app.views.base import BaseAPIView


class ProxyUploadEndpoint(BaseAPIView):
    """
    Proxy endpoint that receives uploads and directly uploads to S3 using boto3
    with time-based validation
    """

    permission_classes = [AllowAny]

    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, encoded_s3_url):
        """Handle file upload with time-based validation and upload directly to S3 using boto3"""
        try:
            # Decode the original S3 URL (we don't actually use it, just for validation)
            _ = base64.urlsafe_b64decode(encoded_s3_url.encode()).decode()
        except Exception:
            return Response(
                {"error": "Invalid S3 URL"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Get the uploaded file and form data
        try:
            # Extract required fields from form data
            object_key = request.data.get("key")
            content_type = request.data.get("Content-Type")
            policy = request.data.get("policy")
            signature = request.data.get("signature")

            # Validate required fields
            if not all([object_key, content_type, policy]):
                return Response(
                    {"error": "Invalid request"}, status=status.HTTP_400_BAD_REQUEST
                )
            # Upload directly to S3 using boto3
            storage = S3Storage(is_server=True)

            # Validate policy expiration and time limits
            is_valid, error_msg = storage.validate_upload_policy(policy, signature)
            if not is_valid:
                return Response(
                    {"error": f"Policy validation failed: {error_msg}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Get the uploaded file - the field name is 'file'
            uploaded_file = request.FILES.get("file")

            if not uploaded_file:
                return Response(
                    {"error": "No file provided in 'file' field"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Additional validation: check file size against policy conditions if needed
            # (The policy contains content-length-range conditions)

            success = storage.upload_file(
                file_obj=uploaded_file,
                object_name=object_key,
                content_type=content_type,
            )

            if success:
                # Return a response that matches what S3 would return for successful upload
                # S3 POST upload returns 204 No Content on success
                return HttpResponse(status=204)
            else:
                return Response(
                    {"error": "Upload to S3 failed"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        except Exception as e:
            log_exception(e)
            return Response(
                {"error": "Upload failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ProxyDownloadEndpoint(BaseAPIView):
    """
    Proxy endpoint that receives download requests and streams content from S3
    """

    permission_classes = [AllowAny]

    def get(self, request, encoded_params):
        """Handle download request and stream from S3"""

        storage = S3Storage(is_server=True)
        # Validate parameters
        params, error = storage.validate_download_params(encoded_params)
        if error:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        object_name = params["object_name"]

        try:
            # Get object metadata first
            metadata = storage.get_object_metadata(object_name)
            if not metadata:
                return Response(
                    {"error": "File not found"}, status=status.HTTP_404_NOT_FOUND
                )

            # Stream the file from S3
            def stream_from_s3():
                try:
                    response = storage.s3_client.get_object(
                        Bucket=storage.aws_storage_bucket_name,
                        Key=object_name,
                    )

                    # Stream in chunks
                    for chunk in response["Body"].iter_chunks(chunk_size=8192):
                        yield chunk

                except ClientError as e:
                    log_exception(e)
                    yield b""  # Return empty chunk on error

            # Create streaming response
            response = StreamingHttpResponse(
                stream_from_s3(),
                content_type=metadata.get("ContentType", "application/octet-stream"),
            )

            # Set content disposition header
            disposition = params.get("disposition", "inline")
            filename = params.get("filename")
            if filename:
                response["Content-Disposition"] = (
                    f'{disposition}; filename="{filename}"'
                )
            else:
                response["Content-Disposition"] = disposition

            response["Content-Length"] = metadata.get("ContentLength", 0)

            return response

        except Exception as e:
            log_exception(e)
            return Response(
                {"error": "Download failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
