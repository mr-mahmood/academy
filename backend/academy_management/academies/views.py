# apps/academies/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import Academy
from .serializers import AcademySerializer
from authentication.permissions import IsAdmin
from core.exceptions import APIError, AcademyError


class AcademyAPIView(APIView):
    """
    Combined view for Academy CRUD operations:
    - GET: List all academies or retrieve single academy
    - POST: Create new academy (admin only)
    - PUT: Update academy (admin only)
    - DELETE: Delete academy (admin only)
    """
    def get_authenticators(self):
        if self.request.method == 'GET':
            return []
        # Use default authenticators for all other methods
        return super().get_authenticators()
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]
    
    def get(self, request, pk=None):
        if pk:
            # Get single academy
            try:
                academy = Academy.get_academy(pk)
            except Academy.DoesNotExist:
                raise APIError(AcademyError.ACADEMY_NOT_EXIST)
            
            serializer = AcademySerializer(academy)
            return Response({
                "message": "Academy retrieved successfully",
                "academy": serializer.data
            }, status=status.HTTP_200_OK)
        else:
            # List all active academies
            academies = Academy.objects.all()
            serializer = AcademySerializer(academies, many=True)
            return Response({
                "message": "Academies retrieved successfully",
                "academies": serializer.data,
            }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """Create a new academy with validation"""
        serializer = AcademySerializer(data=request.data)
        
        # Validate and raise error if invalid
        serializer.is_valid(raise_exception=True)
        
        # If we get here, validation passed
        academy = serializer.save()
        return Response({
            "message": "Academy created successfully",
            "academy": AcademySerializer(academy).data
        }, status=status.HTTP_201_CREATED)
    
    def put(self, request, pk):
        """Update an existing academy with validation"""
        try:
            academy = Academy.objects.get(pk=pk)
        except Academy.DoesNotExist:
            raise APIError(AcademyError.ACADEMY_NOT_EXIST)
        
        serializer = AcademySerializer(academy, data=request.data, partial=True)
        
        # Validate and raise error if invalid
        serializer.is_valid(raise_exception=True)
        
        # If we get here, validation passed
        updated_academy = serializer.save()
        return Response({
            "message": "Academy updated successfully",
            "academy": AcademySerializer(updated_academy).data
        }, status=status.HTTP_200_OK)
    
    def delete(self, request, pk):
        """Delete an academy"""
        try:
            academy = Academy.objects.get(pk=pk)
        except Academy.DoesNotExist:
            raise APIError(AcademyError.ACADEMY_NOT_EXIST)

        academy.delete()
        
        return Response({
            "message": "Academy deleted successfully"
        }, status=status.HTTP_200_OK)