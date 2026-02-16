from django.contrib import admin
from .models import Grade, GradeLevel, ExamType, Subject, LessonCategory, Unit, LessonTopic, Course, Topic


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ("label", "code", "order", "is_active")
    list_filter = ("is_active",)
    search_fields = ("label", "code")


@admin.register(ExamType)
class ExamTypeAdmin(admin.ModelAdmin):
    list_display = ("label", "code", "order", "is_active")
    list_filter = ("is_active",)
    search_fields = ("label", "code")


@admin.register(GradeLevel)
class GradeLevelAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "kind", "order", "is_active")
    list_filter = ("kind", "is_active")
    search_fields = ("name", "code")
    readonly_fields = ("code",)


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("label", "code", "order", "is_active")
    list_filter = ("is_active",)
    search_fields = ("label", "code")
    readonly_fields = ("code",)


@admin.register(LessonCategory)
class LessonCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "grade_level", "is_active")
    list_filter = ("is_active", "grade_level")
    search_fields = ("name",)


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ("name", "lesson_category", "order", "is_active")
    list_filter = ("is_active", "lesson_category")
    search_fields = ("name", "lesson_category__name")


@admin.register(LessonTopic)
class LessonTopicAdmin(admin.ModelAdmin):
    list_display = ("name", "lesson_category", "unit", "order", "is_active")
    list_filter = ("is_active", "lesson_category")
    search_fields = ("name", "unit__name", "lesson_category__name")


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("label", "code", "subject", "order", "is_active")
    list_filter = ("is_active", "subject")
    search_fields = ("label", "code", "subject__label")


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "order", "is_active")
    list_filter = ("is_active", "course", "course__subject")
    search_fields = ("title", "course__label", "course__subject__label")
