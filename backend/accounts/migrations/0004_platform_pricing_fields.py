from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_platform_settings"),
    ]

    operations = [
        migrations.AddField(
            model_name="platformsettings",
            name="default_b2b_markup_percent",
            field=models.PositiveIntegerField(default=15),
        ),
        migrations.AddField(
            model_name="platformsettings",
            name="credit_limit_new_client",
            field=models.PositiveIntegerField(default=5_000_000),
        ),
        migrations.AddField(
            model_name="platformsettings",
            name="credit_limit_trusted_client",
            field=models.PositiveIntegerField(default=50_000_000),
        ),
    ]
