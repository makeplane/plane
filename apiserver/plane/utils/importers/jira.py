import requests
from requests.auth import HTTPBasicAuth
from sentry_sdk import capture_exception
from urllib.parse import urlparse, urljoin


def is_allowed_hostname(hostname):
    allowed_domains = ["atl-paas.net", "atlassian.com", "atlassian.net", "jira.com"]
    parsed_uri = urlparse(f"https://{hostname}")
    domain = parsed_uri.netloc.split(":")[0]  # Ensures no port is included
    base_domain = ".".join(domain.split(".")[-2:])
    return base_domain in allowed_domains


def generate_url(hostname, path):
    if not is_allowed_hostname(hostname):
        raise ValueError("Invalid or unauthorized hostname")
    return urljoin(f"https://{hostname}", path)


def jira_project_issue_summary(email, api_token, project_key, hostname):
    try:
        if not is_allowed_hostname(hostname):
            print("Errored Hostname")
            return {"error": "Invalid or unauthorized hostname"}

        auth = HTTPBasicAuth(email, api_token)
        headers = {"Accept": "application/json"}

        issue_url = generate_url(
            hostname,
            f"/rest/api/3/search?jql=project={project_key} AND issuetype!=Epic",
        )
        issue_response = requests.request(
            "GET", issue_url, headers=headers, auth=auth
        ).json()["total"]

        module_url = generate_url(
            hostname, f"/rest/api/3/search?jql=project={project_key} AND issuetype=Epic"
        )
        module_response = requests.request(
            "GET", module_url, headers=headers, auth=auth
        ).json()["total"]

        status_url = generate_url(
            hostname, f"/rest/api/3/project/${project_key}/statuses"
        )
        status_response = requests.request(
            "GET", status_url, headers=headers, auth=auth
        ).json()

        labels_url = generate_url(
            hostname, f"/rest/api/3/label/?jql=project={project_key}"
        )
        labels_response = requests.request(
            "GET", labels_url, headers=headers, auth=auth
        ).json()["total"]

        users_url = generate_url(
            hostname, f"/rest/api/3/users/search?jql=project={project_key}"
        )
        users_response = requests.request(
            "GET", users_url, headers=headers, auth=auth
        ).json()

        return {
            "issues": issue_response,
            "modules": module_response,
            "labels": labels_response,
            "states": len(status_response),
            "users": (
                [
                    user
                    for user in users_response
                    if user.get("accountType") == "atlassian"
                ]
            ),
        }
    except Exception as e:
        capture_exception(e)
        return {"error": "Something went wrong could not fetch information from jira"}
