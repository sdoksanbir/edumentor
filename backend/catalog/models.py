from django.db import models
from django.db.models import F, Q
from django.utils.text import slugify


def _make_unique_slug(base: str, model_class, field_name: str = "code"):
    """base'tan unique code üret (-2, -3 ekleyerek)."""
    base = base[:50]  # max_length
    if not base:
        base = "x"
    codes = set(
        model_class.objects.values_list(field_name, flat=True)
    )
    if base not in codes:
        return base
    for i in range(2, 9999):
        candidate = f"{base}-{i}"
        if candidate not in codes:
            return candidate
    return f"{base}-{hash(base) % 10000}"  # fallback


class BaseLookup(models.Model):
    code = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=120)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True
        ordering = ["order", "label"]

    def __str__(self):
        return self.label


class Grade(BaseLookup):
    """
    9. Sınıf, 10. Sınıf, ...
    code örn: G9, G10
    """
    pass


class ExamType(BaseLookup):
    """
    YKS, LGS...
    code örn: YKS, LGS
    """
    pass


class Subject(BaseLookup):
    """
    Branş: Matematik öğretmeni, Rehberlik öğretmeni vb.
    TeacherProfile.branch burada.
    code: otomatik slugify ile üretilir, readonly.
    """
    order = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta(BaseLookup.Meta):
        ordering = [F("order").asc(nulls_last=True), "created_at"]

    def save(self, *args, **kwargs):
        if not self.code or not self.code.strip():
            base = slugify(self.label or "x").replace("-", "_")[:50]
            self.code = _make_unique_slug(base, Subject)
        super().save(*args, **kwargs)


class GradeLevel(models.Model):
    """
    Sınıf düzeyleri ve sınav türleri: 1. Sınıf, LGS, YKS, TYT, AYT vb.
    """
    KIND_CLASS = "CLASS"
    KIND_EXAM = "EXAM"
    KIND_OTHER = "OTHER"
    KIND_CHOICES = [
        (KIND_CLASS, "Sınıf"),
        (KIND_EXAM, "Sınav"),
        (KIND_OTHER, "Diğer"),
    ]

    name = models.CharField(max_length=120)
    code = models.SlugField(max_length=50, unique=True, blank=True)
    kind = models.CharField(max_length=20, choices=KIND_CHOICES, default=KIND_CLASS)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = [F("order").asc(nulls_last=True), "name", "created_at"]
        verbose_name = "Sınıf Düzeyi"
        verbose_name_plural = "Sınıf Düzeyleri"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.code or not self.code.strip():
            base = slugify(self.name or "x")[:50]
            self.code = _make_unique_slug(base, GradeLevel)
        super().save(*args, **kwargs)


class LessonCategory(models.Model):
    """
    Dersler (müfredat dersi): Matematik, Fizik, Kimya vb.
    grade_level zorunludur; aynı grade_level içinde name tekil.
    """
    grade_level = models.ForeignKey(
        GradeLevel,
        on_delete=models.PROTECT,
        related_name="lesson_categories",
    )
    name = models.CharField(max_length=120)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = [F("order").asc(nulls_last=True), "name", "created_at"]
        verbose_name = "Ders"
        verbose_name_plural = "Dersler"
        constraints = [
            models.UniqueConstraint(
                fields=["grade_level", "name"],
                name="uniq_lesson_per_grade",
            ),
        ]

    def __str__(self):
        return self.name


class Unit(models.Model):
    """
    Ünite: LessonCategory altında. Örn: Problemler (Matematik altında)
    """
    lesson_category = models.ForeignKey(
        LessonCategory, on_delete=models.CASCADE, related_name="units"
    )
    name = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["lesson_category", F("order").asc(nulls_last=True), "created_at"]
        unique_together = ("lesson_category", "name")

    def __str__(self):
        return f"{self.lesson_category.name} - {self.name}"


class LessonTopic(models.Model):
    """
    Konu: lesson_category zorunlu, unit opsiyonel.
    unit verilirse unit.lesson_category == lesson_category olmalı.
    """
    lesson_category = models.ForeignKey(
        LessonCategory, on_delete=models.CASCADE, related_name="topics"
    )
    unit = models.ForeignKey(
        Unit, on_delete=models.CASCADE, related_name="topics",
        null=True, blank=True
    )
    name = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["lesson_category", F("order").asc(nulls_last=True), "created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["unit", "name"],
                condition=Q(unit__isnull=False),
                name="lessontopic_unique_unit_name",
            ),
            models.UniqueConstraint(
                fields=["lesson_category", "name"],
                condition=Q(unit__isnull=True),
                name="lessontopic_unique_lc_name_when_unit_null",
            ),
        ]

    def __str__(self):
        if self.unit:
            return f"{self.unit.name} - {self.name}"
        return f"{self.lesson_category.name} (ünitesiz) - {self.name}"


class Course(BaseLookup):
    """
    Ders: (Subject altında) örn Geometri, TYT Matematik vs.
    """
    subject = models.ForeignKey(Subject, on_delete=models.PROTECT, related_name="courses")


class Topic(models.Model):
    """
    Ders konuları: Course altında konu listesi (eski hiyerarşi)
    """
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="topics")
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "title"]
        unique_together = ("course", "title")

    def __str__(self):
        return f"{self.course.label} - {self.title}"
