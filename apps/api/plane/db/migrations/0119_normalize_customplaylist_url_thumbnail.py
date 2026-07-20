from urllib.parse import unquote, urlparse

from django.db import migrations


def get_last_path_segment(value):
    normalized_value = (value or "").strip()
    if not normalized_value:
        return normalized_value

    parsed_value = urlparse(normalized_value)
    path_value = parsed_value.path if parsed_value.scheme or parsed_value.netloc else normalized_value
    return unquote(path_value.replace("\\", "/").rstrip("/").split("/")[-1]).strip() or normalized_value


def normalize_custom_playlist_files(apps, schema_editor):
    CustomPlaylist = apps.get_model("db", "CustomPlaylist")

    for playlist in CustomPlaylist.objects.all().only("id", "url", "thumbnail").iterator():
        normalized_url = get_last_path_segment(playlist.url)
        normalized_thumbnail = get_last_path_segment(playlist.thumbnail) if playlist.thumbnail else playlist.thumbnail

        update_fields = []
        if normalized_url != playlist.url:
            playlist.url = normalized_url
            update_fields.append("url")
        if normalized_thumbnail != playlist.thumbnail:
            playlist.thumbnail = normalized_thumbnail
            update_fields.append("thumbnail")

        if update_fields:
            playlist.save(update_fields=update_fields)


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0118_alter_customplaylist_url_thumbnail"),
    ]

    operations = [
        migrations.RunPython(normalize_custom_playlist_files, migrations.RunPython.noop),
    ]
