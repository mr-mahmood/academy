# backend/admin.py
from django.contrib.admin import AdminSite
from django.contrib import admin
from django.apps import apps

class GroupedAdminSite(AdminSite):
    site_header = "My Admin"
    site_title = "My Admin Portal"
    
    def get_app_list(self, request):
        """Manually build the admin menu"""
        
        # Define exactly what models go where
        menu = [
            {
                'name': 'Academy Management',
                'models': [
                    ('sports', 'Sport'),
                    ('academies', 'Academy'),
                    ('courses', 'Course'),
                    ('courses', 'CourseSchedule'),
                    ('enrollment', 'Enrollment'),
                    ('payment', 'Payment'),
                ]
            },
            {
                'name': 'User Management',
                'models': [
                    ('users', 'User'),
                ]
            }
        ]
        
        # Build the app list from the menu
        app_list = []
        
        for group in menu:
            group_data = {
                'name': group['name'],
                'app_label': group['name'].lower().replace(' ', '_'),
                'models': []
            }
            
            for app_name, model_name in group['models']:
                try:
                    model = apps.get_model(app_name, model_name)
                    if model:
                        opts = model._meta
                        model_lower = model_name.lower()
                        group_data['models'].append({
                            'name': model_name,
                            'object_name': model_name,
                            'perms': {
                                'add': request.user.has_perm(f'{app_name}.add_{model_lower}'),
                                'change': request.user.has_perm(f'{app_name}.change_{model_lower}'),
                                'delete': request.user.has_perm(f'{app_name}.delete_{model_lower}'),
                                'view': request.user.has_perm(f'{app_name}.view_{model_lower}'),
                            },
                            'admin_url': f'/admin/{app_name}/{model_lower}/',
                            'add_url': f'/admin/{app_name}/{model_lower}/add/',
                        })
                except LookupError:
                    pass
            
            if group_data['models']:
                app_list.append(group_data)
        
        return app_list

# Create admin site instance
admin_site = GroupedAdminSite(name='myadmin')