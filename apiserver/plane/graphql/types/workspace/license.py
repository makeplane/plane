# Third party imports
from typing import Optional


# Strawberry imports
import strawberry


@strawberry.type
class WorkspaceLicenseType:
    is_cancelled: Optional[bool]
    purchased_seats: Optional[int]
    current_period_end_date: Optional[str]
    interval: Optional[str]
    product: Optional[str]
    is_offline_payment: Optional[bool]
    trial_end_date: Optional[str]
    has_activated_free_trial: Optional[bool]
    has_added_payment_method: Optional[bool]
    subscription: Optional[str]
    is_self_managed: Optional[bool]
    is_on_trial: Optional[bool]
    is_trial_allowed: Optional[bool]
    remaining_trial_days: Optional[int]
    has_upgraded: Optional[bool]
    show_payment_button: Optional[bool]
    show_trial_banner: Optional[bool]
    free_seats: Optional[int]
    occupied_seats: Optional[int]
    show_seats_banner: Optional[bool]
    current_period_start_date: Optional[str]
    is_trial_ended: Optional[bool]
    billable_members: Optional[int]
    is_free_member_count_exceeded: Optional[bool]
