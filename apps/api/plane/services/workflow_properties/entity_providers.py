# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""§14.4 — ``ENTITY_REFERENCE`` provider registry.

Spec wording is unambiguous: *“The domain entity provider owns
validation/display.”* We do not implement providers for every domain
type (employee / asset / department / vendor / cost center are not
modelled in this fork yet); instead we expose a small registry. The
built-in ``user`` provider uses the existing ``User`` model so the
validation path is exercised today. Other entity types are *registered
lazily* — the first time a consumer (UI, portal, etc.) wires up its
own resolver, it calls ``register_entity_provider`` and the validation
path picks it up.

**Fail-closed default.** If no provider is registered for an
``entity_type`` the reference is rejected. This is the §14.4
“rejects a dangling/invalid reference” contract — never fall back to
free-text or accept-on-trust.
"""

# Python imports
from dataclasses import dataclass
from typing import Callable, Dict, Optional, Tuple


# ---------------------------------------------------------------------------
# Provider protocol
# ---------------------------------------------------------------------------


@dataclass
class EntityReferenceProvider:
    """A registered provider for one ``entity_type``.

    ``resolve`` returns the underlying record (or ``None`` if the
    reference is dangling). ``display`` returns a short string the UI
    can show in the picker; it is optional because some providers do
    not have a stable display string. ``validate`` is a shortcut for
    "does the record exist and is it allowed in this workspace?"; the
    default impl just calls ``resolve``.
    """

    entity_type: str
    resolve: Callable[[str], Optional[object]]
    display: Optional[Callable[[object], str]] = None

    def validate(self, entity_id: str) -> Tuple[bool, Optional[str]]:
        try:
            obj = self.resolve(entity_id)
        except Exception:  # pragma: no cover - defensive
            return False, "Provider raised while resolving entity."
        if obj is None:
            return False, f"No {self.entity_type} record exists for that id."
        return True, None


# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------


_PROVIDERS: Dict[str, EntityReferenceProvider] = {}


def register_entity_provider(provider: EntityReferenceProvider) -> None:
    """Register (or replace) the provider for ``provider.entity_type``."""
    if not provider.entity_type:
        raise ValueError("EntityReferenceProvider.entity_type is required.")
    _PROVIDERS[provider.entity_type] = provider


def unregister_entity_provider(entity_type: str) -> None:
    _PROVIDERS.pop(entity_type, None)


def get_entity_provider(entity_type: str) -> Optional[EntityReferenceProvider]:
    return _PROVIDERS.get(entity_type)


def known_entity_types() -> list[str]:
    return sorted(_PROVIDERS.keys())


def reset_entity_providers() -> None:
    """Test hook — drop every registered provider.

    Production code never calls this. It exists so tests can isolate
    the registry without leaking state across test modules.
    """
    _PROVIDERS.clear()


# ---------------------------------------------------------------------------
# Built-in providers
# ---------------------------------------------------------------------------


def _register_builtin_providers() -> None:
    """Register the providers that exist out of the box.

    Import is deferred to keep this module importable in lightweight
    contexts (e.g. ``manage.py`` before the app registry is ready).
    """
    if _PROVIDERS:
        return

    from plane.db.models import User

    def _resolve_user(user_id: str):
        try:
            return User.objects.filter(pk=user_id, is_active=True).first()
        except (ValueError, TypeError):
            return None

    def _display_user(user) -> str:
        full = f"{getattr(user, 'first_name', '') or ''} {getattr(user, 'last_name', '') or ''}".strip()
        return full or getattr(user, "email", "") or str(getattr(user, "id", ""))

    register_entity_provider(
        EntityReferenceProvider(
            entity_type="user",
            resolve=_resolve_user,
            display=_display_user,
        )
    )


def _ensure_builtins() -> None:
    if not _PROVIDERS:
        _register_builtin_providers()


def resolve_entity(entity_type: str, entity_id: str) -> Tuple[bool, Optional[str], Optional[object]]:
    """Resolve an ``ENTITY_REFERENCE`` payload.

    Returns ``(ok, reason, record)``. ``record`` is ``None`` on a
    dangling reference but the caller should not depend on its shape;
    the ``ok`` flag is the public contract.
    """
    _ensure_builtins()
    provider = get_entity_provider(entity_type)
    if provider is None:
        return (
            False,
            f"No provider is registered for entity_type '{entity_type}'.",
            None,
        )
    ok, reason = provider.validate(entity_id)
    if not ok:
        return False, reason, None
    record = provider.resolve(entity_id)
    return True, None, record


def display_entity(entity_type: str, entity_id: str) -> Optional[str]:
    """Return a display string for a resolved entity, or ``None``."""
    _ensure_builtins()
    provider = get_entity_provider(entity_type)
    if provider is None or provider.display is None:
        return None
    record = provider.resolve(entity_id)
    if record is None:
        return None
    try:
        return provider.display(record)
    except Exception:  # pragma: no cover - defensive
        return None
