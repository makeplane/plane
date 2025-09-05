"""Firebase Cloud Messaging (FCM) Implementation"""

import base64

# Python imports
from typing import Optional

# Third party imports
import firebase_admin

# Django imports
from django.conf import settings
from firebase_admin import credentials, messaging

# Module imports
from .helper import is_mobile_push_notification_disabled


class PushNotification:
    """Handles push notifications using Firebase Cloud Messaging."""

    def __init__(self):
        """Initialize Firebase credentials on instantiation."""
        self.initialize_firebase()

    def decode_private_key(self, base64_string):
        """Decode the base64 encoded private key."""
        try:
            decoded_bytes = base64.b64decode(base64_string)
            private_key = decoded_bytes.decode("utf-8")

            if "-----BEGIN PRIVATE KEY-----" not in private_key:
                private_key = (
                    f"-----BEGIN PRIVATE KEY-----\n"
                    f"{private_key}\n"
                    f"-----END PRIVATE KEY-----"
                )

            return private_key
        except Exception as e:
            print(f"Error decoding private key: {str(e)}")
            return None

    def initialize_firebase(self) -> None:
        """Initialize Firebase Cloud Messaging with credentials from settings."""
        try:
            if is_mobile_push_notification_disabled():
                return

            #  convert private key from base64 to bytes
            private_key = (
                self.decode_private_key(settings.FIREBASE_PRIVATE_KEY)
                if settings.FIREBASE_PRIVATE_KEY
                else None
            )

            if private_key is not None:
                firebase_credentials = credentials.Certificate(
                    {
                        "type": "service_account",
                        "project_id": settings.FIREBASE_PROJECT_ID,
                        "private_key_id": settings.FIREBASE_PRIVATE_KEY_ID,
                        "private_key": private_key,
                        "client_email": settings.FIREBASE_CLIENT_EMAIL,
                        "client_id": settings.FIREBASE_CLIENT_ID,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "client_x509_cert_url": settings.FIREBASE_CLIENT_CERT_URL,
                        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                        "universe_domain": "googleapis.com",
                    }
                )
                if not firebase_admin._apps:
                    firebase_admin.initialize_app(firebase_credentials)
            return
        except Exception as e:
            print(f"Error initializing Firebase: {e}")
            raise

    def send(
        self,
        title: str,
        body: str,
        device_token_id: str,
        data: Optional[dict] = {},
        notification_count: Optional[int] = 0,
    ) -> dict:
        """Send push notifications to specified devices."""
        if is_mobile_push_notification_disabled():
            return "Mobile push notifications are disabled"

        try:
            if not all([title, body, device_token_id]):
                raise ValueError("Title, body, and device_token_id are required")

            message = messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                data=data or {},
                token=device_token_id,
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(badge=notification_count, sound="default")
                    )
                ),
                android=messaging.AndroidConfig(
                    notification=messaging.AndroidNotification(
                        notification_count=notification_count,
                        sound="default",
                    ),
                ),
            )

            response = messaging.send(message)

            return {
                "notification_success_count": response.success_count
                if response and hasattr(response, "success_count")
                else 0,
                "notification_failure_count": response.failure_count
                if response and hasattr(response, "failure_count")
                else 0,
            }
        except Exception as e:
            print(f"Error sending push notification: {e}")
            return {"status": "error", "error": str(e)}
