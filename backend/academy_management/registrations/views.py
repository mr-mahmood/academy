from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from users.models import User
from .models import Enrollment
from .serializers import EnrollmentSerializer
from authentication.permissions import IsAdmin
from core.exceptions import APIError, RegistrationError


class EnrollmentAPIView(APIView):
    """
    Enrollment operations:
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
            enrollment = Enrollment.get_enrollment(pk, user)
            
            if enrollment.user != user:
                raise APIError(RegistrationError.ENROLLMENT_ACCESS_DENIED)
            
            serializer = EnrollmentSerializer(enrollment)
            return Response({
                "message": "Enrollment retrieved successfully",
                "enrollment": serializer.data
            }, status=status.HTTP_200_OK)
        else:
            # List enrollments with eager loading
            base_queryset = Enrollment.objects.select_related(
                'user',
                'course',
                'course__sport',
                'course__academy',
                'payment'
            )
            
            # TODO: when admin panel developed we need to add another auth part to return all of the list in admin instead of singel user
            # if user.role == User.Role.ADMIN:
            #     enrollments = base_queryset.all()
            #     message = "All enrollments retrieved successfully"
            # else:
            #     enrollments = base_queryset.filter(user=user)
            #     message = "Your enrollments retrieved successfully"
            enrollments = base_queryset.filter(user=user)
            message = "Your enrollments retrieved successfully"
            
            serializer = EnrollmentSerializer(enrollments, many=True)
            return Response({
                "message": message,
                "enrollments": serializer.data,
            }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """Register for a course"""
        course_id = request.data.get('course_id')
        
        if not course_id:
            raise APIError(RegistrationError.COURSE_REQUIRED)
        
        # Create enrollment for the logged-in user
        enrollment = Enrollment(
            user=request.user,
            course_id=course_id
        )
        enrollment.save()
        
        serializer = EnrollmentSerializer(enrollment)
        return Response({
            "message": "Successfully registered for the course. Please complete payment.",
            "enrollment": serializer.data
        }, status=status.HTTP_201_CREATED)
    
    def put(self, request, pk):
        """Update enrollment (admin only)"""
        user: User = request.user
        if user.role != User.Role.ADMIN:
            raise APIError(RegistrationError.ENROLLMENT_ACCESS_DENIED)
        
        enrollment = Enrollment.get_enrollment(pk)
        
        # Update enrollment status
        new_status = request.data.get('enrollment_status')
        if new_status:
            enrollment.enrollment_status = new_status
            if new_status == Enrollment.EnrollmentStatus.CANCELLED:
                enrollment.cancelled_at = timezone.now()
            enrollment.save()
        
        serializer = EnrollmentSerializer(enrollment)
        return Response({
            "message": "Enrollment updated successfully",
            "enrollment": serializer.data
        }, status=status.HTTP_200_OK)
        
    def delete(self, request, pk):
        enrollment = Enrollment.get_enrollment(pk)
        
        if enrollment.user != request.user:
            raise APIError(RegistrationError.ENROLLMENT_ACCESS_DENIED)
        
        enrollment.delete()
        
        return Response({
            "message": "Enrollment cancelled successfully"
        }, status=status.HTTP_200_OK)