# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

"""
Embedding model configuration registry.

This module defines all supported embedding models for OpenSearch ml-commons.
Each model includes its provider, dimensions, API configuration, and request body format.
"""

import re
from typing import TypedDict

from pi import settings


class EmbeddingModelConfig(TypedDict):
    """Configuration for an embedding model."""

    provider: str  # e.g., "cohere", "openai", "bedrock"
    model_name: str  # e.g., "embed-v4.0"
    dimension: int  # Embedding dimension, e.g., 1536
    base_url: str  # API endpoint URL
    trusted_endpoint_regex: str  # Regex for OpenSearch trusted endpoints
    protocol: str  # "http" or "aws_sigv4"
    credential_key: str  # Key name in credential dict (e.g., "cohere_key")
    api_key_env: str  # Environment variable for API key
    request_body: str  # OpenSearch request body template
    pre_process: str  # Pre-process function name
    post_process: str  # Post-process function name
    parameters: dict  # Default parameters for the connector
    headers: dict  # Headers for the API request
    supports_batch: bool  # Whether the model supports batch _predict calls


_BEDROCK_REGION = settings.BR_AWS_REGION

# Registry of all supported embedding models
EMBEDDING_MODELS: dict[str, EmbeddingModelConfig] = {
    # ==========================================================================
    # COHERE MODELS
    # ==========================================================================
    "cohere/embed-v4.0": {
        "provider": "cohere",
        "model_name": "embed-v4.0",
        "dimension": 1536,
        "base_url": "https://api.cohere.ai/v1/embed",
        "trusted_endpoint_regex": r"^https://api\.cohere\.ai(/.*)?",
        "protocol": "http",
        "credential_key": "cohere_key",
        "api_key_env": "COHERE_API_KEY",
        "request_body": '{ "texts": ${parameters.texts}, "truncate": "${parameters.truncate}", "model": "${parameters.model}", "input_type": "${parameters.input_type}" }',  # noqa: E501
        "pre_process": "connector.pre_process.cohere.embedding",
        "post_process": "connector.post_process.cohere.embedding",
        "parameters": {"model": "embed-v4.0", "input_type": "search_document", "truncate": "END"},
        "headers": {
            "Authorization": "Bearer ${credential.cohere_key}",
            "Request-Source": "unspecified:opensearch",
            "Content-Type": "application/json",
        },
        "supports_batch": True,
    },
    "cohere/embed-english-v3.0": {
        "provider": "cohere",
        "model_name": "embed-english-v3.0",
        "dimension": 1024,
        "base_url": "https://api.cohere.ai/v1/embed",
        "trusted_endpoint_regex": r"^https://api\.cohere\.ai(/.*)?",
        "protocol": "http",
        "credential_key": "cohere_key",
        "api_key_env": "COHERE_API_KEY",
        "request_body": '{ "texts": ${parameters.texts}, "truncate": "${parameters.truncate}", "model": "${parameters.model}", "input_type": "${parameters.input_type}" }',  # noqa: E501
        "pre_process": "connector.pre_process.cohere.embedding",
        "post_process": "connector.post_process.cohere.embedding",
        "parameters": {"model": "embed-english-v3.0", "input_type": "search_document", "truncate": "END"},
        "headers": {
            "Authorization": "Bearer ${credential.cohere_key}",
            "Request-Source": "unspecified:opensearch",
            "Content-Type": "application/json",
        },
        "supports_batch": True,
    },
    "cohere/embed-english-v2.0": {
        "provider": "cohere",
        "model_name": "embed-english-v2.0",
        "dimension": 4096,
        "base_url": "https://api.cohere.ai/v1/embed",
        "trusted_endpoint_regex": r"^https://api\.cohere\.ai(/.*)?",
        "protocol": "http",
        "credential_key": "cohere_key",
        "api_key_env": "COHERE_API_KEY",
        "request_body": '{ "texts": ${parameters.texts}, "truncate": "${parameters.truncate}", "model": "${parameters.model}", "input_type": "${parameters.input_type}" }',  # noqa: E501
        "pre_process": "connector.pre_process.cohere.embedding",
        "post_process": "connector.post_process.cohere.embedding",
        "parameters": {"model": "embed-english-v2.0", "input_type": "search_document", "truncate": "END"},
        "headers": {
            "Authorization": "Bearer ${credential.cohere_key}",
            "Request-Source": "unspecified:opensearch",
            "Content-Type": "application/json",
        },
        "supports_batch": True,
    },
    # ==========================================================================
    # OPENAI MODELS
    # ==========================================================================
    "openai/text-embedding-ada-002": {
        "provider": "openai",
        "model_name": "text-embedding-ada-002",
        "dimension": 1536,
        "base_url": "https://api.openai.com/v1/embeddings",
        "trusted_endpoint_regex": r"^https://api\.openai\.com(/.*)?",
        "protocol": "http",
        "credential_key": "openAI_key",
        "api_key_env": "OPENAI_API_KEY",
        "request_body": '{ "input": ${parameters.input}, "model": "${parameters.model}" }',
        "pre_process": "connector.pre_process.openai.embedding",
        "post_process": "connector.post_process.openai.embedding",
        "parameters": {"model": "text-embedding-ada-002"},
        "headers": {"Authorization": "Bearer ${credential.openAI_key}"},
        "supports_batch": True,
    },
    "openai/text-embedding-3-small": {
        "provider": "openai",
        "model_name": "text-embedding-3-small",
        "dimension": 1536,
        "base_url": "https://api.openai.com/v1/embeddings",
        "trusted_endpoint_regex": r"^https://api\.openai\.com(/.*)?",
        "protocol": "http",
        "credential_key": "openAI_key",
        "api_key_env": "OPENAI_API_KEY",
        "request_body": '{ "input": ${parameters.input}, "model": "${parameters.model}" }',
        "pre_process": "connector.pre_process.openai.embedding",
        "post_process": "connector.post_process.openai.embedding",
        "parameters": {"model": "text-embedding-3-small"},
        "headers": {"Authorization": "Bearer ${credential.openAI_key}"},
        "supports_batch": True,
    },
    "openai/text-embedding-3-large": {
        "provider": "openai",
        "model_name": "text-embedding-3-large",
        "dimension": 3072,
        "base_url": "https://api.openai.com/v1/embeddings",
        "trusted_endpoint_regex": r"^https://api\.openai\.com(/.*)?",
        "protocol": "http",
        "credential_key": "openAI_key",
        "api_key_env": "OPENAI_API_KEY",
        "request_body": '{ "input": ${parameters.input}, "model": "${parameters.model}" }',
        "pre_process": "connector.pre_process.openai.embedding",
        "post_process": "connector.post_process.openai.embedding",
        "parameters": {"model": "text-embedding-3-large"},
        "headers": {"Authorization": "Bearer ${credential.openAI_key}"},
        "supports_batch": True,
    },
    # ==========================================================================
    # AWS BEDROCK MODELS
    # ==========================================================================
    "bedrock/amazon.titan-embed-text-v1": {
        "provider": "bedrock",
        "model_name": "amazon.titan-embed-text-v1",
        "dimension": 1536,
        "base_url": "https://bedrock-runtime.${parameters.region}.amazonaws.com/model/${parameters.model}/invoke",
        "trusted_endpoint_regex": r"^https://bedrock-runtime\..*\.amazonaws\.com(/.*)?",
        "protocol": "aws_sigv4",
        "credential_key": "access_key",
        "api_key_env": "BR_AWS_ACCESS_KEY_ID",
        "request_body": '{ "inputText": "${parameters.inputText}" }',
        "pre_process": "connector.pre_process.bedrock.embedding",
        "post_process": "connector.post_process.bedrock.embedding",
        "parameters": {"region": _BEDROCK_REGION, "service_name": "bedrock", "model": "amazon.titan-embed-text-v1"},
        "headers": {"content-type": "application/json", "x-amz-content-sha256": "required"},
        "supports_batch": False,  # Bedrock Titan only accepts single inputText string
    },
    "bedrock/amazon.titan-embed-text-v2": {
        "provider": "bedrock",
        "model_name": "amazon.titan-embed-text-v2:0",
        "dimension": 1024,
        "base_url": "https://bedrock-runtime.${parameters.region}.amazonaws.com/model/${parameters.model}/invoke",
        "trusted_endpoint_regex": r"^https://bedrock-runtime\..*\.amazonaws\.com(/.*)?",
        "protocol": "aws_sigv4",
        "credential_key": "access_key",
        "api_key_env": "BR_AWS_ACCESS_KEY_ID",
        "request_body": '{ "inputText": "${parameters.inputText}", "embeddingTypes": ["float"] }',
        "pre_process": "connector.pre_process.bedrock.embedding",
        "post_process": "connector.post_process.bedrock_v2.embedding.float",
        "parameters": {"region": _BEDROCK_REGION, "service_name": "bedrock", "model": "amazon.titan-embed-text-v2:0"},
        "headers": {"content-type": "application/json", "x-amz-content-sha256": "required"},
        "supports_batch": False,  # Bedrock Titan only accepts single inputText string
    },
    "bedrock/cohere.embed-english-v3": {
        "provider": "bedrock",
        "model_name": "cohere.embed-english-v3",
        "dimension": 1024,
        "base_url": "https://bedrock-runtime.${parameters.region}.amazonaws.com/model/${parameters.model}/invoke",
        "trusted_endpoint_regex": r"^https://bedrock-runtime\..*\.amazonaws\.com(/.*)?",
        "protocol": "aws_sigv4",
        "credential_key": "access_key",
        "api_key_env": "BR_AWS_ACCESS_KEY_ID",
        "request_body": '{ "texts": ${parameters.texts}, "input_type": "search_document" }',
        "pre_process": "connector.pre_process.cohere.embedding",
        "post_process": "connector.post_process.cohere.embedding",
        "parameters": {"region": _BEDROCK_REGION, "service_name": "bedrock", "model": "cohere.embed-english-v3"},
        "headers": {"content-type": "application/json", "x-amz-content-sha256": "required"},
        "supports_batch": True,  # Cohere preprocessing supports batch arrays
    },
    "bedrock/cohere.embed-multilingual-v3": {
        "provider": "bedrock",
        "model_name": "cohere.embed-multilingual-v3",
        "dimension": 1024,
        "base_url": "https://bedrock-runtime.${parameters.region}.amazonaws.com/model/${parameters.model}/invoke",
        "trusted_endpoint_regex": r"^https://bedrock-runtime\..*\.amazonaws\.com(/.*)?",
        "protocol": "aws_sigv4",
        "credential_key": "access_key",
        "api_key_env": "BR_AWS_ACCESS_KEY_ID",
        "request_body": '{ "texts": ${parameters.texts}, "input_type": "search_document" }',
        "pre_process": "connector.pre_process.cohere.embedding",
        "post_process": "connector.post_process.cohere.embedding",
        "parameters": {"region": _BEDROCK_REGION, "service_name": "bedrock", "model": "cohere.embed-multilingual-v3"},
        "headers": {"content-type": "application/json", "x-amz-content-sha256": "required"},
        "supports_batch": True,  # Cohere preprocessing supports batch arrays
    },
}


def get_embedding_model_config(model_key: str) -> EmbeddingModelConfig:
    """
    Get configuration for a specific embedding model.

    Args:
        model_key: Model key in format "provider/model-name" (e.g., "cohere/embed-v4.0")

    Returns:
        EmbeddingModelConfig for the specified model

    Raises:
        ValueError: If model_key is not found in registry
    """
    if model_key not in EMBEDDING_MODELS:
        available = ", ".join(sorted(EMBEDDING_MODELS.keys()))
        raise ValueError(f"Unknown embedding model: '{model_key}'. Available models: {available}")
    return EMBEDDING_MODELS[model_key]


def get_available_embedding_models() -> list[str]:
    """
    List all available embedding model keys.

    Returns:
        List of model keys (e.g., ["cohere/embed-v4.0", "openai/text-embedding-3-small", ...])
    """
    return sorted(EMBEDDING_MODELS.keys())


def get_embedding_models_by_provider(provider: str) -> list[str]:
    """
    Get all embedding models for a specific provider.

    Args:
        provider: Provider name (e.g., "cohere", "openai", "bedrock")

    Returns:
        List of model keys for the specified provider
    """
    return sorted([key for key, config in EMBEDDING_MODELS.items() if config["provider"] == provider])


def get_embedding_input_parameter(model_key: str) -> str:
    """
    Extract the input parameter name from the request_body template.

    Different providers use different parameter names:
    - OpenAI: "input"
    - Cohere: "texts"
    - Bedrock: "inputText"

    This function parses the request_body template to extract the parameter name,
    avoiding hardcoded provider logic.

    Args:
        model_key: Model key in format "provider/model-name" (e.g., "openai/text-embedding-ada-002")

    Returns:
        Parameter name to use for text input (e.g., "input", "texts", "inputText")

    Raises:
        ValueError: If model_key is not found or parameter name cannot be extracted
    """

    config = get_embedding_model_config(model_key)
    request_body = config["request_body"]

    # Extract parameter name from patterns like ${parameters.input} or ${parameters.texts}
    match = re.search(r"\$\{parameters\.(\w+)\}", request_body)
    if not match:
        raise ValueError(f"Cannot extract parameter name from request_body for model: {model_key}")

    param_name = match.group(1)
    return param_name


def get_embedding_param_from_active_model() -> str:
    """
    Get the parameter name for the currently configured embedding model.

    Uses the EMBEDDING_MODEL from config (env var OPENSEARCH_EMBEDDING_MODEL_NAME)
    and extracts the appropriate parameter name (input, texts, or inputText).

    Returns:
        Parameter name for the configured model (e.g., "input", "texts", "inputText")

    Raises:
        ValueError: If model is not configured or parameter cannot be extracted
    """

    # Get model key from config (e.g., "cohere/embed-v4.0" or "openai/text-embedding-ada-002")
    model_key = settings.vector_db.EMBEDDING_MODEL

    # Extract parameter name from request_body template
    return get_embedding_input_parameter(model_key)


def active_model_supports_batch() -> bool:
    """
    Check if the currently configured embedding model supports batch _predict calls.

    Bedrock Titan models only accept a single inputText string, so they require
    individual requests. OpenAI and Cohere support batch arrays natively.

    Returns:
        True if the model supports batch requests, False if individual requests are needed.
    """

    model_key = settings.vector_db.EMBEDDING_MODEL
    config = get_embedding_model_config(model_key)
    return config.get("supports_batch", True)
