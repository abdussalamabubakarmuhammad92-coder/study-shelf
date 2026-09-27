from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

router = DefaultRouter()
router.register(r'admin/resources', views.AdminResourceViewSet, basename='admin-resources')

urlpatterns = [
    # Public browsing
    path('faculties/', views.faculty_list, name='faculty-list'),
    path('resources/', views.ResourceListCreateView.as_view(), name='resource-list'),
    path('resources/<int:pk>/', views.ResourceDetailView.as_view(), name='resource-detail'),
    path('resources/<int:pk>/download/', views.resource_download, name='resource-download'),
    path('resources/<int:pk>/rate/', views.resource_rate, name='resource-rate'),

    # Auth
    path('auth/login/', TokenObtainPairView.as_view(), name='auth-login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('auth/register/', views.RegisterView.as_view(), name='auth-register'),
    path('auth/me/', views.me, name='auth-me'),
    path('auth/password-reset/validate/', views.password_reset_validate, name='password-reset-validate'),
    path('auth/password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),

    # Contributor self-service
    path('me/uploads/', views.MyUploadsView.as_view(), name='my-uploads'),

    # Invites
    path('invites/', views.InviteListCreateView.as_view(), name='invite-list'),
    path('invites/validate/', views.invite_validate, name='invite-validate'),
    path('invites/<int:pk>/revoke/', views.InviteRevokeView.as_view(), name='invite-revoke'),

    # Admin contributor management
    path('admin/contributors/', views.ContributorListView.as_view(), name='admin-contributors'),
    path('admin/contributors/<int:pk>/', views.ContributorDetailView.as_view(), name='admin-contributor-detail'),
    path('admin/users/<int:user_id>/reset-password/', views.AdminResetPasswordView.as_view(), name='admin-reset-password'),

    # Admin
    path('admin/stats/', views.admin_stats, name='admin-stats'),

    # Admin ViewSet (admin/resources/...)
    path('', include(router.urls)),
]
