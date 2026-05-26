# verify_features.py
import os
import sys
import django

# Setup django environment
sys.path.append("/code")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "plane.settings.local")
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from django.urls import ResolverMatch

from plane.db.models import User, Project, State, Issue, IssueComment, ProjectMember
from plane.api.views.issue import IssueDetailAPIEndpoint, IssueCommentListCreateAPIEndpoint
from plane.app.views.state.base import StateViewSet
from plane.app.views.csv_import import CSVImportValidateAPIEndpoint, CSVImportConfirmAPIEndpoint

def make_request(rf, method, url, data=None, user=None, slug=None, project_id=None):
    if method == "get":
        req = rf.get(url, data, format="json")
    elif method == "post":
        req = rf.post(url, data, format="json")
    elif method == "patch":
        req = rf.patch(url, data, format="json")
    elif method == "delete":
        req = rf.delete(url, data, format="json")
    else:
        raise ValueError("Invalid method")
        
    if user:
        force_authenticate(req, user=user)
        
    kwargs = {}
    if slug:
        kwargs["slug"] = slug
    if project_id:
        kwargs["project_id"] = str(project_id)
        
    req.resolver_match = ResolverMatch(func=None, args=(), kwargs=kwargs)
    return req

def run_verification():
    print("=== STARTING FEATURE VERIFICATION ===")
    
    # 1. Setup workspace/project details
    project = Project.objects.filter(id="5ef9615e-f156-4d65-9b98-30ab05c47195").first()
    if not project:
        print("Project not found!")
        return
        
    workspace = project.workspace
    print(f"Workspace: {workspace.slug}, Project: {project.name} ({project.id})")
    
    from plane.db.models import WorkspaceMember
    # Get users
    admin_user = User.objects.get(email="yash.sathe@winjit.com")
    member_user = User.objects.get(email="akash.barnwal@winjit.com")
    
    # Create or get a real test member user (Workspace role: Member, Project role: Member)
    test_member, created = User.objects.get_or_create(
        email="test_member@winjit.com",
        defaults={"username": "test_member", "is_active": True}
    )
    # Ensure they are in the workspace as a Member
    WorkspaceMember.objects.get_or_create(
        workspace=workspace,
        member=test_member,
        defaults={"role": 15, "is_active": True}
    )
    # Ensure they are in the project as a Member
    ProjectMember.objects.get_or_create(
        project=project,
        workspace=workspace,
        member=test_member,
        defaults={"role": 15, "is_active": True}
    )
    
    # Find a Done state (completed group) and an In Progress state (started group)
    done_state = State.objects.filter(project=project, group="completed").first()
    in_progress_state = State.objects.filter(project=project, group="started").first()
    
    if not done_state or not in_progress_state:
        print("Required states not found!")
        return
        
    print(f"Done state: {done_state.name}, In Progress state: {in_progress_state.name}")
    
    # Find/Create a Done issue
    done_issue = Issue.objects.filter(project=project, state=done_state).first()
    if not done_issue:
        done_issue = Issue.objects.create(
            project=project,
            state=done_state,
            name="Test Done Issue",
            description_html="<p>Done Issue</p>"
        )
    print(f"Done issue: Sequence {done_issue.sequence_id}, state: {done_issue.state.name}")
    
    # Find/Create an active issue
    active_issue = Issue.objects.filter(project=project, state=in_progress_state).first()
    if not active_issue:
        active_issue = Issue.objects.create(
            project=project,
            state=in_progress_state,
            name="Test Active Issue",
            description_html="<p>Active Issue</p>"
        )
    print(f"Active issue: Sequence {active_issue.sequence_id}, state: {active_issue.state.name}")
    
    # ==========================================
    # FEATURE 1: LOCK DONE ISSUES VERIFICATION
    # ==========================================
    print("\n--- Feature 1: Lock Done Issues ---")
    
    rf = APIRequestFactory()
    
    # A. Modifying fields (other than state) on a Done issue should fail
    req = make_request(
        rf, "patch",
        f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/{done_issue.id}/",
        {"name": "Attempting to change name"},
        user=admin_user, slug=workspace.slug, project_id=project.id
    )
    view = IssueDetailAPIEndpoint.as_view()
    res = view(req, slug=workspace.slug, project_id=str(project.id), pk=done_issue.id)
    print(f"PATCH name on Done issue status: {res.status_code}")
    assert res.status_code == 403, f"Should block name edits on completed issue, got {res.status_code}"
    assert "This issue is in Done state" in str(res.data), f"Expected lock error message, got {res.data}"
    print("-> Done issue field locks verified successfully!")
    
    # B. Changing state field on a Done issue should succeed
    req = make_request(
        rf, "patch",
        f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/{done_issue.id}/",
        {"state": str(in_progress_state.id)},
        user=admin_user, slug=workspace.slug, project_id=project.id
    )
    res = view(req, slug=workspace.slug, project_id=str(project.id), pk=done_issue.id)
    print(f"PATCH state on Done issue status: {res.status_code}")
    assert res.status_code == 200, f"Should allow state transitions on completed issue, got {res.status_code}"
    
    # Reset issue state back to done
    done_issue.state = done_state
    done_issue.save()
    print("-> Done issue state transition verified successfully!")
    
    # C. Adding comments to a Done issue should fail
    comment_req = make_request(
        rf, "post",
        f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/{done_issue.id}/comments/",
        {"comment_html": "<p>New comment</p>", "comment_json": {}},
        user=admin_user, slug=workspace.slug, project_id=project.id
    )
    comment_view = IssueCommentListCreateAPIEndpoint.as_view()
    comment_res = comment_view(comment_req, slug=workspace.slug, project_id=str(project.id), issue_id=done_issue.id)
    print(f"POST comment on Done issue status: {comment_res.status_code}")
    assert comment_res.status_code == 403, f"Should block creating comments on completed issue, got {comment_res.status_code}"
    print("-> Done issue comment creation block verified successfully!")
    
    # ==========================================
    # FEATURE 2: ADMIN-ONLY STATE MANAGEMENT
    # ==========================================
    print("\n--- Feature 2: Admin-Only State Management ---")
    
    # Non-admin member attempts to create state
    state_req = make_request(
        rf, "post",
        f"/api/workspaces/{workspace.slug}/projects/{project.id}/states/",
        {"name": "Member New State", "group": "backlog", "color": "#cccccc"},
        user=test_member, slug=workspace.slug, project_id=project.id
    )
    state_create_view = StateViewSet.as_view({"post": "create"})
    state_res = state_create_view(state_req, slug=workspace.slug, project_id=str(project.id))
    print(f"POST state by member status: {state_res.status_code}")
    if state_res.status_code != 403:
        print(f"Error data: {state_res.data}")
    assert state_res.status_code == 403, f"Should block state creation by non-admin member, got {state_res.status_code}"
    
    # Project Admin attempts to create state
    state_req = make_request(
        rf, "post",
        f"/api/workspaces/{workspace.slug}/projects/{project.id}/states/",
        {"name": "Admin New State", "group": "backlog", "color": "#cccccc"},
        user=admin_user, slug=workspace.slug, project_id=project.id
    )
    state_res = state_create_view(state_req, slug=workspace.slug, project_id=str(project.id))
    print(f"POST state by admin status: {state_res.status_code}")
    assert state_res.status_code == 200 or state_res.status_code == 201, f"Should allow state creation by project admin, got {state_res.status_code}"
    created_state_id = state_res.data["id"]
    print("-> State creation permissions verified successfully!")
    
    # Non-admin member attempts to delete the newly created state
    delete_req = make_request(
        rf, "delete",
        f"/api/workspaces/{workspace.slug}/projects/{project.id}/states/{created_state_id}/?migrate_to={in_progress_state.id}",
        user=test_member, slug=workspace.slug, project_id=project.id
    )
    state_delete_view = StateViewSet.as_view({"delete": "destroy"})
    state_res = state_delete_view(delete_req, slug=workspace.slug, project_id=str(project.id), pk=created_state_id)
    print(f"DELETE state by member status: {state_res.status_code}")
    assert state_res.status_code == 403, f"Should block state deletion by non-admin member, got {state_res.status_code}"
    
    # Project Admin attempts to delete the newly created state
    delete_req = make_request(
        rf, "delete",
        f"/api/workspaces/{workspace.slug}/projects/{project.id}/states/{created_state_id}/?migrate_to={in_progress_state.id}",
        user=admin_user, slug=workspace.slug, project_id=project.id
    )
    state_res = state_delete_view(delete_req, slug=workspace.slug, project_id=str(project.id), pk=created_state_id)
    print(f"DELETE state by admin status: {state_res.status_code}")
    assert state_res.status_code == 204, f"Should allow state deletion by project admin, got {state_res.status_code}"
    print("-> State deletion permissions verified successfully!")
    
    # ==========================================
    # FEATURE 3: CSV IMPORT VERIFICATION
    # ==========================================
    print("\n--- Feature 3: CSV Import Wizard ---")
    
    from django.core.files.uploadedfile import SimpleUploadedFile
    csv_bytes = (
        "title,description,priority,state,assignee\n"
        "CSV Test Issue 1,Description 1,high,In Progress,yash.sathe@winjit.com\n"
        "CSV Test Issue 2,Description 2,low,InvalidState,akash.barnwal@winjit.com\n"
    ).encode("utf-8")
    
    file_obj = SimpleUploadedFile("issues.csv", csv_bytes, content_type="text/csv")
    
    # Dry run validation
    validate_req = rf.post(
        f"/api/workspaces/{workspace.slug}/projects/{project.id}/import/csv/validate/",
        {"file": file_obj},
        format="multipart"
    )
    force_authenticate(validate_req, user=admin_user)
    validate_req.resolver_match = ResolverMatch(func=None, args=(), kwargs={"slug": workspace.slug, "project_id": str(project.id)})
    validate_view = CSVImportValidateAPIEndpoint.as_view()
    validate_res = validate_view(validate_req, slug=workspace.slug, project_id=str(project.id))
    print(f"CSV validate status: {validate_res.status_code}")
    if validate_res.status_code != 200:
        print(f"Error data: {validate_res.data}")
    assert validate_res.status_code == 200, f"Should validate CSV successfully, got {validate_res.status_code}"
    print(f"Validation warnings: {validate_res.data.get('warnings', [])}")
    # Warnings should mention InvalidState not existing
    assert any("State 'InvalidState' not found" in w for w in validate_res.data.get('warnings', [])), "Should warning invalid state"
    print("-> CSV validation and warning logging verified successfully!")
    
    # Real confirm import with support ticket creation option enabled
    confirm_req = make_request(
        rf, "post",
        f"/api/workspaces/{workspace.slug}/projects/{project.id}/import/csv/confirm/",
        {
            "rows": validate_res.data.get("valid_rows", []),
            "create_support_tickets": True
        },
        user=admin_user, slug=workspace.slug, project_id=project.id
    )
    confirm_view = CSVImportConfirmAPIEndpoint.as_view()
    confirm_res = confirm_view(confirm_req, slug=workspace.slug, project_id=str(project.id))
    print(f"CSV confirm status: {confirm_res.status_code}")
    if confirm_res.status_code != 201:
        print(f"Error data: {confirm_res.data}")
    assert confirm_res.status_code == 201, f"Should confirm and create issues/tickets successfully, got {confirm_res.status_code}"
    
    created_issues = confirm_res.data.get("issues_created", 0)
    created_tickets = confirm_res.data.get("tickets_created", 0)
    print(f"Created issues: {created_issues}, Created tickets: {created_tickets}")
    assert created_issues == 2, "Should create 2 issues"
    assert created_tickets == 2, "Should create 2 support tickets"
    
    # Verify the support ticket format (WINJIT-#XXXXX) and source (CSV_IMPORT)
    from plane.db.models import SupportTicket
    recent_tickets = SupportTicket.objects.filter(project=project, source="CSV_IMPORT")
    print(f"Found {recent_tickets.count()} CSV_IMPORT support tickets")
    for t in recent_tickets:
        print(f"Ticket ID: {t.id}, Ticket Number: {t.ticket_number}, Display: {t.ticket_display}")
        assert t.ticket_display.startswith("WINJIT-#"), f"Ticket display prefix should be WINJIT-# but got {t.ticket_display}"
    
    print("-> Support ticket format and CSV source verified successfully!")
    print("\n=== ALL FEATURES VERIFIED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_verification()
