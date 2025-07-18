import strawberry


@strawberry.type
class TimezoneListType:
    value: str
    query: str
    label: str
