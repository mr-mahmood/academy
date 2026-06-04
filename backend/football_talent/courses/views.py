from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.db.models import QuerySet
from typing import Optional
from .models import FootballCourse
from .serializers import FootballCourseSerializer
from authentication.permissions import IsAdmin
from core.exceptions import APIError, ClassError


class FootballCourseAPIView(APIView):
    """
    Combined view for Football Course CRUD operations
    """
    
    def get_authenticators(self):
        if self.request.method == 'GET':
            return []
        return super().get_authenticators()
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]
    
    def get_queryset(self, academy_id=None):
        """Optimized queryset to avoid N+1 queries"""
        queryset = FootballCourse.objects.select_related('academy')
        
        if academy_id is not None:
            queryset = queryset.filter(academy_id=academy_id)
        
        return queryset
    
    def get(self, request, pk=None, academy_id=None):
        if pk is not None:
            try:
                course = self.get_queryset().get(pk=pk)
            except FootballCourse.DoesNotExist:
                raise APIError(ClassError.FOOTBALL_COURSE_NOT_EXIST)
            
            serializer = FootballCourseSerializer(course)
            return Response({
                "message": "Football course retrieved successfully",
                "course": serializer.data
            }, status=status.HTTP_200_OK)
        
        elif academy_id is not None:
            courses = self.get_queryset(academy_id=academy_id)
            serializer = FootballCourseSerializer(courses, many=True)
            return Response({
                "message": f"Courses for academy {academy_id} retrieved successfully",
                "courses": serializer.data
            }, status=status.HTTP_200_OK)
        
        else:
            courses = self.get_queryset()
            serializer = FootballCourseSerializer(courses, many=True)
            return Response({
                "message": "All football courses retrieved successfully",
                "courses": serializer.data
            }, status=status.HTTP_200_OK)
    
    def post(self, request):
        serializer = FootballCourseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = serializer.save()
        
        return Response({
            "message": "Football course created successfully",
            "course": FootballCourseSerializer(course).data
        }, status=status.HTTP_201_CREATED)
    
    def put(self, request, pk):
        try:
            course = self.get_queryset().get(pk=pk)
        except FootballCourse.DoesNotExist:
            raise APIError(ClassError.FOOTBALL_COURSE_NOT_EXIST)
        
        serializer = FootballCourseSerializer(course, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_course = serializer.save()
        
        return Response({
            "message": "Football course updated successfully",
            "course": FootballCourseSerializer(updated_course).data
        }, status=status.HTTP_200_OK)
    
    def delete(self, request, pk):
        try:
            course = FootballCourse.objects.get(pk=pk)
        except FootballCourse.DoesNotExist:
            raise APIError(ClassError.FOOTBALL_COURSE_NOT_EXIST)
        
        course.delete()
        return Response({
            "message": "Football course deleted successfully"
        }, status=status.HTTP_200_OK)