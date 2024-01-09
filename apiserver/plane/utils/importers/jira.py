import requests
from requests.auth import HTTPBasicAuth
from sentry_sdk import capture_exception

from urllib.parse import urlparse

def is_allowed_hostname(hostname):
    allowed_lists = ["atl-paas.net", "atlassian.com", "atlassian.net", "jira.com"]
    # Extract the base domain from the hostname
    parsed_uri = urlparse(f"https://{hostname}")  # Add scheme for urlparse to work properly
    domain = parsed_uri.netloc.split(":")[0]  # Removes port number if included
    base_domain = ".".join(domain.split(".")[-2:])  # Extract base domain

    # Check if the base domain is in the allowed list
    return base_domain in allowed_lists


def jira_project_issue_summary(email, api_token, project_key, hostname):
    try:
        

        if not is_allowed_hostname(hostname):
            print("Errored Hostname")
            return {"error": "Invalid or unauthorized hostname"}

        auth = HTTPBasicAuth(email, api_token)
        headers = {"Accept": "application/json"}

        issue_url = f"https://{hostname}/rest/api/3/search?jql=project={project_key} AND issuetype!=Epic"
        issue_response = requests.request(
            "GET", issue_url, headers=headers, auth=auth
        ).json()["total"]

        module_url = f"https://{hostname}/rest/api/3/search?jql=project={project_key} AND issuetype=Epic"
        module_response = requests.request(
            "GET", module_url, headers=headers, auth=auth
        ).json()["total"]

        status_url = f"https://{hostname}/rest/api/3/project/${project_key}/statuses"
        status_response = requests.request(
            "GET", status_url, headers=headers, auth=auth
        ).json()

        labels_url = f"https://{hostname}/rest/api/3/label/?jql=project={project_key}"
        labels_response = requests.request(
            "GET", labels_url, headers=headers, auth=auth
        ).json()["total"]

        users_url = (
            f"https://{hostname}/rest/api/3/users/search?jql=project={project_key}"
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
