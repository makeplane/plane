from enum import Enum

from pydantic import BaseModel




class IssueTypeModel(BaseModel):
    display: str
    in_use: str = 'icon'
    icon: dict
    is_default: bool = False
