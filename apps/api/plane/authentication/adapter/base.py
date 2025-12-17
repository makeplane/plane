# Python imports
import os
import uuid
import requests
from io import BytesIO

# Django imports
from django.utils import timezone
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.conf import settings

# Third party imports
from zxcvbn import zxcvbn

# Module imports
from plane.db.models import Profile, User, WorkspaceMemberInvite, FileAsset
from plane.license.utils.instance_value import get_configuration_value
from .error import AuthenticationException, AUTHENTICATION_ERROR_CODES
from plane.bgtasks.user_activation_email_task import user_activation_email
from plane.utils.host import base_host
from plane.utils.ip_address import get_client_ip
from plane.utils.exception_logger import log_exception
from plane.settings.storage import S3Storage


class Adapter:
    """Common interface for all auth providers"""

    def __init__(self, request, provider, callback=None):
        self.request = request
        self.provider = provider
        self.callback = callback
        self.token_data = None
        self.user_data = None

    def get_user_token(self, data, headers=None):
        raise NotImplementedError

    def get_user_response(self):
        raise NotImplementedError

    def set_token_data(self, data):
        self.token_data = data

    def set_user_data(self, data):
        self.user_data = data

    def create_update_account(self, user):
        raise NotImplementedError

    def authenticate(self):
        raise NotImplementedError

    def sanitize_email(self, email):
        # Check if email is present
        if not email:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INVALID_EMAIL"],
                error_message="INVALID_EMAIL",
                payload={"email": email},
            )

        # Sanitize email
        email = str(email).lower().strip()

        # validate email
        try:
            validate_email(email)
        except ValidationError:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INVALID_EMAIL"],
                error_message="INVALID_EMAIL",
                payload={"email": email},
            )
        # Return email
        return email

    def validate_password(self, email):
        """Validate password strength"""
        results = zxcvbn(self.code)
        if results["score"] < 3:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INVALID_PASSWORD"],
                error_message="INVALID_PASSWORD",
                payload={"email": email},
            )
        return

    def __check_signup(self, email):
        """Check if sign up is enabled or not and raise exception if not enabled"""

        # Get configuration value
        (ENABLE_SIGNUP,) = get_configuration_value([
            {"key": "ENABLE_SIGNUP", "default": os.environ.get("ENABLE_SIGNUP", "1")}
        ])

        # Check if sign up is disabled and invite is present or not
        if ENABLE_SIGNUP == "0" and not WorkspaceMemberInvite.objects.filter(email=email).exists():
            # Raise exception
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SIGNUP_DISABLED"],
                error_message="SIGNUP_DISABLED",
                payload={"email": email},
            )

        return True

    def get_avatar_download_headers(self):
        return {}

    def check_sync_enabled(self):
        """Check if sync is enabled for the provider"""
        provider_config_map = {
            "google": "ENABLE_GOOGLE_SYNC",
            "github": "ENABLE_GITHUB_SYNC",
            "gitlab": "ENABLE_GITLAB_SYNC",
            "gitea": "ENABLE_GITEA_SYNC",
        }
        config_key = provider_config_map.get(self.provider)
        if config_key:
            (enabled,) = get_configuration_value([{"key": config_key, "default": os.environ.get(config_key, "0")}])
            return enabled == "1"
        return False

    def download_and_upload_avatar(self, avatar_url, user):
        """
        Downloads avatar from OAuth provider and uploads to our storage.
        Returns the uploaded file path or None if failed.
        """
        if not avatar_url:
            return None

        try:
            headers = self.get_avatar_download_headers()
            # Download the avatar image
            response = requests.get(avatar_url, timeout=10, headers=headers)
            response.raise_for_status()

            # Check content length before downloading
            content_length = response.headers.get("Content-Length")
            max_size = settings.DATA_UPLOAD_MAX_MEMORY_SIZE
            if content_length and int(content_length) > max_size:
                return None

            # Get content type and determine file extension
            content_type = response.headers.get("Content-Type", "image/jpeg")
            extension_map = {
                "image/jpeg": "jpg",
                "image/jpg": "jpg",
                "image/png": "png",
                "image/gif": "gif",
                "image/webp": "webp",
            }
            extension = extension_map.get(content_type)

            if not extension:
                return None

            # Download with size limit
            chunks = []
            total_size = 0
            for chunk in response.iter_content(chunk_size=8192):
                total_size += len(chunk)
                if total_size > max_size:
                    return None
                chunks.append(chunk)
            content = b"".join(chunks)
            file_size = len(content)

            # Generate unique filename
            filename = f"{uuid.uuid4().hex}-user-avatar.{extension}"

            storage = S3Storage(request=self.request)

            # Create file-like object
            file_obj = BytesIO(response.content)
            file_obj.seek(0)

            # Upload using boto3 directly
            upload_success = storage.upload_file(file_obj=file_obj, object_name=filename, content_type=content_type)
            if not upload_success:
                return None

            # Get storage metadata
            storage_metadata = storage.get_object_metadata(object_name=filename)

            # Create FileAsset record
            file_asset = FileAsset.objects.create(
                attributes={"name": f"{self.provider}-avatar.{extension}", "type": content_type, "size": file_size},
                asset=filename,
                size=file_size,
                user=user,
                created_by=user,
                entity_type=FileAsset.EntityTypeContext.USER_AVATAR,
                is_uploaded=True,
                storage_metadata=storage_metadata,
            )

            return file_asset

        except Exception as e:
            log_exception(e)
            # Return None if upload fails, so original URL can be used as fallback
            return None

    def save_user_data(self, user):
        # Update user details
        user.last_login_medium = self.provider
        user.last_active = timezone.now()
        user.last_login_time = timezone.now()
        user.last_login_ip = get_client_ip(request=self.request)
        user.last_login_uagent = self.request.META.get("HTTP_USER_AGENT")
        user.token_updated_at = timezone.now()
        # If user is not active, send the activation email and set the user as active
        if not user.is_active:
            user_activation_email.delay(base_host(request=self.request), user.id)
        # Set user as active
        user.is_active = True
        user.save()
        return user

    def delete_old_avatar(self, user):
        """Delete the old avatar if it exists"""
        try:
            if user.avatar_asset:
                asset = FileAsset.objects.get(pk=user.avatar_asset_id)
                storage = S3Storage(request=self.request)
                storage.delete_files(object_names=[asset.asset.name])

                # Delete the user avatar
                asset.delete()
                user.avatar_asset = None
                user.avatar = ""
                user.save()
            return
        except FileAsset.DoesNotExist:
            pass
        except Exception as e:
            log_exception(e)
            return

    def sync_user_data(self, user):
        # Update user details
        first_name = self.user_data.get("user", {}).get("first_name", "")
        last_name = self.user_data.get("user", {}).get("last_name", "")
        user.first_name = first_name if first_name else ""
        user.last_name = last_name if last_name else ""

        # Get email
        email = self.user_data.get("email")

        # Get display name
        display_name = self.user_data.get("user", {}).get("display_name")
        # If display name is not provided, generate a random display name
        if not display_name:
            display_name = User.get_display_name(email)

        # Set display name
        user.display_name = display_name

        # Download and upload avatar only if the avatar is different from the one in the storage
        avatar = self.user_data.get("user", {}).get("avatar", "")
        # Delete the old avatar if it exists
        self.delete_old_avatar(user=user)
        avatar_asset = self.download_and_upload_avatar(avatar_url=avatar, user=user)
        if avatar_asset:
            user.avatar_asset = avatar_asset
        # If avatar upload fails, set the avatar to the original URL
        else:
            user.avatar = avatar

        user.save()
        return user

    def complete_login_or_signup(self):
        # Get email
        email = self.user_data.get("email")

        # Sanitize email
        email = self.sanitize_email(email)

        # Check if the user is present
        user = User.objects.filter(email=email).first()
        # Check if sign up case or login
        is_signup = bool(user)
        # If user is not present, create a new user
        if not user:
            # New user
            self.__check_signup(email)

            # Initialize user
            user = User(email=email, username=uuid.uuid4().hex)

            # Check if password is autoset
            if self.user_data.get("user").get("is_password_autoset"):
                user.set_password(uuid.uuid4().hex)
                user.is_password_autoset = True
                user.is_email_verified = True

            # Validate password
            else:
                # Validate password
                self.validate_password(email)
                # Set password
                user.set_password(self.code)
                user.is_password_autoset = False

            # Set user details
            first_name = self.user_data.get("user", {}).get("first_name", "")
            last_name = self.user_data.get("user", {}).get("last_name", "")
            user.first_name = first_name if first_name else ""
            user.last_name = last_name if last_name else ""

            user.save()

            # Download and upload avatar
            avatar = self.user_data.get("user", {}).get("avatar", "")
            if avatar:
                avatar_asset = self.download_and_upload_avatar(avatar_url=avatar, user=user)
                if avatar_asset:
                    user.avatar_asset = avatar_asset
                    user.avatar = avatar
                # If avatar upload fails, set the avatar to the original URL
                else:
                    user.avatar = avatar

            # Create profile
            Profile.objects.create(user=user)

        # Check if IDP sync is enabled and user is not signing up
        if self.check_sync_enabled() and not is_signup:
            user = self.sync_user_data(user=user)

        # Save user data
        user = self.save_user_data(user=user)

        # Call callback if present
        if self.callback:
            self.callback(user, is_signup, self.request)

        # Create or update account if token data is present
        if self.token_data:
            self.create_update_account(user=user)

        # Return user
        return user
