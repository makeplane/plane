from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("license", "0007_ai_provider_profiles"),
    ]

    operations = [
        migrations.AlterField(
            model_name="aiproviderprofile",
            name="protocol",
            field=models.CharField(
                choices=[
                    ("openai_compatible", "OpenAI-compatible"),
                    ("anthropic_messages", "Anthropic Messages"),
                ],
                default="openai_compatible",
                max_length=32,
            ),
        ),
    ]
