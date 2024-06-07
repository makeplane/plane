# Python import
import json

# Django imports
from django.urls import reverse

# Third Party imports
from rest_framework import status
from .base import BaseAPITest

# Module imports
from plane.db.models import User
from plane.settings.redis import redis_instance


class SignInEndpointTests(BaseAPITest):
    def setUp(self):
        super().setUp()
        user = User.objects.create(email="user@plane.so")
        user.set_password("user@123")
        user.save()

    def test_without_data(self):
        url = reverse("sign-in")
        response = self.client.post(url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_email_validity(self):
        url = reverse("sign-in")
        response = self.client.post(
            url,
            {"email": "useremail.com", "password": "user@123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data, {"error": "Please provide a valid email address."}
        )

    def test_password_validity(self):
        url = reverse("sign-in")
        response = self.client.post(
            url,
            {"email": "user@plane.so", "password": "user123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            response.data,
            {
                "error": "Sorry, we could not find a user with the provided credentials. Please try again."
            },
        )

    def test_user_exists(self):
        url = reverse("sign-in")
        response = self.client.post(
            url,
            {"email": "user@email.so", "password": "user123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            response.data,
            {
                "error": "Sorry, we could not find a user with the provided credentials. Please try again."
            },
        )

    def test_user_login(self):
        url = reverse("sign-in")

        response = self.client.post(
            url,
            {"email": "user@plane.so", "password": "user@123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data.get("user").get("email"),
            "user@plane.so",
        )


class MagicLinkGenerateEndpointTests(BaseAPITest):
    def setUp(self):
        super().setUp()
        user = User.objects.create(email="user@plane.so")
        user.set_password("user@123")
        user.save()

    def test_without_data(self):
        url = reverse("magic-generate")
        response = self.client.post(url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_email_validity(self):
        url = reverse("magic-generate")
        response = self.client.post(
            url, {"email": "useremail.com"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data, {"error": "Please provide a valid email address."}
        )

    def test_magic_generate(self):
        url = reverse("magic-generate")

        ri = redis_instance()
        ri.delete("magic_user@plane.so")

        response = self.client.post(
            url, {"email": "user@plane.so"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_max_generate_attempt(self):
        url = reverse("magic-generate")

        ri = redis_instance()
        ri.delete("magic_user@plane.so")

        for _ in range(4):
            response = self.client.post(
                url,
                {"email": "user@plane.so"},
                format="json",
            )

        response = self.client.post(
            url,
            {"email": "user@plane.so"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data,
            {"error": "Max attempts exhausted. Please try again later."},
        )


class MagicSignInEndpointTests(BaseAPITest):
    def setUp(self):
        super().setUp()
        user = User.objects.create(email="user@plane.so")
        user.set_password("user@123")
        user.save()

    def test_without_data(self):
        url = reverse("magic-sign-in")
        response = self.client.post(url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data, {"error": "User token and key are required"}
        )

    def test_expired_invalid_magic_link(self):
        ri = redis_instance()
        ri.delete("magic_user@plane.so")

        url = reverse("magic-sign-in")
        response = self.client.post(
            url,
            {"key": "magic_user@plane.so", "token": "xxxx-xxxxx-xxxx"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data,
            {"error": "The magic code/link has expired please try again"},
        )

    def test_invalid_magic_code(self):
        ri = redis_instance()
        ri.delete("magic_user@plane.so")
        ## Create Token
        url = reverse("magic-generate")
        self.client.post(url, {"email": "user@plane.so"}, format="json")

        url = reverse("magic-sign-in")
        response = self.client.post(
            url,
            {"key": "magic_user@plane.so", "token": "xxxx-xxxxx-xxxx"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data,
            {"error": "Your login code was incorrect. Please try again."},
        )

    def test_magic_code_sign_in(self):
        ri = redis_instance()
        ri.delete("magic_user@plane.so")
        ## Create Token
        url = reverse("magic-generate")
        self.client.post(url, {"email": "user@plane.so"}, format="json")

        # Get the token
        user_data = json.loads(ri.get("magic_user@plane.so"))
        token = user_data["token"]

        url = reverse("magic-sign-in")
        response = self.client.post(
            url,
            {"key": "magic_user@plane.so", "token": token},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data.get("user").get("email"),
            "user@plane.so",
        )
