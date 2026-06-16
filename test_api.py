import requests

url = "http://localhost:3000/api/workspaces/itops/changes/"
headers = {
    "Content-Type": "application/json"
}
data = {
    "type": "normal",
    "state": "new",
    "priority": "3_moderate",
    "risk": "3_moderate",
    "impact": "2_medium",
    "category": "other",
    "short_description": "Test request",
    "description_html": "This is a test description",
    "conflict_status": "not_run"
}
response = requests.post(url, headers=headers, json=data)
print(response.status_code)
print(response.text[:500])
