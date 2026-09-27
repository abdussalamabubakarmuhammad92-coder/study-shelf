from django.db import models


class Faculty(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)  # lucide-react icon name on the frontend

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'faculties'

    def __str__(self):
        return self.name


class Department(models.Model):
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=100)
    slug = models.SlugField()

    class Meta:
        ordering = ['name']
        unique_together = ['faculty', 'slug']

    def __str__(self):
        return f"{self.faculty.name} — {self.name}"
