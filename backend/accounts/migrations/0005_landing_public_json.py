from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0004_platform_pricing_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="platformsettings",
            name="landing_public_json",
            field=models.TextField(blank=True, default=""),
        ),
    ]
