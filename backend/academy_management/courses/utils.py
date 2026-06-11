import pandas as pd
from django.http import HttpResponse
from django.utils import timezone
from io import BytesIO


class ExcelExportService:
    """Service for exporting course data to Excel"""
    
    @staticmethod
    def export_courses_to_excel(queryset, filename=None):
        """
        Export courses to Excel with Persian headers
        
        Args:
            queryset: Course queryset to export
            filename: Custom filename (optional)
        
        Returns:
            HttpResponse with Excel file
        """
        if filename is None:
            timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
            filename = f"courses_export_{timestamp}.xlsx"
        
        # Create Excel file
        output = BytesIO()
        
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            # Create dataframe and write to sheet
            df = ExcelExportService._create_course_dataframe(queryset)
            df.to_excel(writer, sheet_name='دوره‌ها', index=False)
            
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
    def _create_course_dataframe(queryset):
        """Create DataFrame for courses with Persian headers"""
        data = []
        
        for course in queryset:
            data.append({
                'شناسه': course.id,
                'ورزش': course.sport.name if course.sport else '-',
                'آکادمی': course.academy.name if course.academy else '-',
                'نام مربی': course.instructor_name or '-',
                'تعداد جلسات': course.total_sessions,
                'حداکثر دانشجو': course.max_students,
                'تعداد ثبت‌نامی‌ها': course.enrolled_students,
                'صندلی خالی': course.available_seats,
                'قیمت (ریال)': float(course.price) if course.price else 0,
                'شرایط جنسیتی': course.get_gender_requirement_display(),
                'وضعیت': course.get_status_display(),
                'برنامه هفتگی': ExcelExportService._get_course_schedule(course),
                'تاریخ ایجاد': course.created_at.strftime("%Y-%m-%d %H:%M:%S") if course.created_at else '',
                'آخرین بروزرسانی': course.updated_at.strftime("%Y-%m-%d %H:%M:%S") if course.updated_at else '',
            })
        
        df = pd.DataFrame(data)
        
        # Format price column with thousand separator
        if 'قیمت (ریال)' in df.columns:
            df['قیمت (ریال)'] = df['قیمت (ریال)'].apply(lambda x: f"{x:,.0f}" if pd.notna(x) and x != 0 else ('' if pd.isna(x) else '0'))
        
        return df
    
    @staticmethod
    def _get_course_schedule(course):
        """Get formatted schedule string for a course in Persian"""
        try:
            schedules = course.schedule.all()
            if not schedules:
                return "بدون برنامه"
            
            day_names_persian = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']
            schedule_parts = []
            
            for schedule in schedules:
                day = day_names_persian[schedule.weekday]
                start_time = schedule.start_time.strftime("%H:%M")
                end_time = schedule.end_time.strftime("%H:%M")
                schedule_parts.append(f"{day} {start_time} تا {end_time}")
            
            return " - ".join(schedule_parts)
        except:
            return "برنامه موجود نیست"
    
    @staticmethod
    def _format_worksheet(writer):
        """Format the Excel worksheet with better styling"""
        try:
            workbook = writer.book
            worksheet = workbook['دوره‌ها']
            
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
def export_courses_to_excel(queryset, filename=None):
    """Convenience function to export courses to Excel"""
    return ExcelExportService.export_courses_to_excel(queryset, filename)