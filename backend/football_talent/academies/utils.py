import pandas as pd
from django.http import HttpResponse
from django.utils import timezone
from io import BytesIO

from .models import FootballAcademy


class ExcelExportService:
    """Service for exporting football academy data to Excel"""
    
    @staticmethod
    def export_football_academies_to_excel(queryset, filename=None):
        """
        Export football academies to Excel with Persian headers
        
        Args:
            queryset: FootballAcademy queryset to export
            filename: Custom filename (optional)
        
        Returns:
            HttpResponse with Excel file
        """
        if filename is None:
            timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
            filename = f"football_academies_export_{timestamp}.xlsx"
        
        # Create Excel file
        output = BytesIO()
        
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            # Create dataframe and write to sheet
            df = ExcelExportService._create_football_academy_dataframe(queryset)
            df.to_excel(writer, sheet_name='آکادمی‌های فوتبال', index=False)
            
            # Format the worksheet
            ExcelExportService._format_worksheet(writer)
        
        # Create response
        output.seek(0)
        response = HttpResponse(
            output,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
    
    @staticmethod
    def _create_football_academy_dataframe(queryset):
        """Create DataFrame for football academies with Persian headers"""
        data = []
        
        # City name mapping for Persian display
        city_display = dict(FootballAcademy.City.choices)
        
        for academy in queryset:
            data.append({
                'شناسه': academy.id,
                'نام آکادمی': academy.name,
                'شهر': city_display.get(academy.city, academy.city),
                'شماره تماس': academy.phone or '',
                'آدرس': academy.address_text or '',
                'وضعیت': 'فعال' if academy.is_active else 'غیرفعال',
                'طول جغرافیایی': float(academy.longitude) if academy.longitude else '',
                'عرض جغرافیایی': float(academy.latitude) if academy.latitude else '',
                'تاریخ ایجاد': academy.created_at.strftime("%Y-%m-%d %H:%M:%S") if academy.created_at else '',
                'آخرین بروزرسانی': academy.updated_at.strftime("%Y-%m-%d %H:%M:%S") if academy.updated_at else '',
            })
        
        df = pd.DataFrame(data)
        return df
    
    @staticmethod
    def _format_worksheet(writer):
        """Format the Excel worksheet with better styling"""
        try:
            workbook = writer.book
            worksheet = workbook['آکادمی‌های فوتبال']
            
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
                
                # Set column width (min 10, max 60)
                adjusted_width = min(max(max_length + 2, 10), 60)
                worksheet.column_dimensions[column_letter].width = adjusted_width
            
            # Style the header row
            from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
            
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
                        cell.alignment = Alignment(horizontal='right' if isinstance(cell.value, (int, float)) else 'right')
            
            # Freeze the first row
            worksheet.freeze_panes = 'A2'
            
            # Add autofilter
            worksheet.auto_filter.ref = worksheet.dimensions
            
        except Exception as e:
            # If formatting fails, continue without formatting
            print(f"Warning: Could not format Excel file: {e}")
            pass


# Convenience function for easy import
def export_football_academies_to_excel(queryset, filename=None):
    """Convenience function to export football academies to Excel"""
    return ExcelExportService.export_football_academies_to_excel(queryset, filename)