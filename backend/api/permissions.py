from rest_framework import permissions

class IsOwnerOrAdminOrReadOnly(permissions.BasePermission):
    """
    Niestandardowe uprawnienia:
    - Zezwalaj na CZYTANIE (GET) każdemu.
    - Zezwalaj na PISANIE (PUT, PATCH, DELETE) tylko jeśli:
        1. Użytkownik jest administratorem (is_staff).
        2. Użytkownik jest właścicielem obiektu (obj.created_by == request.user).
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if request.user.is_staff:
            return True
        
        return obj.created_by == request.user