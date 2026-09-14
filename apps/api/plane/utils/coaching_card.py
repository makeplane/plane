COACHING_CARD_CATEGORY = "Coaching Card"
COACHING_CARD_KIND = "coaching_card"


def is_coaching_card_event_data(event_data):
    return isinstance(event_data, dict) and event_data.get("category") == COACHING_CARD_CATEGORY
