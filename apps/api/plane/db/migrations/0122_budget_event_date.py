from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [("db", "0121_alter_estimate_type")]
    operations = [
        migrations.AddField(model_name="project", name="event_date",
            field=models.DateField(blank=True, null=True, verbose_name="Event Date")),
        migrations.AddField(model_name="project", name="budget_total",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True, verbose_name="Budget Total")),
        migrations.AddField(model_name="issue", name="budget_estimated",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True, verbose_name="Budget Estimated")),
        migrations.AddField(model_name="issue", name="budget_actual",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True, verbose_name="Budget Actual")),
    ]