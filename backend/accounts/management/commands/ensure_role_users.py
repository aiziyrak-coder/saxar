"""Demo / prod rol akkauntlari — Firebase telefonlari bilan Django JWT mosligi."""
from django.core.management.base import BaseCommand

from accounts.models import User, UserRoles

ROLE_ACCOUNTS = [
    ("admin", "+998900000101", "DevRole_Admin!", "Demo Admin"),
    ("accountant", "+998900000102", "DevRole_Accountant!", "Demo Buxgalter"),
    ("warehouse", "+998900000103", "DevRole_Warehouse!", "Demo Ombor"),
    ("production", "+998900000104", "DevRole_Production!", "Demo Ishlab chiqarish"),
    ("b2b", "+998900000105", "DevRole_B2B!", "Demo B2B"),
    ("agent", "+998900000106", "DevRole_Agent!", "Demo Agent"),
    ("driver", "+998900000107", "DevRole_Driver!", "Demo Haydovchi"),
]


def phone_to_username(phone: str) -> str:
    digits = "".join(c for c in phone if c.isdigit())
    return f"{digits}@saxar.local"


class Command(BaseCommand):
    help = "Rol bo‘yicha Django foydalanuvchilarni yaratadi/yangilaydi (JWT + Telegram)."

    def handle(self, *args, **options):
        for role, phone, password, name in ROLE_ACCOUNTS:
            username = phone_to_username(phone)
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": username,
                    "role": role,
                    "phone": phone,
                    "first_name": name,
                    "is_active": True,
                },
            )
            if role == UserRoles.ADMIN and not user.is_superuser:
                user.is_superuser = True
                user.is_staff = True
            user.role = role
            user.phone = phone
            user.set_password(password)
            user.save()
            action = "yaratildi" if created else "yangilandi"
            self.stdout.write(self.style.SUCCESS(f"{role}: {username} — {action}"))
