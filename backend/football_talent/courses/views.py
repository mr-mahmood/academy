from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.db.models import Q
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
    
    def get_queryset(self, academy_id=None, position=None, age_category=None):
        """Optimized queryset for courses"""
        queryset = FootballCourse.objects.select_related('academy')
        
        if academy_id:
            queryset = queryset.filter(academy_id=academy_id)
        
        if position:
            queryset = queryset.filter(position=position)
        
        if age_category:
            queryset = queryset.filter(age_category=age_category)
        
        return queryset
    
    def get(self, request, pk=None, academy_id=None):
        if pk:
            # Get single course
            try:
                course = FootballCourse.get_course(pk)
            except FootballCourse.DoesNotExist:
                raise APIError(ClassError.FOOTBALL_COURSE_NOT_EXIST)
            
            serializer = FootballCourseSerializer(course)
            return Response({
                "message": "Football course retrieved successfully",
                "course": serializer.data
            }, status=status.HTTP_200_OK)
        
        elif academy_id:
            # Get courses for specific academy
            try:
                from football_talent.academies.models import FootballAcademy
                academy = FootballAcademy.objects.get(id=academy_id)
            except FootballAcademy.DoesNotExist:
                raise APIError(ClassError.FOOTBALL_ACADEMY_NOT_EXIST)
            
            courses = self.get_queryset(academy_id=academy_id)
            serializer = FootballCourseSerializer(courses, many=True)
            return Response({
                "message": f"Courses for academy {academy.name} retrieved successfully",
                "courses": serializer.data,
                "count": courses.count()
            }, status=status.HTTP_200_OK)
        
        else:
            # List all courses with filters
            filters = Q()
            
            # Filter by status if provided
            status_filter = request.query_params.get('status')
            if status_filter:
                if status_filter not in [choice[0] for choice in FootballCourse.Status.choices]:
                    raise APIError(ClassError.INVALID_STATUS)
                filters &= Q(status=status_filter)
            
            # Filter by age category if provided
            age_filter = request.query_params.get('age_category')
            if age_filter:
                if age_filter not in [choice[0] for choice in FootballCourse.AgeCategory.choices]:
                    raise APIError(ClassError.INVALID_AGE_CATEGORY)
                filters &= Q(age_category=age_filter)
            
            # Filter by position if provided
            position_filter = request.query_params.get('position')
            if position_filter:
                if position_filter not in [choice[0] for choice in FootballCourse.Position.choices]:
                    raise APIError(ClassError.INVALID_POSITION)
                filters &= Q(position=position_filter)
            
            # Only show active courses for public (non-admin)
            if not request.user.is_authenticated or not request.user.is_staff:
                filters &= Q(status=FootballCourse.Status.ACTIVE)
            
            courses = self.get_queryset().filter(filters)
            serializer = FootballCourseSerializer(courses, many=True)
            return Response({
                "message": "Football courses retrieved successfully",
                "courses": serializer.data,
                "count": courses.count()
            }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """Create a new football course"""
        serializer = FootballCourseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = serializer.save()
        
        return Response({
            "message": "Football course created successfully",
            "course": FootballCourseSerializer(course).data
        }, status=status.HTTP_201_CREATED)
    
    def put(self, request, pk):
        """Update an existing football course"""
        try:
            course = FootballCourse.objects.get(pk=pk)
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
        """Delete a football course"""
        try:
            course = FootballCourse.objects.get(pk=pk)
        except FootballCourse.DoesNotExist:
            raise APIError(ClassError.FOOTBALL_COURSE_NOT_EXIST)
        
        # Check if there are enrollments
        if course.current_participants > 0:
            raise APIError(ClassError.COURSE_HAS_ENROLLMENTS)
        
        course.delete()
        return Response({
            "message": "Football course deleted successfully"
        }, status=status.HTTP_200_OK)