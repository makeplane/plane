# PostHog event tracking disabled for government deployment
# Original implementation sent user PII (email, IP, user-agent) to PostHog

from celery import shared_task


@shared_task
def auth_events(user, email, user_agent, ip, event_name, medium, first_time):
    """No-op: PostHog tracking disabled for government deployment

    Original implementation sent:
    - User email and ID
    - IP address
    - User agent
    - Auth event details
    """
    pass


@shared_task
def workspace_invite_event(user, email, user_agent, ip, event_name, accepted_from):
    """No-op: PostHog tracking disabled for government deployment

    Original implementation sent:
    - User email and ID
    - IP address
    - User agent
    - Workspace invite details
    """
    pass
