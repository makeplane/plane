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

from typing import Optional

from langchain_cohere import CohereEmbeddings
from pydantic import SecretStr

from pi import settings
from pi.core.vectordb.client import VectorStore
from pi.services.llm.llms import LLMConfig
from pi.services.llm.llms import create_openai_llm
from pi.services.retrievers.pg_store import get_ml_model_id_sync


def validate_openai_key(api_key: Optional[str] = None, base_url: Optional[str] = None) -> tuple[bool, str]:
    """Validate OpenAI API key."""

    key = api_key or settings.llm_config.OPENAI_API_KEY
    if not key or not key.strip():
        return False, "OpenAI API key not configured"

    try:
        config = LLMConfig.openai(
            "gpt-4o-mini",
            streaming=False,
            temperature=0.0,
            api_key=key,
            base_url=base_url,
        )
        llm = create_openai_llm(config, track_tokens=False)
        llm.invoke("Hi")
        return True, f"Valid OpenAI API key. Test model: {config.model}"
    except Exception as e:
        clean_msg = _extract_error_message(str(e))
        if "401" in str(e) or "api key" in str(e).lower():
            return False, f"Invalid OpenAI API key: {clean_msg}"
        return False, f"Error validating OpenAI key: {clean_msg}"


def validate_anthropic_key(api_key: Optional[str] = None, base_url: Optional[str] = None) -> tuple[bool, str]:
    """Validate Anthropic API key via OpenAI-compatible ChatCompletions (ChatOpenAI).

    Plane routes Claude models through `create_openai_llm()` (ChatOpenAI) using
    `CLAUDE_BASE_URL` as the OpenAI-compatible gateway/proxy base URL.
    """

    key = api_key or settings.llm_config.CLAUDE_API_KEY
    if not key or not key.strip():
        return False, "Anthropic API key not configured"

    try:
        config = LLMConfig.anthropic(
            settings.llm_model.CLAUDE_SONNET_4_0,
            streaming=False,
            temperature=0.0,
            api_key=key,
            base_url=base_url,
        )
        llm = create_openai_llm(config, track_tokens=False)
        llm.invoke("Hi")
        return True, f"Valid Anthropic API key. Test model: {config.model}"
    except Exception as e:
        clean_msg = _extract_error_message(str(e))
        if "401" in str(e) or "authentication" in str(e).lower() or "api key" in str(e).lower():
            return False, f"Invalid Anthropic API key: {clean_msg}"
        return False, f"Error validating Anthropic key: {clean_msg}"


def validate_groq_key(api_key: Optional[str] = None, base_url: Optional[str] = None) -> tuple[bool, str]:
    """Validate Groq API key."""

    key = api_key or settings.llm_config.GROQ_API_KEY
    if not key or not key.strip():
        return False, "Groq API key not configured"

    try:
        # Groq uses an OpenAI-compatible API surface, so validate via `ChatOpenAI`.
        config = LLMConfig.openai(
            "llama-3.3-70b-versatile",
            streaming=False,
            temperature=0.0,
            api_key=key,
            base_url=base_url or settings.llm_config.GROQ_BASE_URL,
        )
        llm = create_openai_llm(config, track_tokens=False)
        llm.invoke("Hi")
        return True, f"Valid Groq API key. Test model: {config.model}"
    except Exception as e:
        clean_msg = _extract_error_message(str(e))
        if "401" in str(e) or "api key" in str(e).lower():
            return False, f"Invalid Groq API key: {clean_msg}"
        return False, f"Error validating Groq key: {clean_msg}"


def validate_cohere_key(api_key: Optional[str] = None, base_url: Optional[str] = None) -> tuple[bool, str]:
    """Validate Cohere API key."""

    key = api_key or settings.llm_config.COHERE_API_KEY
    if not key or not key.strip():
        return False, "Cohere API key not configured"

    try:
        # Use proper types for Cohere embeddings
        embeddings = CohereEmbeddings(
            cohere_api_key=SecretStr(key),
            model="embed-v4.0",
            client=None,
            async_client=None,
        )
        result = embeddings.embed_query("test")
        return True, f"Valid Cohere API key. Embedding dimension: {len(result)} and model: embed-v4.0"
    except Exception as e:
        clean_msg = _extract_error_message(str(e))
        if "401" in str(e) or "invalid" in str(e).lower():
            return False, f"Invalid Cohere API key: {clean_msg}"
        return False, f"Error validating Cohere key: {clean_msg}"


def validate_custom_llm(api_key: Optional[str] = None, base_url: Optional[str] = None, model_key: Optional[str] = None) -> tuple[bool, str]:
    """Validate custom self-hosted LLM connectivity."""

    key = api_key or settings.llm_config.CUSTOM_LLM_API_KEY or "not-needed"
    url = base_url or settings.llm_config.CUSTOM_LLM_BASE_URL
    model = model_key or settings.llm_config.CUSTOM_LLM_MODEL_KEY

    if not url:
        return False, "CUSTOM_LLM_BASE_URL not configured"
    if not model:
        return False, "CUSTOM_LLM_MODEL_KEY not configured"

    try:
        config = LLMConfig(model=model, base_url=url, api_key=key, streaming=False, temperature=0.0)
        llm = create_openai_llm(config, track_tokens=False)
        llm.invoke("Hi")
        return True, f"Valid custom LLM. Model: {model}, URL: {url}"
    except Exception as e:
        clean_msg = _extract_error_message(str(e))
        return False, f"Custom LLM validation failed: {clean_msg}"


def validate_embedding_model_id(model_id: Optional[str] = None) -> tuple[bool, str]:
    """Validate OpenSearch embedding model by generating embeddings via OpenSearch ML."""

    ml_model_id = model_id or get_ml_model_id_sync()
    if not ml_model_id or not ml_model_id.strip():
        return False, "Embedding model ID not configured (check OPENSEARCH_ML_MODEL_ID env var or database)"

    vs = VectorStore()
    try:
        # Check model exists and is deployed
        model_status = vs.get_ml_model_status(ml_model_id)
        state = model_status.get("model_state", "unknown")
        name = model_status.get("name", "unknown")
        algorithm = model_status.get("algorithm", "unknown")

        if state.lower() != "deployed":
            return False, f"Embedding model exists but not deployed: {name} (ID: {ml_model_id}, state: {state})"

        # Test actual embedding generation via OpenSearch ML model using correct parameter format
        test_text = "Test document for validating embedding model"
        test_response = vs.test_ml_model(model_id=ml_model_id, test_input=[test_text])

        # Extract embedding from response
        inference_results = test_response.get("inference_results", [])
        if not inference_results:
            return False, "Embedding model test failed: no inference results returned"

        output = inference_results[0].get("output", [])
        if not output or not isinstance(output[0], dict):
            return False, "Embedding model test failed: unexpected output format"

        embedding_data = output[0].get("data", [])
        if not embedding_data:
            return False, "Embedding model test failed: no embedding data in output"

        embedding_dim = len(embedding_data)

        return True, f"Valid embedding model: {name} (ID: {ml_model_id}, dimension: {embedding_dim}, state: {state}, algorithm: {algorithm})"
    except Exception as e:
        error_msg = str(e)
        # Provide more helpful error message
        if "404" in error_msg or "not found" in error_msg.lower():
            return False, f"Embedding model not found: {ml_model_id}"
        elif "403" in error_msg or "forbidden" in error_msg.lower():
            return False, f"Permission denied accessing embedding model: {ml_model_id}"
        return False, f"Error validating embedding model: {error_msg}"
    finally:
        vs.os.close()


def _extract_error_message(error_msg: str, max_length: int = 200) -> str:
    """Extract clean error message from API exceptions.

    Attempts to extract the actual error message from verbose API error responses,
    falling back to a truncated version if parsing fails.
    """
    error_str = str(error_msg)

    # Try to extract the 'message' field from error responses
    for quote in ['"', "'"]:
        msg_pattern = f"{quote}message{quote}:"
        if msg_pattern in error_str:
            try:
                start_idx = error_str.find(msg_pattern) + len(msg_pattern)
                # Skip whitespace
                while start_idx < len(error_str) and error_str[start_idx] in " \t":
                    start_idx += 1
                # Check for opening quote
                if start_idx < len(error_str) and error_str[start_idx] in ['"', "'"]:
                    quote_char = error_str[start_idx]
                    start_idx += 1
                    end_idx = error_str.find(quote_char, start_idx)
                    if end_idx > start_idx:
                        return error_str[start_idx:end_idx]
            except (ValueError, IndexError):
                continue

    # Fallback: return truncated original message
    return error_str[:max_length] + "..." if len(error_str) > max_length else error_str
