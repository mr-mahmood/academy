from django.contrib.admin import AdminSite
from django.apps import apps

class GroupedAdminSite(AdminSite):
    site_header = "My Admin"
    site_title = "My Admin Portal"
    
    def get_app_list(self, request):
        """Manually build the admin menu"""
        
        menu = [
            {
                'name': 'User Management',
                'apps': ['users'],
            },
            {
                'name': 'Academy Management',
                'apps': ['academy_sports', 'academy_academies', 'academy_courses', 'academy_enrollment', 'academy_payment'],
                'model_order': [
                    'Sport',
                    'Academy', 
                    'Course',
                    'CourseSchedule',
                    'Enrollment',
                    'Payment'
                ]
            },
            {
                'name': 'Football Talent',
                'apps': ['football_academies', 'football_courses', 'football_enrollment', 'football_payment'],
                'model_order': [
                    'FootballAcademy',
                    'FootballCourse',
                    'FootballEnrollment',
                    'FootballPayment'
                ]
            }
        ]
        
        app_list = []
        
        for group in menu:
            group_data = {
                'name': group['name'],
                'app_label': group['name'].lower().replace(' ', '_'),
                'models': []
            }
            
            # Collect all models first
            all_models = []
            
            for app_label in group['apps']:
                try:
                    app_config = apps.get_app_config(app_label)
                    for model in app_config.get_models():
                        opts = model._meta
                        model_lower = opts.model_name
                        
                        # Use verbose_name_plural if available
                        display_name = str(opts.verbose_name_plural) if opts.verbose_name_plural else model.__name__
                        
                        all_models.append({
                            'name': display_name,
                            'object_name': model.__name__,
                            'sort_key': model.__name__,  # Will be overridden by model_order
                            'perms': {
                                'add': request.user.has_perm(f'{app_label}.add_{model_lower}'),
                                'change': request.user.has_perm(f'{app_label}.change_{model_lower}'),
                                'delete': request.user.has_perm(f'{app_label}.delete_{model_lower}'),
                                'view': request.user.has_perm(f'{app_label}.view_{model_lower}'),
                            },
                            'admin_url': f'/admin/{app_label}/{model_lower}/',
                            'add_url': f'/admin/{app_label}/{model_lower}/add/',
                        })
                except LookupError:
                    pass
            
            # Sort models according to custom order
            if 'model_order' in group and group['model_order']:
                # Create order mapping
                order_map = {model_name: index for index, model_name in enumerate(group['model_order'])}
                
                # Sort by custom order, then by name for any not in the list
                all_models.sort(key=lambda x: order_map.get(x['object_name'], len(order_map) + 1))
            else:
                # Default alphabetical sort
                all_models.sort(key=lambda x: x['name'])
            
            group_data['models'] = all_models
            
            if group_data['models']:
                app_list.append(group_data)
        
        return app_list

# Create admin site instance
admin_site = GroupedAdminSite(name='myadmin')