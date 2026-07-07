# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json
import mimetypes
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


class EvaApiError(Exception):
    def __init__(self, message: str, *, method: str | None = None, details: Any = None):
        super().__init__(message)
        self.method = method
        self.details = details


class EvaApiClient:
    def __init__(self, base_url: str, token: str, *, timeout: int = 60):
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.timeout = timeout

    @property
    def endpoint(self) -> str:
        return f"{self.base_url}/api/"

    def call(self, method: str, kwargs: dict | None = None) -> Any:
        payload = json.dumps(
            {
                "jsonrpc": "2.2",
                "method": method,
                "args": [],
                "kwargs": kwargs or {},
            }
        ).encode()

        request = urllib.request.Request(
            self.endpoint,
            data=payload,
            headers={
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                body = json.loads(response.read())
        except urllib.error.HTTPError as error:
            details = error.read().decode("utf-8", errors="replace")
            raise EvaApiError(
                f"HTTP {error.code} while calling {method}",
                method=method,
                details=details,
            ) from error
        except urllib.error.URLError as error:
            raise EvaApiError(f"Connection error while calling {method}: {error.reason}", method=method) from error

        if "error" in body:
            raise EvaApiError(f"{method} failed: {body['error']}", method=method, details=body["error"])

        return body.get("result")

    def download(self, url_or_path: str, *, timeout: int | None = None) -> tuple[bytes, str, str]:
        if url_or_path.startswith("http://") or url_or_path.startswith("https://"):
            full_url = url_or_path
        else:
            normalized_path = url_or_path if url_or_path.startswith("/") else f"/{url_or_path}"
            full_url = f"{self.base_url}{normalized_path}"

        request = urllib.request.Request(
            full_url,
            headers={"Authorization": f"Bearer {self.token}"},
            method="GET",
        )

        effective_timeout = timeout if timeout is not None else self.timeout

        try:
            with urllib.request.urlopen(request, timeout=effective_timeout) as response:
                content = response.read()
                content_type = response.headers.get("Content-Type", "").split(";")[0].strip()
        except urllib.error.HTTPError as error:
            details = error.read().decode("utf-8", errors="replace")
            raise EvaApiError(
                f"HTTP {error.code} while downloading {full_url}",
                method="download",
                details=details,
            ) from error
        except urllib.error.URLError as error:
            raise EvaApiError(
                f"Connection error while downloading {full_url}: {error.reason}", method="download"
            ) from error

        filename = urllib.parse.unquote(urllib.parse.urlparse(full_url).path.rsplit("/", 1)[-1]) or "image.png"
        if not content_type or content_type == "application/octet-stream":
            guessed_type, _ = mimetypes.guess_type(filename)
            content_type = guessed_type or "image/png"

        return content, content_type, filename

    def test_connection(self) -> bool:
        self.call("CmfProject.list", {"fields": ["id", "code", "name"], "limit": 1})
        return True
