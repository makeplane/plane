import os
import requests
from datetime import timedelta

# Django imports
from django.utils import timezone

# Module imports
from plane.db.models import SocialLoginConnection


def get_jira_access_token(code, user_id):
    url = "https://auth.atlassian.com/oauth/token"
    headers = {"Content-Type": "application/json"}
    data = {
        "grant_type": "authorization_code",
        "client_id": os.environ.get("JIRA_CLIENT_ID"),
        "client_secret": os.environ.get("JIRA_CLIENT_SECRET"),
        "redirect_uri": os.environ.get(
            "JIRA_REDIRECT_URI", "https://localhost:3000"
        ),
        "code": code,
    }
    response = requests.post(url=url, headers=headers, json=data)

    if response.status_code == 200:
        _ = SocialLoginConnection.objects.create(
            medium="jira",
            token_data=response.json(),
            last_login_at=timezone.now(),
            user_id=user_id,
        )
        return True, {"message", "Successfully connected to Jira"}
    else:
        return False, {"error": "Error connecting to Jira"}


def get_workspace_information(user_id):
    access_token_data = SocialLoginConnection.objects.filter(
        user_id=user_id,
        last_login_at__gte=(timezone.now() - timedelta(seconds=3600)),
    ).first()
    if access_token_data:
        access_token = access_token_data.token_data.get("access_token")
        url = "https://api.atlassian.com/oauth/token/accessible-resources"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
        }
        response = requests.get(url=url, headers=headers)

        if response.status_code == 200:
            SocialLoginConnection.objects.update(extra_data=response.json())
            return True, response.json()
        else:
            return False, {"error": "Error getting workspace information"}
    else:
        False, {"error": "Try reconnecting with Jira"}


def get_jira_projects(workspace_name, user_id):
    access_token_data = SocialLoginConnection.objects.filter(
        user_id=user_id,
        last_login_at__gte=(timezone.now() - timedelta(seconds=3600)),
    ).first()
    if access_token_data:
        access_token = access_token_data.token_data.get("access_token")
        workspace = [
            w
            for w in access_token_data.extra_data
            if w.get("name") == str(workspace_name)
        ]

        if workspace:
            cloudid = workspace[0].get("id")
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json",
            }
            response = requests.get(
                f"https://api.atlassian.com/ex/jira/{cloudid}/rest/api/3/project/search",
                headers=headers,
            )
            print(response.json())
            if response.status_code == 200:
                return True, response.json()
            else:
                return False, {"error": "Unable to fetch projects"}
        else:
            return False, {"error": "Unable to match any workspaces"}
    else:
        False, {"error": "Try reconnecting with Jira"}


def get_issues(cloudid, project_key, headers):
    response = requests.get(
        f"https://api.atlassian.com/ex/jira/{cloudid}/rest/api/3/search?jql=project={project_key} AND issuetype!=Epic",
        headers=headers,
    )
    print(response.json())
    # Get issue response
    if response.status_code == 200:
        return response.json().get("total", 0)
    return 0


def get_modules(cloudid, project_key, headers):
    response = requests.get(
        f"https://api.atlassian.com/ex/jira/{cloudid}/rest/api/3/search?jql=project={project_key} AND issuetype=Epic",
        headers=headers,
    )
    # Get issue response
    if response.status_code == 200:
        return response.json().get("total", 0)
    return 0


def get_statuses(cloudid, project_key, headers):
    response = requests.get(
        f"https://api.atlassian.com/ex/jira/{cloudid}/rest/api/3/project/${project_key}/statuses",
        headers=headers,
    )
    # Get issue response
    if response.status_code == 200:
        return response.json().get("total", 0)
    return 0


def get_labels(cloudid, project_key, headers):
    response = requests.get(
        f"https://api.atlassian.com/ex/jira/{cloudid}/rest/api/3/label/?jql=project={project_key}",
        headers=headers,
    )
    # Get issue response
    if response.status_code == 200:
        return response.json().get("total", 0)
    return 0


def get_users(cloudid, project_key, headers):
    response = requests.get(
        f"https://api.atlassian.com/ex/jira/{cloudid}/rest/api/3/users/search?jql=project={project_key}",
        headers=headers,
    )
    # Get issue response
    if response.status_code == 200:
        return [
            user
            for user in response.json()
            if user.get("accountType") == "atlassian"
        ]
    return []


def jira_project_issue_summary(workspace_name, project_id, user_id):

    access_token_data = SocialLoginConnection.objects.filter(
        user_id=user_id,
        last_login_at__gte=(timezone.now() - timedelta(seconds=3600)),
    ).first()

    if access_token_data:
        access_token = access_token_data.token_data.get("access_token")

        workspace = [
            w
            for w in access_token_data.extra_data
            if w.get("name") == str(workspace_name)
        ]

        if workspace:
            cloudid = workspace[0].get("id")
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json",
            }
            response = requests.get(
                f"https://api.atlassian.com/ex/jira/{cloudid}/rest/api/3/project/search",
                headers=headers,
            )
            if response.status_code == 200:
                project = [
                    p
                    for p in response.json().get("values", [])
                    if p["id"] == str(project_id)
                ]
                if project:
                    project_key = project[0].get("key")
                    headers = {
                        "Accept": "application/json",
                        "Authorization": f"Bearer: {access_token}",
                    }
                    issues = get_issues(
                        cloudid=cloudid,
                        project_key=project_key,
                        headers=headers,
                    )
                    modules = get_modules(
                        cloudid=cloudid,
                        project_key=project_key,
                        headers=headers,
                    )
                    statuses = get_statuses(
                        cloudid=cloudid,
                        project_key=project_key,
                        headers=headers,
                    )
                    labels = get_labels(
                        cloudid=cloudid,
                        project_key=project_key,
                        headers=headers,
                    )
                    users = get_users(
                        cloudid=cloudid,
                        project_key=project_key,
                        headers=headers,
                    )

                    return True, {
                        "issues": issues,
                        "modules": modules,
                        "labels": labels,
                        "states": statuses,
                        "users": users,
                    }

                else:
                    return False, {"error": "Unable to get matching projects"}
            else:
                return False, {"error": "Unable to fetch projects"}
        else:
            return False, {"error": "Unable to match any workspaces"}
    else:
        return False, {"error": "Try reconnecting with Jira"}


def jira_import_data(workspace_name, project_id, user_id):

    access_token_data = SocialLoginConnection.objects.filter(
        user_id=user_id,
        last_login_at__gte=(timezone.now() - timedelta(seconds=3600)),
    ).first()

    if access_token_data:
        access_token = access_token_data.token_data.get("access_token")
        workspace = [
            w
            for w in access_token_data.extra_data
            if w.get("name") == str(workspace_name)
        ]

        if workspace:
            cloudid = workspace[0].get("id")
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json",
            }
            response = requests.get(
                f"https://api.atlassian.com/ex/jira/{cloudid}/rest/api/3/project/search",
                headers=headers,
            )
            if response.status_code == 200:
                project = [
                    p
                    for p in response.json().get("values", [])
                    if p["id"] == str(project_id)
                ]
                if project:
                    project_key = project[0].get("key")
                    return cloudid, project_key
                else:
                    return False, {"error": "Unable to get matching projects"}
            else:
                return False, {"error": "Unable to fetch projects"}
        else:
            return False, {"error": "Unable to match any workspaces"}
    else:
        return False, {"error": "Try reconnecting with Jira"}

