# football_talent/enrollments/views.py
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
            enrollment = FootballEnrollment.get_enrollment(pk, user)
            
            if enrollment.user != user:
                raise APIError(RegistrationError.FOOTBALL_ENROLLMENT_NOT_FOUND)
            
            serializer = FootballEnrollmentSerializer(enrollment)
            return Response({
                "message": "Football enrollment retrieved successfully",
                "enrollment": serializer.data
            }, status=status.HTTP_200_OK)
        else:
            base_queryset = FootballEnrollment.objects.select_related(
                'user',
                'course',
                'course__academy'
            )
            
            enrollments = base_queryset.filter(
                user=user,
                enrollment_status=FootballEnrollment.EnrollmentStatus.CONFIRMED
            )
            
            serializer = FootballEnrollmentSerializer(enrollments, many=True)
            return Response({
                "message": "Your football enrollments retrieved successfully",
                "enrollments": serializer.data,
            }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """Register for a football test by position (age category auto-detected)"""
        position = request.data.get('position')
        academy_id = request.data.get('academy_id')
        gender_requirement = request.data.get('gender_requirement', 'MALE')
        
        if not position:
            raise APIError(RegistrationError.FOOTBALL_POSITION_REQUIRED)
        
        if not academy_id:
            raise APIError(RegistrationError.FOOTBALL_ACADEMY_REQUIRED)
        
        # Find or create the course (without age category)
        course, created = FootballCourse.objects.get_or_create(
            academy_id=academy_id,
            position=position,
            gender_requirement=gender_requirement,
        )
        
        # Check for existing enrollment
        existing_enrollment = FootballEnrollment.objects.filter(
            user=request.user, 
            course=course
        ).first()
        
        # If enrollment exists and is in WAITING_FOR_PAYMENT state, return it
        if existing_enrollment:
            if existing_enrollment.enrollment_status in [FootballEnrollment.EnrollmentStatus.WAITING_FOR_PAYMENT, FootballEnrollment.EnrollmentStatus.CANCELLED]:
                serializer = FootballEnrollmentSerializer(existing_enrollment)
                return Response({
                    "message": "You already have a pending enrollment for this test. Please complete payment.",
                    "enrollment": serializer.data
                }, status=status.HTTP_200_OK)
            else:
                raise APIError(RegistrationError.FOOTBALL_COURSE_ALREADY_ENROLLED)
        
        # Create new enrollment
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