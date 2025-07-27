# python imports
from dataclasses import dataclass, field

# Strawberry imports
import strawberry


@strawberry.input
@dataclass
class PasswordInputType:
    password: str = field(compare=False, repr=False)
