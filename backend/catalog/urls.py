from rest_framework.routers import DefaultRouter
from .views import (
    GradeLevelViewSet,
    GradeViewSet,
    ExamTypeViewSet,
    SubjectViewSet,
    LessonCategoryViewSet,
    UnitViewSet,
    LessonTopicViewSet,
    CourseViewSet,
    TopicViewSet,
)

router = DefaultRouter()
router.register("grade-levels", GradeLevelViewSet, basename="grade-levels")
router.register("grades", GradeViewSet, basename="grades")
router.register("exam-types", ExamTypeViewSet, basename="exam-types")
router.register("subjects", SubjectViewSet, basename="subjects")
router.register("lesson-categories", LessonCategoryViewSet, basename="lesson-categories")
router.register("units", UnitViewSet, basename="units")
router.register("topics", LessonTopicViewSet, basename="topics")
router.register("courses", CourseViewSet, basename="courses")
router.register("course-topics", TopicViewSet, basename="course-topics")

urlpatterns = router.urls
