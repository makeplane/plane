from django.conf import settings

APPLICATIONS = {
    "github_enterprise": {
        "key": "github_enterprise",
        "name": "Github Enterprise Server",
        "slug": "github-enterprise",
        "short_description": "Github Enterprise Server Integration",
        "description_html": "<p>Github Enterprise Server Integration</p>",
        "redirect_uris": f"{settings.SILO_URL}/api/oauth/github-enterprise/plane-oauth/callback",
    },
    "github": {
        "key": "github",
        "name": "Github",
        "slug": "github",
        "short_description": "Github Integration",
        "description_html": "<p>Github Integration</p>",
        "redirect_uris": f"{settings.SILO_URL}/api/github/plane-oauth/callback",
    },
    "gitlab": {
        "key": "gitlab",
        "name": "Gitlab",
        "slug": "gitlab",
        "short_description": "Gitlab Integration",
        "description_html": "<p>Gitlab Integration</p>",
        "redirect_uris": f"{settings.SILO_URL}/api/gitlab/plane-oauth/callback",
    },
    "slack": {
        "key": "slack",
        "name": "Slack",
        "slug": "slack",
        "short_description": "Slack Integration",
        "description_html": "<p>Slack Integration</p>",
        "redirect_uris": f"{settings.SILO_URL}/api/slack/plane-oauth/callback",
    },
    "importer": {
        "key": "importer",
        "name": "Importer",
        "slug": "importer",
        "short_description": "Importer",
        "description_html": "<p>Importer</p>",
        "redirect_uris": f"{settings.SILO_URL}/api/importer/plane-oauth/callback",
    }
}
