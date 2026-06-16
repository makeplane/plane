import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'plane.settings.local')
django.setup()

from plane.db.models import Workspace, Project, ChangeRequest, WorkspaceSecOpsConfig, User
from django.utils import timezone

def print_header(title):
    print(f"\n{'='*50}\n{title}\n{'='*50}")

print_header("3. VERIFY WORKSPACE-AWARE PROJECT RESOLUTION")

# Test users
admin_user = User.objects.filter(email='akash.barnwal@winjit.com').first()

# Scenario A: single-project workspace fallback
w_single = Workspace.objects.create(name='QA Single', slug='qa-single', owner=admin_user)
p_single = Project.objects.create(name='Project 1', identifier='PRJ1', workspace=w_single, default_assignee=admin_user)

from plane.app.views.change_management.base import _get_default_project_for_workspace
proj, err = _get_default_project_for_workspace('qa-single')
print(f"A) Single-project fallback: {proj.name if proj else err}")

# Scenario B: multi-project workspace with explicit config
w_multi = Workspace.objects.create(name='QA Multi', slug='qa-multi', owner=admin_user)
p_multi1 = Project.objects.create(name='Project M1', identifier='PRJM1', workspace=w_multi, default_assignee=admin_user)
p_multi2 = Project.objects.create(name='Project M2', identifier='PRJM2', workspace=w_multi, default_assignee=admin_user)
# Should return first if no config
proj, err = _get_default_project_for_workspace('qa-multi')
print(f"B) Multi-project (no config fallback): {proj.name if proj else err}")

# Add config
WorkspaceSecOpsConfig.objects.create(workspace=w_multi, default_change_project=p_multi2)
proj, err = _get_default_project_for_workspace('qa-multi')
print(f"B) Multi-project (explicit config): {proj.name if proj else err}")

# Scenario C: workspace with no projects
w_empty = Workspace.objects.create(name='QA Empty', slug='qa-empty', owner=admin_user)
proj, err = _get_default_project_for_workspace('qa-empty')
print(f"C) No projects: {err.data if err else 'FAIL'}")

print_header("2. VERIFY BACKEND DATA INTEGRITY (NORMAL FLOW)")

from rest_framework.test import APIClient
client = APIClient()
client.force_authenticate(user=admin_user)

# CREATE NORMAL
resp = client.post(f'/api/workspaces/qa-multi/changes/', {
    'type': 'normal',
    'priority': '3_moderate',
    'risk': '3_moderate',
    'impact': '2_medium',
    'category': 'other',
    'short_description': 'QA Normal Test'
}, format='json')
cr_normal = resp.json()
number = cr_normal['number']

print("CREATE NORMAL Response:", resp.status_code)
print(f"Number: {number}, Workspace ID: {cr_normal['workspace_id']}, Project ID: {cr_normal['project_id']}, State: {cr_normal['state']}")

# Assess
resp = client.post(f'/api/workspaces/qa-multi/changes/{number}/transition/', {'state': 'assess'}, format='json')
print("TRANSITION TO ASSESS:", resp.status_code)
approvals = client.get(f'/api/workspaces/qa-multi/changes/{number}/approvals/').json()
print(f"Approvals generated: {len(approvals)}")
for a in approvals:
    print(f"  - {a['approval_level']}: {a['status']}")

# Try moving to authorize without approving (should fail)
resp = client.post(f'/api/workspaces/qa-multi/changes/{number}/transition/', {'state': 'authorize'}, format='json')
print("TRANSITION TO AUTHORIZE (blocked):", resp.status_code, resp.json())

# Approve peer review (use ORM to bypass API detail constraints for brevity)
from plane.db.models import ChangeApproval, ChangeTask
ChangeApproval.objects.filter(change_request__number=number).update(status='approved')

# Authorize
resp = client.post(f'/api/workspaces/qa-multi/changes/{number}/transition/', {'state': 'authorize'}, format='json')
print("TRANSITION TO AUTHORIZE:", resp.status_code)
approvals = client.get(f'/api/workspaces/qa-multi/changes/{number}/approvals/').json()
print(f"CAB Approvals generated: {len([a for a in approvals if a['approval_level'] == 'cab'])}")

# Scheduled
ChangeApproval.objects.filter(change_request__number=number, approval_level='cab').update(status='approved')
resp = client.post(f'/api/workspaces/qa-multi/changes/{number}/transition/', {'state': 'scheduled'}, format='json')
print("TRANSITION TO SCHEDULED:", resp.status_code)

# Implement
resp = client.post(f'/api/workspaces/qa-multi/changes/{number}/transition/', {'state': 'implement'}, format='json')
print("TRANSITION TO IMPLEMENT:", resp.status_code)
tasks = ChangeTask.objects.filter(change_request__number=number)
print(f"Tasks generated: {tasks.count()}")
for t in tasks:
    print(f"  - {t.task_type}: {t.state}")

# Review
resp = client.post(f'/api/workspaces/qa-multi/changes/{number}/transition/', {'state': 'review'}, format='json')
print("TRANSITION TO REVIEW (blocked):", resp.status_code, resp.json())
tasks.update(state='closed')
resp = client.post(f'/api/workspaces/qa-multi/changes/{number}/transition/', {'state': 'review'}, format='json')
print("TRANSITION TO REVIEW:", resp.status_code)

# Closed
resp = client.post(f'/api/workspaces/qa-multi/changes/{number}/transition/', {'state': 'closed'}, format='json')
print("TRANSITION TO CLOSED (blocked):", resp.status_code, resp.json())

client.patch(f'/api/workspaces/qa-multi/changes/{number}/', {'close_code': 'successful', 'close_notes': 'All good'}, format='json')
resp = client.post(f'/api/workspaces/qa-multi/changes/{number}/transition/', {'state': 'closed'}, format='json')
print("TRANSITION TO CLOSED:", resp.status_code)

from plane.db.models import ChangeActivity
activities = ChangeActivity.objects.filter(change_request__number=number)
print(f"Activity Records: {activities.count()}")
for act in activities.order_by('created_at'):
    print(f"  - {act.verb}: {act.field} changed {act.old_value} -> {act.new_value} {act.comment or ''}")

# Cleanup
w_single.delete()
w_multi.delete()
w_empty.delete()

