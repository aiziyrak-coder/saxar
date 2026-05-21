from rest_framework import permissions


class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view) -> bool:
        u = request.user
        return bool(u and u.is_authenticated and getattr(u, "role", None) == "admin")


class IsStaffRole(permissions.BasePermission):
    """Admin, buxgalter, ombor, ishlab chiqarish."""

    STAFF = frozenset({"admin", "accountant", "warehouse", "production"})

    def has_permission(self, request, view) -> bool:
        u = request.user
        return bool(u and u.is_authenticated and getattr(u, "role", None) in self.STAFF)


class IsOrderWriteRole(permissions.BasePermission):
    """Buyurtmani tahrirlash/o‘chirish: faqat admin va buxgalter."""

    WRITE_ROLES = frozenset({"admin", "accountant"})

    def has_permission(self, request, view) -> bool:
        u = request.user
        return bool(u and u.is_authenticated and getattr(u, "role", None) in self.WRITE_ROLES)


class IsPaymentWriteRole(permissions.BasePermission):
    """To‘lov yozish: xodimlar, agent va haydovchi."""

    WRITE_ROLES = frozenset({"admin", "accountant", "agent", "driver"})

    def has_permission(self, request, view) -> bool:
        u = request.user
        return bool(u and u.is_authenticated and getattr(u, "role", None) in self.WRITE_ROLES)


class IsCatalogReadOrStaffWrite(permissions.BasePermission):
    """Katalog o‘qish hammaga; yozish faqat xodimlar."""

    STAFF = IsStaffRole.STAFF

    def has_permission(self, request, view) -> bool:
        if request.method in permissions.SAFE_METHODS:
            return True
        u = request.user
        return bool(u and u.is_authenticated and getattr(u, "role", None) in self.STAFF)
