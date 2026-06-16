import django, os, time, random
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'plane.settings.local')
django.setup()

from plane.db.models import Workspace, Project, ChangeRequest, WorkspaceSecOpsConfig, User, ChangeApproval, ChangeTask, ChangeActivity
from django.utils import timezone
from rest_framework.test import APIClient

rs = str(random.randint(10000, 99999))
slug_single = f'qa-s-{rs}'
slug_multi = f'qa-m-{rs}'
slug_empty = f'qa-e-{rs}'

def print_header(title):
    print(f'\n{'='*50}\n{title}\n{'='*50}')

print_header('3. VERIFY WORKSPACE-AWARE PROJECT RESOLUTION')

admin_user = User.objects.filter(email='akash.barnwal@winjit.com').first()

w_single = Workspace.objects.create(name='QA Single', slug=slug_single, owner=admin_user)
p_single = Project.objects.create(name='Project 1', identifier='PRJ1', workspace=w_single, default_assignee=admin_user)

from plane.app.views.change_management.base import _get_default_project_for_workspace
proj, err = _get_default_project_for_workspace(slug_single)
print(f'A) Single-project fallback: {proj.name if proj else err}')

w_multi = Workspace.objects.create(name='QA Multi', slug=slug_multi, owner=admin_user)
p_multi1 = Project.objects.create(name='Project M1', identifier='PRJM1', workspace=w_multi, default_assignee=admin_user)
p_multi2 = Project.objects.create(name='Project M2', identifier='PRJM2', workspace=w_multi, default_assignee=admin_user)

proj, err = _get_default_project_for_workspace(slug_multi)
print(f'B) Multi-project (no config fallback): {proj.name if proj else err}')

WorkspaceSecOpsConfig.objects.create(workspace=w_multi, default_change_project=p_multi2)
proj, err = _get_default_project_for_workspace(slug_multi)
print(f'B) Multi-project (explicit config): {proj.name if proj else err}')

w_empty = Workspace.objects.create(name='QA Empty', slug=slug_empty, owner=admin_user)
proj, err = _get_default_project_for_workspace(slug_empty)
print(f'C) No projects: {err.data if err else "FAIL"}')

print_header('2. VERIFY BACKEND DATA INTEGRITY (NORMAL FLOW)')

client = APIClient()
client.force_authenticate(user=admin_user)

# Setup workspace member for auth
from plane.db.models import WorkspaceMember
WorkspaceMember.objects.create(workspace=w_multi, member=admin_user, role=20)

resp = client.post(f'/api/workspaces/{slug_multi}/changes/', {
    'type': 'normal',
    'priority': '3_moderate',
    'risk': '3_moderate',
    'impact': '2_medium',
    'category': 'other',
    'short_description': 'QA Normal Test'
}, format='json')

cr_normal = resp.json()
number = cr_normal.get('number', 'UNKNOWN')

print('CREATE NORMAL Response:', resp.status_code)
if resp.status_code == 201:
    print(f'Number: {number}, Workspace ID: {cr_normal["workspace_id"]}, Project ID: {cr_normal["project_id"]}, State: {cr_normal["state"]}')

    resp = client.post(f'/api/workspaces/{slug_multi}/changes/{number}/transition/', {'state': 'assess'}, format='json')
    print('TRANSITION TO ASSESS:', resp.status_code)
    
    approvals = client.get(f'/api/workspaces/{slug_multi}/changes/{number}/approvals/').json()
    print(f'Approvals generated: {len(approvals)}')
    for a in approvals:
        print(f'  - {a["approval_level"]}: {a["status"]}')

    resp = client.post(f'/api/workspaces/{slug_multi}/changes/{number}/transition/', {'state': 'authorize'}, format='json')
    print('TRANSITION TO AUTHORIZE (blocked):', resp.status_code, resp.json())

    ChangeApproval.objects.filter(change_request__number=number).update(status='approved')

    resp = client.post(f'/api/workspaces/{slug_multi}/changes/{number}/transition/', {'state': 'authorize'}, format='json')
    print('TRANSITION TO AUTHORIZE:', resp.status_code)
    
    approvals = client.get(f'/api/workspaces/{slug_multi}/changes/{number}/approvals/').json()
    print(f'CAB Approvals generated: {len([a for a in approvals if a["approval_level"] == "cab"])}')

    ChangeApproval.objects.filter(change_request__number=number, approval_level='cab').update(status='approved')
    resp = client.post(f'/api/workspaces/{slug_multi}/changes/{number}/transition/', {'state': 'scheduled'}, format='json')
    print('TRANSITION TO SCHEDULED:', resp.status_code)

    resp = client.post(f'/api/workspaces/{slug_multi}/changes/{number}/transition/', {'state': 'implement'}, format='json')
    print('TRANSITION TO IMPLEMENT:', resp.status_code)
    
    tasks = ChangeTask.objects.filter(change_request__number=number)
    print(f'Tasks generated: {tasks.count()}')
    for t in tasks:
        print(f'  - {t.task_type}: {t.state}')

    resp = client.post(f'/api/workspaces/{slug_multi}/changes/{number}/transition/', {'state': 'review'}, format='json')
    print('TRANSITION TO REVIEW (blocked):', resp.status_code, resp.json())
    
    tasks.update(state='closed')
    resp = client.post(f'/api/workspaces/{slug_multi}/changes/{number}/transition/', {'state': 'review'}, format='json')
    print('TRANSITION TO REVIEW:', resp.status_code)

    resp = client.post(f'/api/workspaces/{slug_multi}/changes/{number}/transition/', {'state': 'closed'}, format='json')
    print('TRANSITION TO CLOSED (blocked):', resp.status_code, resp.json())

    client.patch(f'/api/workspaces/{slug_multi}/changes/{number}/', {'close_code': 'successful', 'close_notes': 'All good'}, format='json')
    resp = client.post(f'/api/workspaces/{slug_multi}/changes/{number}/transition/', {'state': 'closed'}, format='json')
    print('TRANSITION TO CLOSED:', resp.status_code)

    activities = ChangeActivity.objects.filter(change_request__number=number)
    print(f'Activity Records: {activities.count()}')
    for act in activities.order_by('created_at'):
        print(f'  - {act.verb}: {act.field} changed {act.old_value} -> {act.new_value}')

w_single.delete()
w_multi.delete()
w_empty.delete()
