import { apiClient } from "@shared/api/client"

export const catalogApi = {
  grades: async () => (await apiClient.get("/catalog/grades/")).data,
  examTypes: async () => (await apiClient.get("/catalog/exam-types/")).data,
  subjects: async () => (await apiClient.get("/catalog/subjects/")).data,
  courses: async (subjectId?: number) =>
    (await apiClient.get("/catalog/courses/", { params: subjectId ? { subject_id: subjectId } : {} })).data,
  /** Eski Course->Topic hiyerarşisi (course-topics) */
  courseTopics: async (params?: { subjectId?: number; courseId?: number }) =>
    (await apiClient.get("/catalog/course-topics/", {
      params: {
        ...(params?.subjectId ? { subject_id: params.subjectId } : {}),
        ...(params?.courseId ? { course_id: params.courseId } : {}),
      },
    })).data,
  /** Yeni LessonCategory->Unit->Topic hiyerarşisi */
  lessonCategories: async () => (await apiClient.get("/catalog/lesson-categories/")).data,
  units: async (lessonCategoryId?: number) =>
    (await apiClient.get("/catalog/units/", {
      params: lessonCategoryId ? { lesson_category_id: lessonCategoryId } : {},
    })).data,
  topics: async (params?: { unitId?: number; lessonCategoryId?: number }) =>
    (await apiClient.get("/catalog/topics/", {
      params: {
        ...(params?.unitId ? { unit_id: params.unitId } : {}),
        ...(params?.lessonCategoryId ? { lesson_category_id: params.lessonCategoryId } : {}),
      },
    })).data,
}
