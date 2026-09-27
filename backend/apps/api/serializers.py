from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.faculties.models import Department, Faculty
from apps.invites.models import InviteToken
from apps.resources.models import Resource

User = get_user_model()


class DepartmentSerializer(serializers.ModelSerializer):
    resource_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Department
        fields = ['id', 'name', 'slug', 'resource_count']


class FacultySerializer(serializers.ModelSerializer):
    departments = DepartmentSerializer(many=True, read_only=True)
    resource_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Faculty
        fields = ['id', 'name', 'slug', 'description', 'icon', 'resource_count', 'departments']


class ResourceListSerializer(serializers.ModelSerializer):
    faculty_name = serializers.CharField(source='department.faculty.name', read_only=True)
    faculty_slug = serializers.CharField(source='department.faculty.slug', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    department_slug = serializers.CharField(source='department.slug', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)

    class Meta:
        model = Resource
        fields = [
            'id', 'title', 'course_code', 'description',
            'faculty_name', 'faculty_slug', 'department_name', 'department_slug',
            'file_type', 'file_name', 'file_size',
            'upload_date', 'download_count',
            'average_rating', 'rating_count', 'is_featured',
            'uploaded_by_name',
        ]


class ResourceDetailSerializer(ResourceListSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta(ResourceListSerializer.Meta):
        fields = ResourceListSerializer.Meta.fields + ['file_url', 'updated_date']

    def get_file_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get('request')
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url


class ResourceEditSerializer(serializers.ModelSerializer):
    """Contributor/admin metadata edits — never file or department."""

    class Meta:
        model = Resource
        fields = ['title', 'description', 'course_code']


class ResourceUploadSerializer(serializers.Serializer):
    """Accepts one or more files plus shared metadata for a batch upload."""

    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all())
    course_code = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    description = serializers.CharField(required=False, allow_blank=True, default='')
    files = serializers.ListField(child=serializers.FileField(), allow_empty=False)

    def validate_files(self, files):
        max_size = 50 * 1024 * 1024  # 50MB
        for f in files:
            if f.size > max_size:
                raise serializers.ValidationError(f'"{f.name}" exceeds the 50MB limit.')
        return files


class InviteSerializer(serializers.ModelSerializer):
    used_by_name = serializers.SerializerMethodField()

    class Meta:
        model = InviteToken
        fields = ['id', 'token', 'note', 'created_at', 'expires_at', 'is_used',
                  'is_revoked', 'used_by', 'used_by_name', 'used_at']
        read_only_fields = ['token', 'created_at', 'expires_at', 'is_used',
                            'used_by', 'used_at']

    def get_used_by_name(self, obj):
        if obj.used_by:
            return obj.used_by.full_name or obj.used_by.username
        return None


class InviteValidateSerializer(serializers.Serializer):
    token = serializers.CharField()


class RegisterSerializer(serializers.Serializer):
    token = serializers.CharField()
    username = serializers.CharField(max_length=150)
    full_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), required=False, allow_null=True)


class ContributorSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', default=None, read_only=True)
    upload_count = serializers.IntegerField(read_only=True)
    downloads_earned = serializers.IntegerField(read_only=True)
    upvotes_earned = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'email', 'department_name',
                  'date_joined', 'is_active_contributor',
                  'upload_count', 'downloads_earned', 'upvotes_earned']


class ContributorUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['is_active_contributor']


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(min_length=8, write_only=True)


class UserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField()
    full_name = serializers.CharField()
    role = serializers.CharField()
    department_name = serializers.SerializerMethodField()

    def get_department_name(self, obj):
        return obj.department.name if obj.department else None

    def to_representation(self, instance):
        # Works with the Portal User model
        return {
            'id': instance.id,
            'username': instance.username,
            'email': instance.email,
            'full_name': instance.full_name or instance.get_full_name(),
            'role': instance.role,
            'department_name': instance.department.name if instance.department else None,
        }
