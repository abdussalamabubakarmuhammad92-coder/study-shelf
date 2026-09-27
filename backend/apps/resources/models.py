from django.conf import settings
from django.db import models

from apps.faculties.models import Department


class Resource(models.Model):
    FILE_TYPES = [
        ('pdf', 'PDF'),
        ('docx', 'DOCX'),
        ('pptx', 'PPTX'),
        ('txt', 'Text'),
        ('image', 'Image'),
        ('other', 'Other'),
    ]

    title = models.CharField(max_length=200)
    course_code = models.CharField(max_length=20, blank=True)  # e.g. CSC301
    description = models.TextField(blank=True)

    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='resources')

    file = models.FileField(upload_to='resources/%Y/%m/')
    file_name = models.CharField(max_length=255)  # original filename
    file_type = models.CharField(max_length=10, choices=FILE_TYPES, default='other')
    file_size = models.PositiveBigIntegerField(default=0)  # bytes

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='uploaded_resources',
    )
    upload_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    download_count = models.PositiveIntegerField(default=0)
    rating_sum = models.PositiveIntegerField(default=0)
    rating_count = models.PositiveIntegerField(default=0)

    is_approved = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)

    class Meta:
        ordering = ['-upload_date']

    def __str__(self):
        return self.title

    @property
    def average_rating(self):
        if self.rating_count == 0:
            return 0
        return round(self.rating_sum / self.rating_count, 2)

    @property
    def faculty(self):
        return self.department.faculty

    def increment_download(self):
        self.download_count += 1
        self.save(update_fields=['download_count'])

    def add_rating(self, value: int):
        """value: 1 for an upvote."""
        self.rating_sum += value
        self.rating_count += 1
        self.save(update_fields=['rating_sum', 'rating_count'])

    @staticmethod
    def detect_file_type(filename: str) -> str:
        ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
        mapping = {
            'pdf': 'pdf', 'docx': 'docx', 'doc': 'docx', 'pptx': 'pptx', 'ppt': 'pptx',
            'txt': 'txt',
            'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 'webp': 'image',
        }
        return mapping.get(ext, 'other')
