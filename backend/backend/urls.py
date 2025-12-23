from django.contrib import admin
from django.urls import path
from users.api import router as users_router
from scans.api import router as scans_router
from ninja_extra import NinjaExtraAPI
from ninja_jwt.controller import NinjaJWTDefaultController

api = NinjaExtraAPI(title="PixureByte API", version="1.1", docs_url=None)
api.register_controllers(NinjaJWTDefaultController)

api.add_router("/users/", users_router)
api.add_router("/scans/", scans_router)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),
]
