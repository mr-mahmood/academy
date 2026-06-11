import pandas as pd
from django.http import HttpResponse
from django.utils import timezone
from io import BytesIO

from .models import FootballEnrollment, FootballCourse


class ExcelExportService:
    """Service for exporting football enrollment data to Excel with multiple sheets"""
    
    @staticmethod
    def export_football_enrollments_to_excel(queryset, filename=None):
        """
        Export football enrollments to Excel with four sheets:
        1. ثبت‌نام‌های فوتبال (Enrollments)
        2. کاربران (Users)
        3. دوره‌های فوتبال (Courses)
        4. پرداخت‌ها (Payments)
        
        Args:
            queryset: FootballEnrollment queryset to export
            filename: Custom filename (optional)
        
        Returns:
            HttpResponse with Excel file
        """
        if filename is None:
            timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
            filename = f"football_enrollments_export_{timestamp}.xlsx"
        
        # Create Excel file with multiple sheets
        output = BytesIO()
        
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            # Create dataframes and write to sheets
            enrollment_df = ExcelExportService._create_football_enrollment_dataframe(queryset)
            users_df = ExcelExportService._create_users_dataframe(queryset)
            courses_df = ExcelExportService._create_courses_dataframe(queryset)
            payments_df = ExcelExportService._create_payments_dataframe(queryset)
            
            # Write to Excel with Persian sheet names
            enrollment_df.to_excel(writer, sheet_name='ثبت‌نام‌های فوتبال', index=False)
            users_df.to_excel(writer, sheet_name='کاربران', index=False)
            courses_df.to_excel(writer, sheet_name='دوره‌های فوتبال', index=False)
            payments_df.to_excel(writer, sheet_name='پرداخت‌ها', index=False)
            
            # Format the worksheets
            ExcelExportService._format_worksheets(writer)
        
        # Create response
        output.seek(0)
        response = HttpResponse(
            output,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
    
    @staticmethod
    def _create_football_enrollment_dataframe(queryset):
        """Create DataFrame for football enrollments with Persian headers"""
        data = []
        
        # Get display mappings
        status_display = dict(FootballEnrollment.EnrollmentStatus.choices)
        age_category_display = dict(FootballEnrollment.AgeCategory.choices)
        position_display = dict(FootballCourse.Position.choices)
        
        for enrollment in queryset:
            data.append({
                'شناسه': enrollment.id,
                'شناسه کاربر': enrollment.user.id if enrollment.user else None,
                'نام کاربر': enrollment.user.full_name if enrollment.user else '-',
                'شماره موبایل': enrollment.user.phone_number if enrollment.user else '-',
                'کد ملی': enrollment.user.national_id if enrollment.user else '-',
                'شناسه دوره': enrollment.course.id if enrollment.course else None,
                'آکادمی': enrollment.course.academy.name if enrollment.course and enrollment.course.academy else '-',
                'شهر': enrollment.course.academy.get_city_display() if enrollment.course and enrollment.course.academy else '-',
                'پست تخصصی': position_display.get(enrollment.course.position, enrollment.course.position) if enrollment.course else '-',
                'رده سنی در ثبت‌نام': age_category_display.get(enrollment.age_category, enrollment.age_category),
                'وضعیت ثبت‌نام': status_display.get(enrollment.enrollment_status, enrollment.enrollment_status),
                'تاریخ ثبت‌نام': enrollment.enrolled_at.strftime("%Y-%m-%d %H:%M:%S") if enrollment.enrolled_at else '',
                'تاریخ لغو': enrollment.cancelled_at.strftime("%Y-%m-%d %H:%M:%S") if enrollment.cancelled_at else '',
                'آخرین بروزرسانی': enrollment.updated_at.strftime("%Y-%m-%d %H:%M:%S") if enrollment.updated_at else '',
            })
        
        df = pd.DataFrame(data)
        return df
    
    @staticmethod
    def _create_users_dataframe(queryset):
        """Create DataFrame for unique users with Persian headers"""
        # Get unique users from queryset
        users = {}
        for enrollment in queryset:
            if enrollment.user and enrollment.user.id not in users:
                users[enrollment.user.id] = enrollment.user
        
        data = []
        for user in users.values():
            data.append({
                'شناسه': user.id,
                'نام کامل': user.full_name,
                'شماره موبایل': user.phone_number,
                'کد ملی': user.national_id,
                'جنسیت': user.get_gender_display(),
                'تاریخ تولد': user.birth_date.strftime("%Y-%m-%d") if user.birth_date else '',
                'رده سنی': user.get_age_category_display(),
                'استان': user.state or '',
                'شهر': user.city or '',
                'آدرس': user.address or '',
                'تاریخ ایجاد': user.created_at.strftime("%Y-%m-%d %H:%M:%S") if user.created_at else '',
            })
        
        df = pd.DataFrame(data)
        return df
    
    @staticmethod
    def _create_courses_dataframe(queryset):
        """Create DataFrame for unique courses with Persian headers"""
        # Get unique courses from queryset
        courses = {}
        for enrollment in queryset:
            if enrollment.course and enrollment.course.id not in courses:
                courses[enrollment.course.id] = enrollment.course
        
        data = []
        position_display = dict(FootballCourse.Position.choices)
        gender_display = dict(FootballCourse.GenderRequirement.choices)
        status_display = dict(FootballCourse.Status.choices)
        
        for course in courses.values():
            data.append({
                'شناسه': course.id,
                'آکادمی': course.academy.name if course.academy else '-',
                'شهر': course.academy.get_city_display() if course.academy else '-',
                'پست تخصصی': position_display.get(course.position, course.position),
                'شرایط جنسیتی': gender_display.get(course.gender_requirement, course.gender_requirement),
                'مربی': course.coache or '-',
                'قیمت (ریال)': float(course.price) if course.price else 0,
                'وضعیت': status_display.get(course.status, course.status),
                'تاریخ ایجاد': course.created_at.strftime("%Y-%m-%d %H:%M:%S") if course.created_at else '',
                'آخرین بروزرسانی': course.updated_at.strftime("%Y-%m-%d %H:%M:%S") if course.updated_at else '',
            })
        
        df = pd.DataFrame(data)
        
        # Format price column with thousand separator
        if 'قیمت (ریال)' in df.columns:
            df['قیمت (ریال)'] = df['قیمت (ریال)'].apply(lambda x: f"{x:,.0f}" if pd.notna(x) and x != 0 else '0')
        
        return df
    
    @staticmethod
    def _create_payments_dataframe(queryset):
        """Create DataFrame for payments with Persian headers"""
        data = []
        
        # Get payment status display mapping
        from football_talent.payment.models import FootballPaymentStatus
        payment_status_display = dict(FootballPaymentStatus.choices)
        position_display = dict(FootballCourse.Position.choices)
        age_category_display = dict(FootballEnrollment.AgeCategory.choices)
        
        for enrollment in queryset:
            # Check if enrollment has a payment
            payment = getattr(enrollment, 'payment', None)
            
            if payment:
                data.append({
                    'شناسه پرداخت': payment.id,
                    'شناسه ثبت‌نام': enrollment.id,
                    'نام کاربر': enrollment.user.full_name if enrollment.user else '-',
                    'شماره موبایل': enrollment.user.phone_number if enrollment.user else '-',
                    'کد ملی': enrollment.user.national_id if enrollment.user else '-',
                    'آکادمی': enrollment.course.academy.name if enrollment.course and enrollment.course.academy else '-',
                    'شهر': enrollment.course.academy.get_city_display() if enrollment.course and enrollment.course.academy else '-',
                    'پست تخصصی': position_display.get(enrollment.course.position, enrollment.course.position) if enrollment.course else '-',
                    'رده سنی': age_category_display.get(enrollment.age_category, enrollment.age_category),
                    'مبلغ (ریال)': payment.amount,
                    'مبلغ (تومان)': payment.amount_in_toman,
                    'کارمزد': payment.wage,
                    'شماره سفارش': payment.res_num,
                    'شماره پیگیری': payment.ref_num or '-',
                    'شماره کارت': payment.masked_pan or '-',
                    'وضعیت پرداخت': payment_status_display.get(payment.status, payment.status),
                    'تاریخ پرداخت': payment.paid_at.strftime("%Y-%m-%d %H:%M:%S") if payment.paid_at else '',
                    'تاریخ ایجاد': payment.created_at.strftime("%Y-%m-%d %H:%M:%S") if payment.created_at else '',
                })
            else:
                # Include enrollments without payment
                data.append({
                    'شناسه پرداخت': '-',
                    'شناسه ثبت‌نام': enrollment.id,
                    'نام کاربر': enrollment.user.full_name if enrollment.user else '-',
                    'شماره موبایل': enrollment.user.phone_number if enrollment.user else '-',
                    'کد ملی': enrollment.user.national_id if enrollment.user else '-',
                    'آکادمی': enrollment.course.academy.name if enrollment.course and enrollment.course.academy else '-',
                    'شهر': enrollment.course.academy.get_city_display() if enrollment.course and enrollment.course.academy else '-',
                    'پست تخصصی': position_display.get(enrollment.course.position, enrollment.course.position) if enrollment.course else '-',
                    'رده سنی': age_category_display.get(enrollment.age_category, enrollment.age_category),
                    'مبلغ (ریال)': '-',
                    'مبلغ (تومان)': '-',
                    'کارمزد': '-',
                    'شماره سفارش': '-',
                    'شماره پیگیری': '-',
                    'شماره کارت': '-',
                    'وضعیت پرداخت': 'پرداختی وجود ندارد',
                    'تاریخ پرداخت': '-',
                    'تاریخ ایجاد': '-',
                })
        
        df = pd.DataFrame(data)
        
        # Format amount columns with thousand separator
        if 'مبلغ (ریال)' in df.columns:
            df['مبلغ (ریال)'] = df['مبلغ (ریال)'].apply(lambda x: f"{x:,.0f}" if pd.notna(x) and x != '-' else x)
        
        if 'مبلغ (تومان)' in df.columns:
            df['مبلغ (تومان)'] = df['مبلغ (تومان)'].apply(lambda x: f"{x:,.0f}" if pd.notna(x) and x != '-' else x)
        
        if 'کارمزد' in df.columns:
            df['کارمزد'] = df['کارمزد'].apply(lambda x: f"{x:,.0f}" if pd.notna(x) and x != '-' else x)
        
        return df
    
    @staticmethod
    def _format_worksheets(writer):
        """Format the Excel worksheets with better styling"""
        try:
            workbook = writer.book
            
            # Format each sheet
            for sheet_name in workbook.sheetnames:
                worksheet = workbook[sheet_name]
                
                # Auto-adjust column widths
                for column in worksheet.columns:
                    max_length = 0
                    column_letter = column[0].column_letter
                    
                    for cell in column:
                        try:
                            if cell.value:
                                # Handle Persian text length
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
def export_football_enrollments_to_excel(queryset, filename=None):
    """Convenience function to export football enrollments to Excel"""
    return ExcelExportService.export_football_enrollments_to_excel(queryset, filename)