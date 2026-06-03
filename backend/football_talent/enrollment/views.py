from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from users.models import User
from .models import FootballEnrollment
from .serializers import FootballEnrollmentSerializer
from authentication.permissions import IsAdmin
from core.exceptions import APIError, RegistrationError
from football_talent.courses.models import FootballCourse


class FootballEnrollmentAPIView(APIView):
    """
    Football Enrollment operations:
    - GET: List user's enrollments (authenticated users)
    - POST: Create enrollment (authenticated users)
    - PUT: Update enrollment (admin only)
    - DELETE: Cancel enrollment (authenticated users - their own)
    """
    
    def get_permissions(self):
        if self.request.method == 'PUT':
            return [IsAdmin()]
        else:
            return [IsAuthenticated()]
    
    def get(self, request, pk=None):
        """Get user's enrollments (users can only see their own)"""
        user: User = request.user
        if pk:
            # Get single enrollment
            enrollment = FootballEnrollment.get_enrollment(pk, user)
            
            if enrollment.user != user:
                raise APIError(RegistrationError.FOOTBALL_ENROLLMENT_NOT_FOUND)
            
            serializer = FootballEnrollmentSerializer(enrollment)
            return Response({
                "message": "Football enrollment retrieved successfully",
                "enrollment": serializer.data
            }, status=status.HTTP_200_OK)
        else:
            # List enrollments with eager loading
            base_queryset = FootballEnrollment.objects.select_related(
                'user',
                'course',
                'course__academy'
            )
            
            enrollments = base_queryset.filter(user=user)
            message = "Your football enrollments retrieved successfully"
            
            serializer = FootballEnrollmentSerializer(enrollments, many=True)
            return Response({
                "message": message,
                "enrollments": serializer.data,
            }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """Register for a football course/test"""
        course_id = request.data.get('course_id')
        
        if not course_id:
            raise APIError(RegistrationError.FOOTBALL_COURSE_REQUIRED)
        
        # Check if course exists
        try:
            course = FootballCourse.objects.get(id=course_id)
        except FootballCourse.DoesNotExist:
            raise APIError(RegistrationError.FOOTBALL_COURSE_NOT_FOUND)
        
        # Create enrollment for the logged-in user
        enrollment = FootballEnrollment(
            user=request.user,
            course=course
        )
        enrollment.save()
        
        serializer = FootballEnrollmentSerializer(enrollment)
        return Response({
            "message": "Successfully registered for the football test. Please complete payment.",
            "enrollment": serializer.data
        }, status=status.HTTP_201_CREATED)
    
    def put(self, request, pk):
        """Update enrollment (admin only)"""
        user: User = request.user
        if user.role != User.Role.ADMIN:
            raise APIError(RegistrationError.FOOTBALL_ENROLLMENT_NOT_FOUND)
        
        enrollment = FootballEnrollment.get_enrollment(pk)
        
        # Update enrollment status
        new_status = request.data.get('enrollment_status')
        if new_status:
            enrollment.enrollment_status = new_status
            if new_status == FootballEnrollment.EnrollmentStatus.CANCELLED:
                enrollment.cancelled_at = timezone.now()
            enrollment.save()
        
        serializer = FootballEnrollmentSerializer(enrollment)
        return Response({
            "message": "Football enrollment updated successfully",
            "enrollment": serializer.data
        }, status=status.HTTP_200_OK)
        
    def delete(self, request, pk):
        enrollment = FootballEnrollment.get_enrollment(pk)
        
        if enrollment.user != request.user:
            raise APIError(RegistrationError.FOOTBALL_ENROLLMENT_NOT_FOUND)
        
        enrollment.delete()
        
        return Response({
            "message": "Football enrollment cancelled successfully"
        }, status=status.HTTP_200_OK)