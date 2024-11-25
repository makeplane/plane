# Python imports
import uuid

# Module imports
from .workspace_project_join import process_workspace_project_invitations
from plane.bgtasks.event_tracking_task import track_event


def post_user_auth_workflow(user, is_signup, request):
    # Process workspace project invitations
    process_workspace_project_invitations(user=user)
    # track events

    event_mapper = {
        "email": "Email",
        "google": "GOOGLE",
        "magic-code": "Magic link",
        "github": "GITHUB",
    }

    track_event.delay(
        email=user.email,
        event_name="Sign up" if is_signup else "Sign in",
        properties={
            "event_id": uuid.uuid4().hex,
            "user": {"email": user.email, "id": str(user.id)},
            "device_ctx": {
                "ip": request.META.get("REMOTE_ADDR", None),
                "user_agent": request.META.get("HTTP_USER_AGENT", None),
            },
            "medium": event_mapper.get(user.last_login_medium, "Email"),
            "first_time": is_signup,
        },
    )
