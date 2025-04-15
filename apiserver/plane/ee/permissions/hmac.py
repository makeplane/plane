import hashlib
import hmac
import time
from typing import Optional

from django.conf import settings
from rest_framework.permissions import BasePermission


class HMACPermission(BasePermission):
    """
    Custom permission to verify HMAC authentication for API requests.
    
    This permission class checks:
    1. Presence of required HMAC headers
    2. Timestamp validity (preventing replay attacks)
    3. HMAC signature verification
    """
    
    HMAC_HEADER_SIGNATURE = 'X-HMAC-Signature'
    HMAC_HEADER_TIMESTAMP = 'X-HMAC-Timestamp'
    HMAC_HEADER_SERVICE = 'X-Service'
    TIMESTAMP_TOLERANCE = 300  # 5 minutes tolerance for timestamp

    def _get_service_key_name(self, service: Optional[str]) -> str:
        """
        Generate the environment variable name for a service-specific key.
        
        Args:
            service (str, optional): The service identifier
        
        Returns:
            str: The environment variable name
        """
        if not service:
            return "HMAC_SECRET_KEY"
        return f"{service.upper()}_HMAC_SECRET_KEY"
    
    def has_permission(self, request, view) -> bool:
        """
        Validate HMAC authentication for the request.
        
        Args:
            request (Request): The incoming HTTP request
            view (APIView, optional): The view being accessed
        
        Returns:
            bool: Whether the request is authenticated
        """
        try:
            # Check if required HMAC headers are present
            signature = request.headers.get(self.HMAC_HEADER_SIGNATURE)
            timestamp = request.headers.get(self.HMAC_HEADER_TIMESTAMP)
            
            if not signature or not timestamp:
                return False

            # Validate timestamp to prevent replay attacks
            current_time = int(time.time())
            request_timestamp = int(timestamp)
            
            if abs(current_time - request_timestamp) > self.TIMESTAMP_TOLERANCE:
                return False
            
            # Reconstruct the payload for signature verification
            payload = f"{request.method}:{request.path}:{timestamp}"
            
            # Use a secure secret key from settings
            secret_key_name = self._get_service_key_name(request.headers.get(self.HMAC_HEADER_SERVICE))
            secret_key = getattr(settings, secret_key_name, None)
            
            if not secret_key:
                return False

            # Compute HMAC signature
            computed_signature = hmac.new(
                key=secret_key.encode('utf-8'),
                msg=payload.encode('utf-8'),
                digestmod=hashlib.sha256
            ).hexdigest()
            
            # Compare signatures in constant time to prevent timing attacks
            return hmac.compare_digest(computed_signature, signature)
        
        except Exception:
            # Log the error in production
            return False