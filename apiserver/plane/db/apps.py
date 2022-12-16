from django.apps import AppConfig
from fieldsignals import post_save_changed


class DbConfig(AppConfig):
    name = "plane.db"

    def ready(self):

        post_save_changed.connect(
            self.model_activity,
            sender=self.get_model("Issue"),
        )

    def model_activity(self, sender, instance, changed_fields, **kwargs):

        verb = "created" if instance._state.adding else "changed"

        import inspect

        for frame_record in inspect.stack():
            if frame_record[3] == "get_response":
                request = frame_record[0].f_locals["request"]
                REQUEST_METHOD = request.method

        if REQUEST_METHOD == "POST":

            self.get_model("IssueActivity").objects.create(
                issue=instance, project=instance.project, actor=instance.created_by
            )

        elif REQUEST_METHOD == "PATCH":

            try:
                del changed_fields["updated_at"]
                del changed_fields["updated_by"]
            except KeyError as e:
                pass

            for field_name, (old, new) in changed_fields.items():
                field = field_name
                old_value = old
                new_value = new
                self.get_model("IssueActivity").objects.create(
                    issue=instance,
                    verb=verb,
                    field=field,
                    old_value=old_value,
                    new_value=new_value,
                    project=instance.project,
                    actor=instance.updated_by,
                )
