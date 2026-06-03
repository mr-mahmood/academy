from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import FootballAcademy
from .serializers import FootballAcademySerializer
from authentication.permissions import IsAdmin
from core.exceptions import APIError, AcademyError


class FootballAcademyAPIView(APIView):
    """
    Combined view for Football Academy CRUD operations:
    - GET: List all football academies or retrieve single academy
    - POST: Create new football academy (admin only)
    - PUT: Update football academy (admin only)
    - DELETE: Delete football academy (admin only)
    """
    def get_authenticators(self):
        if self.request.method == 'GET':
            return []
        return super().get_authenticators()
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]
    
    def get(self, request, pk=None):
        if pk:
            # Get single football academy
            try:
                academy = FootballAcademy.get_football_academy(pk)
            except FootballAcademy.DoesNotExist:
                raise APIError(AcademyError.ACADEMY_NOT_EXIST)
            
            serializer = FootballAcademySerializer(academy)
            return Response({
                "message": "Football academy retrieved successfully",
                "academy": serializer.data
            }, status=status.HTTP_200_OK)
        else:
            # List all active football academies
            academies = FootballAcademy.objects.all()
            serializer = FootballAcademySerializer(academies, many=True)
            return Response({
                "message": "Football academies retrieved successfully",
                "academies": serializer.data,
            }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """Create a new football academy with validation"""
        serializer = FootballAcademySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        academy = serializer.save()
        return Response({
            "message": "Football academy created successfully",
            "academy": FootballAcademySerializer(academy).data
        }, status=status.HTTP_201_CREATED)
    
    def put(self, request, pk):
        """Update an existing football academy with validation"""
        try:
            academy = FootballAcademy.objects.get(pk=pk)
        except FootballAcademy.DoesNotExist:
            raise APIError(AcademyError.ACADEMY_NOT_EXIST)
        
        serializer = FootballAcademySerializer(academy, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_academy = serializer.save()
        return Response({
            "message": "Football academy updated successfully",
            "academy": FootballAcademySerializer(updated_academy).data
        }, status=status.HTTP_200_OK)
    
    def delete(self, request, pk):
        """Delete a football academy"""
        try:
            academy = FootballAcademy.objects.get(pk=pk)
        except FootballAcademy.DoesNotExist:
            raise APIError(AcademyError.ACADEMY_NOT_EXIST)

        academy.delete()
        
        return Response({
            "message": "Football academy deleted successfully"
        }, status=status.HTTP_200_OK)