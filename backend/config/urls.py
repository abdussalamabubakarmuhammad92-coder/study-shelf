from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve as static_serve
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.core.views import spa_index

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.api.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='api-schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='api-schema'), name='api-docs'),
]

# Media is served by Django in all modes for now (single-server v1):
# whitenoise only covers /static, and uploaded files must remain reachable
# for the in-browser reader and downloads. Revisit behind Nginx later.
urlpatterns += [
    path('media/<path:path>', static_serve, {'document_root': settings.MEDIA_ROOT}),
]

# SPA catch-all: any unknown path (deep links like /resource/5) renders the
# React app. Placed last so admin/api/media/static win first.
urlpatterns += [re_path(r'^.*$', spa_index, name='spa-index')]
