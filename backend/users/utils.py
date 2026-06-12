import pandas as pd
from django.http import HttpResponse
from django.utils import timezone
from io import BytesIO


class UserExcelExportService:
    """Service for exporting user data to Excel"""
    
    @staticmethod
    def export_users_to_excel(queryset, filename=None):
        """
        Export users to Excel with one sheet
        
        Args:
            queryset: User queryset to export
            filename: Custom filename (optional)
        
        Returns:
            HttpResponse with Excel file
        """
        if filename is None:
            timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
            filename = f"export_users_{timestamp}.xlsx"
        
        # Create Excel file
        output = BytesIO()
        
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            # Create dataframe and write to sheet
            users_df = UserExcelExportService._create_users_dataframe(queryset)
            users_df.to_excel(writer, sheet_name='کاربران', index=False)
            
            # Format the worksheet
            UserExcelExportService._format_worksheet(writer)
        
        # Create response
        output.seek(0)
        response = HttpResponse(
            output,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
    
    @staticmethod
    def _create_users_dataframe(queryset):
        """Create DataFrame for users with Persian headers"""
        data = []
        
        for user in queryset:
            # Calculate age from birth date
            age = None
            if user.birth_date:
                today = timezone.now().date()
                age = today.year - user.birth_date.year
                if (today.month, today.day) < (user.birth_date.month, user.birth_date.day):
                    age -= 1
            
            data.append({
                'شناسه': user.id,
                'نام کامل': user.full_name,
                'شماره موبایل': user.phone_number,
                'کد ملی': user.national_id,
                'جنسیت': user.get_gender_display(),
                'تاریخ تولد': user.birth_date.strftime("%Y-%m-%d") if user.birth_date else '',
                'سن': age if age else '',
                'رده سنی': user.get_age_category_display(),
                'استان': user.state or '',
                'شهر': user.city or '',
                'آدرس': user.address or '',
                'نقش': user.get_role_display(),
                'فعال': 'بله' if user.is_active else 'خیر',
                'تاریخ ایجاد': user.created_at.strftime("%Y-%m-%d %H:%M:%S") if user.created_at else '',
            })
        
        df = pd.DataFrame(data)
        return df
    
    @staticmethod
    def _format_worksheet(writer):
        """Format the Excel worksheet with better styling"""
        try:
            from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
            
            workbook = writer.book
            worksheet = workbook['کاربران']
            
            # Auto-adjust column widths
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                
                for cell in column:
                    try:
                        if cell.value:
                            cell_length = len(str(cell.value))
                            if cell_length > max_length:
                                max_length = cell_length
                    except:
                        pass
                
                # Set column width (min 10, max 50)
                adjusted_width = min(max(max_length + 2, 10), 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
            
            # Style the header row
            header_font = Font(bold=True, color="FFFFFF", size=11)
            header_fill = PatternFill(start_color="2C5F8A", end_color="2C5F8A", fill_type="solid")
            header_alignment = Alignment(horizontal='center', vertical='center')
            
            for cell in worksheet[1]:
                cell.font = header_font
                cell.fill = header_fill
                cell.alignment = header_alignment
            
            # Add borders to all cells
            thin_border = Border(
                left=Side(style='thin'),
                right=Side(style='thin'),
                top=Side(style='thin'),
                bottom=Side(style='thin')
            )
            
            for row in worksheet.iter_rows():
                for cell in row:
                    cell.border = thin_border
                    if cell.row != 1:  # Not header
                        cell.alignment = Alignment(horizontal='right')
            
            # Freeze the first row
            worksheet.freeze_panes = 'A2'
            
            # Add autofilter
            worksheet.auto_filter.ref = worksheet.dimensions
            
        except Exception as e:
            # If formatting fails, continue without formatting
            print(f"Warning: Could not format Excel file: {e}")
            pass


# Convenience function for easy import
def export_users_to_excel(queryset, filename=None):
    """Convenience function to export users to Excel"""
    return UserExcelExportService.export_users_to_excel(queryset, filename)