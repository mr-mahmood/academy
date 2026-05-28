from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.db.models import QuerySet
from typing import Optional, cast
from .models import Course, CourseSchedule
from .serializers import CourseSerializer, CourseScheduleSerializer
from authentication.permissions import IsAdmin
from core.exceptions import APIError, ClassError, UserAccountError


class CourseAPIView(APIView):
    """
    Combined view for Course CRUD operations
    """
    
    def get_authenticators(self):
        if self.request.method == 'GET':
            return []
        return super().get_authenticators()
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]
    
    def get_queryset(self, academy_id: Optional[int] = None) -> QuerySet:
        """Optimized queryset to avoid N+1 queries"""
        queryset = Course.objects.select_related(
            'sport',
            'academy'
        ).prefetch_related('schedule')
        
        if academy_id is not None:
            queryset = queryset.filter(academy_id=academy_id)
        
        return queryset
    
    def get(self, request, pk: Optional[int] = None, academy_id: Optional[int] = None):
        if pk is not None:
            try:
                course = self.get_queryset().get(pk=pk)
            except Course.DoesNotExist:
                raise APIError(ClassError.CLASS_NOT_EXIST)
            
            serializer = CourseSerializer(course)
            return Response({
                "message": "Course retrieved successfully",
                "course": serializer.data
            }, status=status.HTTP_200_OK)
        
        elif academy_id is not None:
            courses = self.get_queryset(academy_id=academy_id)
            serializer = CourseSerializer(courses, many=True)
            return Response({
                "message": f"Courses for academy {academy_id} retrieved successfully",
                "courses": serializer.data
            }, status=status.HTTP_200_OK)
        
        else:
            courses = self.get_queryset()
            serializer = CourseSerializer(courses, many=True)
            return Response({
                "message": "All courses retrieved successfully",
                "courses": serializer.data
            }, status=status.HTTP_200_OK)
    
    def post(self, request):
        serializer = CourseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = cast(Course, serializer.save())
        
        # 🔥 FIX: Store the ID first, then use it
        course_id = course.pk
        course = self.get_queryset().get(pk=course_id)
        
        return Response({
            "message": "Course created successfully",
            "course": CourseSerializer(course).data
        }, status=status.HTTP_201_CREATED)
    
    def put(self, request, pk: int):
        try:
            course = self.get_queryset().get(pk=pk)
        except Course.DoesNotExist:
            raise APIError(ClassError.CLASS_NOT_EXIST)
        
        serializer = CourseSerializer(course, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_course = cast(Course, serializer.save())
        
        # 🔥 FIX: Store the ID first, then use it
        course_id = updated_course.pk
        updated_course = self.get_queryset().get(pk=course_id)
        
        return Response({
            "message": "Course updated successfully",
            "course": CourseSerializer(updated_course).data
        }, status=status.HTTP_200_OK)
    
    def delete(self, request, pk: int):
        try:
            course = Course.objects.get(pk=pk)
        except Course.DoesNotExist:
            raise APIError(ClassError.CLASS_NOT_EXIST)
        
        course.delete()
        return Response({
            "message": "Course deleted successfully"
        }, status=status.HTTP_200_OK)


class CourseScheduleAPIView(APIView):
    """
    Complete CRUD for Course Schedule operations
    """
    
    def get_authenticators(self):
        if self.request.method == 'GET':
            return []
        return super().get_authenticators()
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]
    
    def get_queryset(self, course_id: Optional[int] = None) -> QuerySet:
        """Optimized queryset for CourseSchedule"""
        queryset = CourseSchedule.objects.select_related('course')
        
        if course_id is not None:
            queryset = queryset.filter(course_id=course_id)
        
        return queryset
    
    def get(self, request, course_id: Optional[int] = None, pk: Optional[int] = None):
        if course_id is not None:
            schedules = self.get_queryset(course_id=course_id)
            serializer = CourseScheduleSerializer(schedules, many=True)
            return Response({
                "message": "Course schedules retrieved successfully",
                "schedules": serializer.data
            }, status=status.HTTP_200_OK)
        
        elif pk is not None:
            try:
                schedule = self.get_queryset().get(pk=pk)
            except CourseSchedule.DoesNotExist:
                raise APIError(ClassError.SCHEDULE_NOT_FOUND)
            
            serializer = CourseScheduleSerializer(schedule)
            return Response({
                "message": "Schedule retrieved successfully",
                "schedule": serializer.data
            }, status=status.HTTP_200_OK)
        
        else:
            if not request.user.is_admin:  # type: ignore
                raise APIError(UserAccountError.FORBIDDEN_ACTION)
            
            schedules = self.get_queryset()
            serializer = CourseScheduleSerializer(schedules, many=True)
            return Response({
                "message": "All schedules retrieved successfully",
                "schedules": serializer.data
            }, status=status.HTTP_200_OK)
    
    def post(self, request, course_id: int):
        """Create a new schedule for a course"""
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            raise APIError(ClassError.CLASS_NOT_EXIST)
        
        serializer = CourseScheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        schedule = cast(CourseSchedule, serializer.save(course=course))
        
        # 🔥 FIX: Store the ID first, then use it
        schedule_id = schedule.pk
        schedule = self.get_queryset().get(pk=schedule_id)
        
        return Response({
            "message": "Schedule created successfully",
            "schedule": CourseScheduleSerializer(schedule).data
        }, status=status.HTTP_201_CREATED)
    
    def put(self, request, course_id: int, pk: int):
        """Update a specific schedule"""
        try:
            schedule = self.get_queryset().get(pk=pk, course_id=course_id)
        except CourseSchedule.DoesNotExist:
            raise APIError(ClassError.SCHEDULE_NOT_FOUND)
        
        serializer = CourseScheduleSerializer(schedule, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_schedule = cast(CourseSchedule, serializer.save())
        
        # 🔥 FIX: Store the ID first, then use it
        schedule_id = updated_schedule.pk
        updated_schedule = self.get_queryset().get(pk=schedule_id)
        
        return Response({
            "message": "Schedule updated successfully",
            "schedule": CourseScheduleSerializer(updated_schedule).data
        }, status=status.HTTP_200_OK)
    
    def delete(self, request, course_id: int, pk: int):
        """Delete a specific schedule"""
        try:
            schedule = CourseSchedule.objects.get(pk=pk, course_id=course_id)
        except CourseSchedule.DoesNotExist:
            raise APIError(ClassError.SCHEDULE_NOT_FOUND)
        
        schedule.delete()
        
        return Response({
            "message": "Schedule deleted successfully"
        }, status=status.HTTP_200_OK)