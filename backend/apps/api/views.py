from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Sum
from django.http import FileResponse
from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.faculties.models import Department, Faculty
from apps.invites.models import InviteToken, PasswordResetToken
from apps.resources.models import Resource

from .permissions import IsAuthenticatedContributor, IsOwnerOrAdmin, IsPortalAdmin
from .serializers import (
    ContributorSerializer, ContributorUpdateSerializer, FacultySerializer,
    InviteSerializer, PasswordResetConfirmSerializer, RegisterSerializer,
    ResourceDetailSerializer, ResourceEditSerializer, ResourceListSerializer,
    ResourceUploadSerializer, UserSerializer,
)

User = get_user_model()


# ---------------------------------------------------------------- faculties

@api_view(['GET'])
@permission_classes([AllowAny])
def faculty_list(request):
    faculties = Faculty.objects.prefetch_related('departments').annotate(
        resource_count=Count('departments__resources'),
    )
    data = FacultySerializer(faculties, many=True, context={'request': request}).data
    return Response(data)


# ---------------------------------------------------------------- resources

class ResourceListCreateView(generics.ListCreateAPIView):
    """GET: public browsing with faculty/department/search filters.
    POST: batch upload (authenticated contributors only)."""

    def get_permissions(self):
        return [IsAuthenticatedContributor()] if self.request.method == 'POST' else []

    def get_serializer_class(self):
        return ResourceUploadSerializer if self.request.method == 'POST' \
            else ResourceListSerializer

    def get_queryset(self):
        qs = Resource.objects.filter(is_approved=True).select_related(
            'department', 'department__faculty', 'uploaded_by',
        )
        params = self.request.query_params
        faculty = params.get('faculty')
        department = params.get('department')
        search = params.get('search')
        featured = params.get('featured')

        if faculty:
            qs = qs.filter(department__faculty__slug=faculty)
        if department:
            qs = qs.filter(department__slug=department)
        if featured == 'true':
            qs = qs.filter(is_featured=True)
        if search:
            qs = qs.filter(
                Q(title__icontains=search)
                | Q(course_code__icontains=search)
                | Q(file_name__icontains=search)
                | Q(description__icontains=search)
            )
        return qs

    def create(self, request, *args, **kwargs):
        serializer = ResourceUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        created = []
        for f in data['files']:
            resource = Resource.objects.create(
                title=f.name.rsplit('.', 1)[0].replace('_', ' ').replace('-', ' ').strip()
                      or f.name,
                course_code=data.get('course_code', '').upper(),
                description=data.get('description', ''),
                department=data['department'],
                file=f,
                file_name=f.name,
                file_type=Resource.detect_file_type(f.name),
                file_size=f.size,
                uploaded_by=request.user,
            )
            created.append(resource)
        return Response(
            ResourceListSerializer(created, many=True, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class ResourceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET is public; PATCH/DELETE require the uploader or a portal admin."""

    queryset = Resource.objects.select_related('department', 'department__faculty', 'uploaded_by')
    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.request.method in ('PATCH', 'DELETE'):
            return [IsOwnerOrAdmin()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.request.method == 'PATCH':
            return ResourceEditSerializer
        return ResourceDetailSerializer

    def perform_destroy(self, instance):
        # remove the stored file along with the row — no orphans
        instance.file.delete(save=False)
        instance.delete()


class MyUploadsView(generics.ListAPIView):
    """The contributor dashboard feed: own resources with stats."""

    serializer_class = ResourceListSerializer
    permission_classes = [IsAuthenticatedContributor]

    def get_queryset(self):
        return Resource.objects.filter(uploaded_by=self.request.user).select_related(
            'department', 'department__faculty')


@api_view(['POST'])
@permission_classes([AllowAny])
def resource_download(request, pk):
    """Increment the counter and stream the file as an attachment."""
    try:
        resource = Resource.objects.get(pk=pk, is_approved=True)
    except Resource.DoesNotExist:
        return Response({'detail': 'Resource not found.'}, status=404)

    resource.increment_download()
    try:
        return FileResponse(resource.file.open('rb'), as_attachment=True,
                            filename=resource.file_name)
    except FileNotFoundError:
        return Response({'detail': 'File is missing on the server.'}, status=404)


@api_view(['POST'])
@permission_classes([AllowAny])
def resource_rate(request, pk):
    """Upvote a resource. Anti-spam is enforced client-side via localStorage."""
    try:
        resource = Resource.objects.get(pk=pk, is_approved=True)
    except Resource.DoesNotExist:
        return Response({'detail': 'Resource not found.'}, status=404)

    resource.add_rating(1)
    return Response({
        'id': resource.id,
        'average_rating': resource.average_rating,
        'rating_count': resource.rating_count,
    })


# ---------------------------------------------------------------- auth

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        invite = InviteToken.objects.filter(token=data['token']).first()
        if not invite or not invite.is_valid():
            return Response({'detail': 'This invite link is invalid, expired, or already used.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username__iexact=data['username']).exists():
            return Response({'detail': 'That username is already taken.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email__iexact=data['email']).exists():
            return Response({'detail': 'An account with that email already exists.'},
                            status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            full_name=data['full_name'],
            role='contributor',
            department=data.get('department'),
        )
        invite.use(user)

        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


# ---------------------------------------------------------------- invites

class InviteListCreateView(generics.ListCreateAPIView):
    serializer_class = InviteSerializer
    permission_classes = [IsPortalAdmin]

    def get_queryset(self):
        return InviteToken.objects.select_related('created_by', 'used_by')

    def perform_create(self, serializer):
        invite = InviteToken.generate(created_by=self.request.user,
                                      note=self.request.data.get('note', ''))
        serializer.instance = invite

    def create(self, request, *args, **kwargs):
        invite = InviteToken.generate(created_by=request.user,
                                      note=request.data.get('note', ''))
        return Response(InviteSerializer(invite).data, status=status.HTTP_201_CREATED)


class InviteRevokeView(APIView):
    """Kill an unused invite link from the SPA (used ones stay as records)."""

    permission_classes = [IsPortalAdmin]

    def post(self, request, pk):
        invite = InviteToken.objects.filter(pk=pk).first()
        if not invite:
            return Response({'detail': 'Invite not found.'}, status=status.HTTP_404_NOT_FOUND)
        if invite.is_used:
            return Response({'detail': 'Used invites cannot be revoked.'},
                            status=status.HTTP_400_BAD_REQUEST)
        invite.is_revoked = True
        invite.save()
        return Response(InviteSerializer(invite).data)


# ---------------------------------------------------------------- admin contributors

class ContributorListView(generics.ListAPIView):
    """Contributor roster with earned stats for the admin dashboard."""

    serializer_class = ContributorSerializer
    permission_classes = [IsPortalAdmin]

    def get_queryset(self):
        return User.objects.filter(role='contributor').annotate(
            upload_count=Count('uploaded_resources', distinct=True),
            downloads_earned=Sum('uploaded_resources__download_count'),
            upvotes_earned=Sum('uploaded_resources__rating_count'),
        )


class ContributorDetailView(generics.RetrieveUpdateAPIView):
    """PATCH toggles is_active_contributor (the contributor kill switch)."""

    queryset = User.objects.filter(role='contributor')
    permission_classes = [IsPortalAdmin]

    def get_serializer_class(self):
        if self.request.method == 'PATCH':
            return ContributorUpdateSerializer
        return ContributorSerializer


class AdminResetPasswordView(APIView):
    """Generate a one-time /reset/{token} link for a user (no email)."""

    permission_classes = [IsPortalAdmin]

    def post(self, request, user_id):
        user = User.objects.filter(pk=user_id).first()
        if not user:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        token = PasswordResetToken.generate(user=user, created_by=request.user)
        return Response({'token': token.token, 'expires_at': token.expires_at},
                        status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def password_reset_validate(request):
    """Public: the /reset/{token} page checks the token before showing the form."""
    token = request.query_params.get('token', '')
    prt = PasswordResetToken.objects.filter(token=token).first()
    if prt and prt.is_valid():
        return Response({'valid': True, 'username': prt.user.username})
    return Response({'valid': False}, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        prt = PasswordResetToken.objects.filter(token=serializer.validated_data['token']).first()
        if not prt or not prt.is_valid():
            return Response({'detail': 'This reset link is invalid or has expired.'},
                            status=status.HTTP_400_BAD_REQUEST)
        prt.user.set_password(serializer.validated_data['password'])
        prt.user.save()
        prt.use()
        return Response({'detail': 'Password updated. You can now log in.'})


@api_view(['GET'])
@permission_classes([AllowAny])
def invite_validate(request):
    """Public: the /invite/:token page checks the token before showing the form."""
    token = request.query_params.get('token', '')
    invite = InviteToken.objects.filter(token=token).first()
    if invite and invite.is_valid():
        return Response({'valid': True, 'note': invite.note,
                         'expires_at': invite.expires_at})
    return Response({'valid': False}, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------- admin

class AdminResourceViewSet(viewsets.ModelViewSet):
    """Full management access for portal admins (includes unapproved items)."""
    queryset = Resource.objects.select_related('department', 'department__faculty')
    serializer_class = ResourceDetailSerializer
    permission_classes = [IsPortalAdmin]
    search_fields = ['title', 'course_code']

    def perform_destroy(self, instance):
        # remove the stored file along with the row — no orphans
        instance.file.delete(save=False)
        instance.delete()

    def get_queryset(self):
        qs = super().get_queryset()
        faculty = self.request.query_params.get('faculty')
        department = self.request.query_params.get('department')
        search = self.request.query_params.get('search')
        if faculty:
            qs = qs.filter(department__faculty__slug=faculty)
        if department:
            qs = qs.filter(department__slug=department)
        if search:
            qs = qs.filter(
                Q(title__icontains=search) | Q(course_code__icontains=search)
                | Q(file_name__icontains=search)
            )
        return qs


@api_view(['GET'])
@permission_classes([IsPortalAdmin])
def admin_stats(request):
    total_resources = Resource.objects.count()
    total_downloads = Resource.objects.aggregate(s=Sum('download_count'))['s'] or 0
    total_ratings = Resource.objects.aggregate(s=Sum('rating_count'))['s'] or 0
    return Response({
        'total_resources': total_resources,
        'total_downloads': total_downloads,
        'total_ratings': total_ratings,
        'total_contributors': User.objects.filter(role='contributor').count(),
        'active_invites': InviteToken.objects.filter(is_used=False, is_revoked=False).count(),
        'faculty_count': Faculty.objects.count(),
        'department_count': Department.objects.count(),
        'by_faculty': list(
            Faculty.objects.annotate(resource_count=Count('departments__resources'))
            .values('name', 'resource_count')
        ),
        'top_downloaded': list(
            Resource.objects.order_by('-download_count').values('title', 'download_count')[:5]
        ),
    })
