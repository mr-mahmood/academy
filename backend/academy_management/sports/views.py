from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import Sport
from .serializers import SportSerializer
from authentication.permissions import IsAdmin
from core.exceptions import APIError, SportError


class SportAPIView(APIView):
    """
    Combined view for Sport CRUD operations:
    - GET: List all sports or retrieve single sport
    - POST: Create new sport (admin only)
    - DELETE: Delete sport (superuser only)
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
            # Get single sport
            sport = Sport.get_sport(id=pk)
            serializer = SportSerializer(sport)
            return Response({
                "message": "Sport retrieved successfully",
                "sport": serializer.data
            }, status=status.HTTP_200_OK)
        else:
            # List all sports
            sports = Sport.objects.all()
            serializer = SportSerializer(sports, many=True)
            return Response({
                "message": "Sports retrieved successfully",
                "sports": serializer.data,
            }, status=status.HTTP_200_OK)
    
    def post(self, request):
        serializer = SportSerializer(data=request.data)
        
        if serializer.is_valid():
            sport = serializer.save()
            return Response({
                "message": "Sport created successfully",
                "sport": SportSerializer(sport).data
            }, status=status.HTTP_201_CREATED)
    
    def delete(self, request, pk):
        """Handle DELETE requests - soft delete or hard delete"""
        try:
            sport = Sport.objects.get(pk=pk)
        except Sport.DoesNotExist:
            raise APIError(SportError.SPORT_NOT_EXIST)
        
        sport.delete()
        
        return Response({
            "message": "Sport deleted successfully"
        }, status=status.HTTP_200_OK)