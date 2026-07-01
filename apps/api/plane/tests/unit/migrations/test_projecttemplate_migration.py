import importlib

from plane.app.serializers.project_template import BUILT_IN_PROJECT_TEMPLATES


class _FakeManager:
    def __init__(self):
        self.calls = []

    def update_or_create(self, **kwargs):
        self.calls.append(kwargs)
        return object(), True


class _FakeProjectTemplate:
    objects = _FakeManager()


class _FakeApps:
    def get_model(self, app_label, model_name):
        assert app_label == "db"
        assert model_name == "ProjectTemplate"
        return _FakeProjectTemplate


def test_seed_builtin_project_templates_uses_current_fixture_shape():
    _FakeProjectTemplate.objects = _FakeManager()
    migration = importlib.import_module("plane.db.migrations.0122_projecttemplate")

    migration.seed_builtin_project_templates(_FakeApps(), None)

    calls = _FakeProjectTemplate.objects.calls
    assert len(calls) == len(BUILT_IN_PROJECT_TEMPLATES)
    assert [call["system_key"] for call in calls] == [
        entry["system_key"] for entry in BUILT_IN_PROJECT_TEMPLATES
    ]
    for call, entry in zip(calls, BUILT_IN_PROJECT_TEMPLATES):
        defaults = call["defaults"]
        assert defaults["name"] == entry["name"]
        assert defaults["description"] == entry["description"]
        assert defaults["template_type"] == entry["template_type"]
        assert defaults["payload"] == entry["payload"]
