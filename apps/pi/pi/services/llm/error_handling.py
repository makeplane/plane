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

import asyncio
import inspect
import logging
from functools import wraps
from typing import Any
from typing import Callable
from typing import Optional
from typing import TypeVar
from typing import Union

from langchain_core.exceptions import LangChainException
from openai import APIConnectionError
from openai import APITimeoutError
from openai import AuthenticationError
from openai import BadRequestError
from openai import InternalServerError
from openai import LengthFinishReasonError  # type: ignore[attr-defined]
from openai import PermissionDeniedError
from openai import RateLimitError
from openai import UnprocessableEntityError

from pi.services.llm.llms import LLMFactory

log = logging.getLogger(__name__)

T = TypeVar("T")
ReturnType = Union[T, str]


def llm_error_handler(
    fallback_message: str = "AI processing failed. Please try again later.",
    max_retries: int = 1,
    temp_increment: float = 0.1,
    max_temp: float = 1.0,
    enable_retry: bool = True,
    log_context: str = "",
    timeout: Optional[float] = None,
):
    """
    Decorator for handling LLM API errors with intelligent retry logic.

    Args:
        fallback_message: Message to return on failure
        max_retries: Maximum number of retry attempts
        temp_increment: Temperature increment for retries
        max_temp: Maximum temperature allowed
        enable_retry: Whether to enable retry logic
        log_context: Additional context for logging
        timeout: Optional timeout in seconds. If set, will retry with fallback model if call exceeds this time
    """

    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(func)
        async def async_wrapper(*args, **kwargs) -> Any:
            last_exception: Optional[Exception] = None
            base_temp = kwargs.get("temperature", 0.0)
            current_timeout = timeout  # Copy to avoid scoping issues when modifying
            # Introspect function signature to only pass supported kwargs on retries
            sig = inspect.signature(func)
            func_param_names = set(sig.parameters.keys())
            # Extract current model name for provider-aware fallbacks
            _current_model = kwargs.get("llm_model") or kwargs.get("model") or kwargs.get("switch_llm")

            for attempt in range(max_retries + 1):
                try:
                    # Apply timeout if specified
                    if current_timeout is not None:
                        return await asyncio.wait_for(func(*args, **kwargs), timeout=current_timeout)
                    else:
                        return await func(*args, **kwargs)

                except BadRequestError as e:
                    # Context length or other bad request errors
                    if "maximum context length" in str(e).lower() or "context_length_exceeded" in str(e).lower():
                        if attempt < max_retries and enable_retry:
                            log.warning(f"{log_context} Context length exceeded, retrying {func.__name__} (attempt {attempt + 1})")
                            # Increase temperature for retry
                            new_temp = min(base_temp + (temp_increment * (attempt + 1)), max_temp)
                            if "temperature" in func_param_names:
                                kwargs["temperature"] = new_temp
                            await asyncio.sleep(2**attempt)  # Exponential backoff
                            continue

                    log.error(f"{log_context} Bad request error in {func.__name__}: {e}")
                    last_exception = e
                    break

                except LengthFinishReasonError as e:  # type: ignore[misc]
                    # Completion hit its length limit while using structured output
                    if attempt < max_retries and enable_retry:
                        fallback_model = LLMFactory.get_fallback_model_name(_current_model)
                        log.warning(
                            f"{log_context} Length finish encountered, switching model to {fallback_model} and retrying {func.__name__} (attempt {attempt + 1})"  # noqa: E501
                        )
                        # Only set model override if the function supports an LLM model kwarg
                        for model_kw in ("llm_model", "model", "switch_llm"):
                            if model_kw in func_param_names:
                                kwargs[model_kw] = fallback_model
                                break
                        # Optionally bump temperature if supported
                        new_temp = min(base_temp + (temp_increment * (attempt + 1)), max_temp)
                        if "temperature" in func_param_names:
                            kwargs["temperature"] = new_temp
                        await asyncio.sleep(2**attempt)
                        continue

                    log.error(f"{log_context} Length finish in {func.__name__}: {e}")
                    last_exception = e
                    break

                except asyncio.TimeoutError as e:
                    # Function exceeded timeout - retry with fallback model
                    if attempt < max_retries and enable_retry:
                        fallback_model = LLMFactory.get_fallback_model_name(_current_model)
                        log.warning(
                            f"{log_context} Timeout ({current_timeout}s) exceeded, switching model to {fallback_model} and retrying {func.__name__} (attempt {attempt + 1})"  # noqa: E501
                        )
                        # Switch to fallback model
                        for model_kw in ("llm_model", "model", "switch_llm"):
                            if model_kw in func_param_names:
                                kwargs[model_kw] = fallback_model
                                break
                        # Optionally bump temperature if supported
                        new_temp = min(base_temp + (temp_increment * (attempt + 1)), max_temp)
                        if "temperature" in func_param_names:
                            kwargs["temperature"] = new_temp
                        # Increase timeout for retry to give fallback model more time
                        if current_timeout is not None:
                            current_timeout = current_timeout * 2
                        await asyncio.sleep(1)  # Short wait before retry
                        continue

                    log.error(f"{log_context} Timeout in {func.__name__}: {e}")
                    last_exception = e
                    break

                except RateLimitError as e:
                    if attempt < max_retries and enable_retry:
                        wait_time = 2**attempt
                        log.warning(f"{log_context} Rate limit hit, retrying {func.__name__} in {wait_time}s (attempt {attempt + 1})")
                        await asyncio.sleep(wait_time)
                        continue

                    log.error(f"{log_context} Rate limit exceeded in {func.__name__}: {e}")
                    last_exception = e
                    break

                except APITimeoutError as e:
                    if attempt < max_retries and enable_retry:
                        wait_time = 2**attempt
                        log.warning(f"{log_context} API timeout, retrying {func.__name__} in {wait_time}s (attempt {attempt + 1})")
                        await asyncio.sleep(wait_time)
                        continue

                    log.error(f"{log_context} API timeout in {func.__name__}: {e}")
                    last_exception = e
                    break

                except APIConnectionError as e:
                    if attempt < max_retries and enable_retry:
                        wait_time = 2**attempt
                        log.warning(f"{log_context} Connection error, retrying {func.__name__} in {wait_time}s (attempt {attempt + 1})")
                        await asyncio.sleep(wait_time)
                        continue

                    log.error(f"{log_context} API connection error in {func.__name__}: {e}")
                    last_exception = e
                    break

                except AuthenticationError as e:
                    log.error(f"{log_context} Authentication error in {func.__name__}: {e}")
                    last_exception = e
                    break

                except PermissionDeniedError as e:
                    log.error(f"{log_context} Permission denied in {func.__name__}: {e}")
                    last_exception = e
                    break

                except UnprocessableEntityError as e:
                    log.error(f"{log_context} Unprocessable entity error in {func.__name__}: {e}")
                    last_exception = e
                    break

                except InternalServerError as e:
                    if attempt < max_retries and enable_retry:
                        wait_time = 2**attempt
                        log.warning(f"{log_context} Internal server error, retrying {func.__name__} in {wait_time}s (attempt {attempt + 1})")
                        await asyncio.sleep(wait_time)
                        continue

                    log.error(f"{log_context} Internal server error in {func.__name__}: {e}")
                    last_exception = e
                    break

                except LangChainException as e:
                    log.error(f"{log_context} LangChain error in {func.__name__}: {e}")
                    last_exception = e
                    break

                except Exception as e:
                    log.error(f"{log_context} Unexpected error in {func.__name__}: {e}", exc_info=True)
                    last_exception = e
                    break

            # If we get here, all retries failed
            log.error(f"{log_context} All retry attempts failed for {func.__name__}. Last error: {last_exception}")
            return fallback_message

        @wraps(func)
        def sync_wrapper(*args, **kwargs) -> Any:
            try:
                return func(*args, **kwargs)

            except BadRequestError as e:
                log.error(f"{log_context} Bad request error in {func.__name__}: {e}")
                return fallback_message

            except RateLimitError as e:
                log.error(f"{log_context} Rate limit exceeded in {func.__name__}: {e}")
                return fallback_message

            except APITimeoutError as e:
                log.error(f"{log_context} API timeout in {func.__name__}: {e}")
                return fallback_message

            except APIConnectionError as e:
                log.error(f"{log_context} API connection error in {func.__name__}: {e}")
                return fallback_message

            except AuthenticationError as e:
                log.error(f"{log_context} Authentication error in {func.__name__}: {e}")
                return fallback_message

            except PermissionDeniedError as e:
                log.error(f"{log_context} Permission denied in {func.__name__}: {e}")
                return fallback_message

            except UnprocessableEntityError as e:
                log.error(f"{log_context} Unprocessable entity error in {func.__name__}: {e}")
                return fallback_message

            except InternalServerError as e:
                log.error(f"{log_context} Internal server error in {func.__name__}: {e}")
                return fallback_message

            except LangChainException as e:
                log.error(f"{log_context} LangChain error in {func.__name__}: {e}")
                return fallback_message

            except Exception as e:
                log.error(f"{log_context} Unexpected error in {func.__name__}: {e}", exc_info=True)
                return fallback_message

        # Return appropriate wrapper based on whether the function is async
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator


def streaming_error_handler(log_context: str = ""):
    """
    Context manager for handling streaming LLM errors.
    """

    class StreamingErrorContext:
        def __init__(self, context: str):
            self.context = context
            self.chunks: list[Any] = []

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            if exc_type is not None:
                log.error(f"{self.context} Error during streaming: {exc_val}", exc_info=True)
                return True  # Suppress the exception
            return False

        def add_chunk(self, chunk):
            self.chunks.append(chunk)

        def get_chunks(self):
            return self.chunks

    return StreamingErrorContext(log_context)
