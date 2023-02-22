import os
import jwt
import requests
from datetime import datetime, timedelta
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from cryptography.hazmat.backends import default_backend


def get_jwt_token():
    app_id = os.environ.get("GITHUB_APP_ID", "")
    secret = bytes(os.environ.get("GITHUB_APP_PRIVATE_KEY", ""), encoding="utf8")
    current_timestamp = int(datetime.now().timestamp())
    due_date = datetime.now() + timedelta(minutes=10)
    expiry = int(due_date.timestamp())
    payload = {
        "iss": app_id,
        "sub": app_id,
        "exp": expiry,
        "iat": current_timestamp,
        "aud": "https://github.com/login/oauth/access_token",
    }

    priv_rsakey = load_pem_private_key(secret, None, default_backend())
    token = jwt.encode(payload, priv_rsakey, algorithm="RS256")
    return token


def get_github_metadata(installation_id):
    token = get_jwt_token()

    url = f"https://api.github.com/app/installations/{installation_id}"
    headers = {
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github+json",
    }
    response = requests.get(url, headers=headers).json()
    return response


def get_github_repos(access_tokens_url, repositories_url):
    token = get_jwt_token()

    headers = {
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github+json",
    }

    oauth_response = requests.post(
        access_tokens_url,
        headers=headers,
    ).json()

    oauth_token = oauth_response.get("token")
    headers = {
        "Authorization": "Bearer " + oauth_token,
        "Accept": "application/vnd.github+json",
    }
    response = requests.get(
        repositories_url,
        headers=headers,
    ).json()
    return response
