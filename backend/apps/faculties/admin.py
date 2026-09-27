from django.contrib import admin

from .models import Department, Faculty


@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'department_count')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}

    @admin.display(description='Departments')
    def department_count(self, obj):
        return obj.departments.count()


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'faculty', 'slug')
    list_filter = ('faculty',)
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}
