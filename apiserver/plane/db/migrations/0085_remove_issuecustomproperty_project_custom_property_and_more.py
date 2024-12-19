# Generated by Django 4.2.16 on 2024-11-13 11:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('db', '0084_projectcustomproperty_issuecustomproperty_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='issuecustomproperty',
            name='project_custom_property',
        ),
        migrations.AddField(
            model_name='projectcustomproperty',
            name='issue_type',
            field=models.ManyToManyField(related_name='custom_propery_issue_type', to='db.issuetype'),
        ),
    ]