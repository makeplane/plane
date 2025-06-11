# Third party imports
from enum import Enum


class Roles(Enum):
    ADMIN = 20
    MEMBER = 15
    GUEST = 5

    def __str__(self):
        return self.name.lower()
