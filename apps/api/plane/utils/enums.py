from enum import Enum

from pydantic import BaseModel


class IssueType(Enum):
    BUG = {"icon": {"name": "Bug", "color": "#8e0119", "background_color": "#FFFFFF"}, "in_use": "icon",
           'display': '缺陷'}
    TASK = {"icon": {"name": "Layers", "color": "#6796ff", "background_color": "#FFFFFF"},
            "in_use": "icon", 'display': '任务'}
    EPIC = {"icon": {"name": "Layers", "color": "#6796ff", "background_color": "#FFFFFF"},
            "in_use": "icon", 'display': '史诗'}
    FEATURE = {"icon": {"name": "Layers", "color": "#6796ff", "background_color": "#FFFFFF"},
               "in_use": "icon", 'display': '特性'}
    STORY = {"icon": {"name": "Layers", "color": "#6796ff", "background_color": "#FFFFFF"},
             "in_use": "icon", 'display': '用户故事'}
