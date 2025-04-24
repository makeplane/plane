from enum import Enum


class ImporterType(str, Enum):
    JIRA = "JIRA"
    ASANA = "ASANA"
    LINEAR = "LINEAR"
    JIRA_SERVER = "JIRA_SERVER"
    GITHUB = "GITHUB"
    GITLAB = "GITLAB"
    SLACK = "SLACK"


class IntegrationType(str, Enum):
    GITHUB = "GITHUB"
    GITLAB = "GITLAB"
    SLACK = "SLACK"
