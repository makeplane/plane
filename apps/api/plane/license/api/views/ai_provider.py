# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

import os
from dataclasses import replace

from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.app.views.external.ai_provider import (
    AIProviderError,
    OpenAICompatibleAdapter,
    ProviderConfig,
    provider_config_from_profile,
)
from plane.license.api.serializers.ai import (
    AIModelProfileSerializer,
    AIProviderConnectionTestSerializer,
    AIProviderProfileSerializer,
)
from plane.license.models import AIModelProfile, AIProviderProfile, Instance
from plane.license.utils.instance_value import get_configuration_value

from .base import BaseAPIView


def _instance_or_404():
    return Instance.objects.first()


class AIProviderCollectionEndpoint(BaseAPIView):
    def get(self, request):
        instance = _instance_or_404()
        if instance is None:
            return Response([], status=status.HTTP_200_OK)
        return Response(AIProviderProfileSerializer(instance.ai_providers.all(), many=True).data)

    def post(self, request):
        instance = _instance_or_404()
        if instance is None:
            return Response({"error_code": "INSTANCE_NOT_CONFIGURED"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = AIProviderProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            provider = serializer.save(instance=instance, created_by=request.user)
            if provider.is_default:
                AIProviderProfile.objects.filter(instance=instance).exclude(pk=provider.pk).update(is_default=False)
        return Response(AIProviderProfileSerializer(provider).data, status=status.HTTP_201_CREATED)


class AIProviderImportLegacyEndpoint(BaseAPIView):
    def post(self, request):
        instance = _instance_or_404()
        if instance is None:
            return Response({"error_code": "INSTANCE_NOT_CONFIGURED"}, status=status.HTTP_400_BAD_REQUEST)
        if AIProviderProfile.objects.filter(instance=instance).exists():
            return Response({"error_code": "PROVIDERS_ALREADY_CONFIGURED"}, status=status.HTTP_409_CONFLICT)

        api_key, provider, model = get_configuration_value(
            [
                {"key": "LLM_API_KEY", "default": os.environ.get("LLM_API_KEY")},
                {"key": "LLM_PROVIDER", "default": os.environ.get("LLM_PROVIDER", "openai")},
                {"key": "LLM_MODEL", "default": os.environ.get("LLM_MODEL", "gpt-4o-mini")},
            ]
        )
        if not api_key or str(provider or "openai").lower() != "openai":
            return Response({"error_code": "LEGACY_CONFIG_UNAVAILABLE"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = AIProviderProfileSerializer(
            data={
                "name": "Imported OpenAI",
                "slug": "imported-openai",
                "base_url": os.environ.get("OPENAI_API_BASE", "https://api.openai.com/v1"),
                "default_model": model or "gpt-4o-mini",
                "api_key": api_key,
                "is_default": True,
            }
        )
        serializer.is_valid(raise_exception=True)
        provider = serializer.save(instance=instance, created_by=request.user)
        return Response(AIProviderProfileSerializer(provider).data, status=status.HTTP_201_CREATED)


class AIProviderDetailEndpoint(BaseAPIView):
    def get_object(self, pk):
        instance = _instance_or_404()
        return AIProviderProfile.objects.get(instance=instance, pk=pk)

    def get(self, request, pk):
        return Response(AIProviderProfileSerializer(self.get_object(pk)).data)

    def patch(self, request, pk):
        provider = self.get_object(pk)
        serializer = AIProviderProfileSerializer(provider, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            provider = serializer.save(updated_by=request.user)
            if provider.is_default:
                AIProviderProfile.objects.filter(instance=provider.instance).exclude(pk=provider.pk).update(
                    is_default=False
                )
        return Response(AIProviderProfileSerializer(provider).data)

    def delete(self, request, pk):
        provider = self.get_object(pk)
        if provider.is_default:
            return Response({"error_code": "DEFAULT_PROVIDER_REQUIRED"}, status=status.HTTP_400_BAD_REQUEST)
        provider.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AIProviderSetDefaultEndpoint(BaseAPIView):
    def post(self, request, pk):
        provider = AIProviderProfile.objects.get(instance=_instance_or_404(), pk=pk)
        if not provider.enabled:
            return Response({"error_code": "PROVIDER_DISABLED"}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            AIProviderProfile.objects.filter(instance=provider.instance).update(is_default=False)
            provider.is_default = True
            provider.save(update_fields=["is_default", "updated_at"])
        return Response(AIProviderProfileSerializer(provider).data)


class AIProviderTestConnectionEndpoint(BaseAPIView):
    def post(self, request, pk):
        provider = AIProviderProfile.objects.get(instance=_instance_or_404(), pk=pk)
        model = request.data.get("model") or provider.default_model
        if not model:
            return Response({"error_code": "MODEL_REQUIRED"}, status=status.HTTP_400_BAD_REQUEST)
        result = {"success": False, "model": model}
        try:
            OpenAICompatibleAdapter().chat(provider, model, "Reply with the single word: ok")
            provider.last_tested_at = timezone.now()
            provider.last_test_success = True
            provider.last_test_error_code = ""
            result.update(success=True, provider_status="ok")
        except AIProviderError as exc:
            provider.last_tested_at = timezone.now()
            provider.last_test_success = False
            provider.last_test_error_code = exc.code
            result.update(provider_status="error", error_code=exc.code)
        finally:
            provider.save(update_fields=["last_tested_at", "last_test_success", "last_test_error_code", "updated_at"])
        return Response(result, status=status.HTTP_200_OK)


class AIProviderDraftTestConnectionEndpoint(BaseAPIView):
    """Probe a provider configuration that has not been saved yet.

    AIProviderTestConnectionEndpoint is addressed by pk and records its outcome on
    the provider row, so a brand new configuration has to be persisted before
    anyone knows whether it works. This endpoint takes the same fields straight
    from the form and runs the identical probe without touching the database, so
    the first save can be the one that already passed.
    """

    def post(self, request):
        serializer = AIProviderConnectionTestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        model = data.get("model") or data["default_model"]

        config = self._draft_config(data, model)
        if config is None:
            result = {"success": False, "model": model, "provider_status": "error", "error_code": "PROVIDER_NOT_FOUND"}
            return Response(result, status=status.HTTP_200_OK)

        result = {"success": False, "model": model}
        try:
            OpenAICompatibleAdapter().chat(config, model, "Reply with the single word: ok")
            result.update(success=True, provider_status="ok")
        except AIProviderError as exc:
            result.update(provider_status="error", error_code=exc.code)
        return Response(result, status=status.HTTP_200_OK)

    def _draft_config(self, data, model) -> ProviderConfig | None:
        """Builds the configuration to probe, or None when the named provider is gone.

        A blank api_key next to a provider id is the form's "leave blank to keep", so
        the probe has to run with the stored secret. That secret's host is read from
        the row too: pairing a stored secret with a host taken from the request would
        make this endpoint a way to send somebody's key to a server of your choosing.
        """
        provider_id = data.get("provider_id")
        if not provider_id or data.get("api_key"):
            return ProviderConfig(
                protocol=AIProviderProfile.PROTOCOL_OPENAI_COMPATIBLE,
                base_url=data["base_url"],
                api_key=data.get("api_key", ""),
                model=model,
                organization_id=data.get("organization_id", ""),
                project_id=data.get("project_id", ""),
                timeout_seconds=data.get("timeout_seconds", 30),
                max_retries=data.get("max_retries", 2),
            )

        stored = AIProviderProfile.objects.filter(instance=_instance_or_404(), pk=provider_id).first()
        if stored is None:
            return None
        return replace(
            provider_config_from_profile(stored, model=model),
            timeout_seconds=data.get("timeout_seconds", stored.timeout_seconds),
            max_retries=data.get("max_retries", stored.max_retries),
        )


class AIProviderDiscoverModelsEndpoint(BaseAPIView):
    def post(self, request, pk):
        provider = AIProviderProfile.objects.get(instance=_instance_or_404(), pk=pk)
        try:
            models = OpenAICompatibleAdapter().list_models(provider)
        except AIProviderError as exc:
            return Response({"success": False, "error_code": exc.code}, status=status.HTTP_200_OK)
        for model_id in models:
            AIModelProfile.objects.get_or_create(provider=provider, model_id=model_id)
        return Response({"success": True, "models": models})


class AIProviderModelsEndpoint(BaseAPIView):
    def get_provider(self, pk):
        return AIProviderProfile.objects.get(instance=_instance_or_404(), pk=pk)

    def get(self, request, pk):
        provider = self.get_provider(pk)
        return Response(AIModelProfileSerializer(provider.model_profiles.all(), many=True).data)

    def post(self, request, pk):
        provider = self.get_provider(pk)
        serializer = AIModelProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        model = serializer.save(provider=provider, created_by=request.user)
        return Response(AIModelProfileSerializer(model).data, status=status.HTTP_201_CREATED)


class AIProviderModelDetailEndpoint(BaseAPIView):
    def delete(self, request, pk, model_id):
        provider = AIProviderProfile.objects.get(instance=_instance_or_404(), pk=pk)
        model = AIModelProfile.objects.get(provider=provider, model_id=model_id)
        model.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, pk, model_id):
        provider = AIProviderProfile.objects.get(instance=_instance_or_404(), pk=pk)
        model = AIModelProfile.objects.get(provider=provider, model_id=model_id)
        serializer = AIModelProfileSerializer(model, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        return Response(AIModelProfileSerializer(serializer.save(updated_by=request.user)).data)
