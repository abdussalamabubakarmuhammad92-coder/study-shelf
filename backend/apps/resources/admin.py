from django.contrib import admin

from .models import Resource


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'course_code', 'department', 'file_type', 'download_count',
        'average_rating', 'upload_date', 'is_featured', 'is_approved',
    )
    list_filter = ('file_type', 'is_featured', 'is_approved', 'department__faculty')
    search_fields = ('title', 'course_code', 'file_name')
    list_editable = ('is_featured', 'is_approved')
    readonly_fields = ('download_count', 'rating_sum', 'rating_count', 'file_size')
