def is_pkce_required(client_id: str) -> bool:
    from plane.authentication.models import Application
    if Application.objects.filter(
        client_id=client_id, client_type=Application.CLIENT_PUBLIC
    ).exists():
        return True
    return False
