import pandas as pd
from django.http import HttpResponse
from django.utils import timezone
from io import BytesIO


class ExcelExportService:
    """Service for exporting payment data to Excel"""
    
    @staticmethod
    def export_payments_to_excel(queryset, filename=None):
        """
        Export payments to Excel with Persian headers
        
        Args:
            queryset: Payment queryset to export
            filename: Custom filename (optional)
        
        Returns:
            HttpResponse with Excel file
        """
        if filename is None:
            timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
            filename = f"payments_export_{timestamp}.xlsx"
        
        # Create Excel file
        output = BytesIO()
        
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            # Create dataframe and write to sheet
            df = ExcelExportService._create_payment_dataframe(queryset)
            df.to_excel(writer, sheet_name='پرداخت‌ها', index=False)
            
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
    def _create_payment_dataframe(queryset):
        """Create DataFrame for payments with Persian headers"""
        data = []
        
        for payment in queryset:
            data.append({
                'شناسه': payment.id,
                'کاربر': payment.enrollment.user.full_name if payment.enrollment and payment.enrollment.user else '-',
                'شماره موبایل': payment.enrollment.user.phone_number if payment.enrollment and payment.enrollment.user else '-',
                'دوره': str(payment.enrollment.course) if payment.enrollment and payment.enrollment.course else '-',
                'مبلغ (ریال)': payment.amount,
                'مبلغ (تومان)': payment.amount_in_toman,
                'کارمزد': payment.wage,
                'شماره سفارش': payment.res_num,
                'شماره پیگیری': payment.ref_num or '-',
                'شماره کارت': payment.masked_pan or '-',
                'وضعیت': payment.get_status_display(),
                'تاریخ پرداخت': payment.paid_at.strftime("%Y-%m-%d %H:%M:%S") if payment.paid_at else '',
                'تاریخ ایجاد': payment.created_at.strftime("%Y-%m-%d %H:%M:%S") if payment.created_at else '',
                'آخرین بروزرسانی': payment.updated_at.strftime("%Y-%m-%d %H:%M:%S") if payment.updated_at else '',
            })
        
        df = pd.DataFrame(data)
        
        # Format amount columns with thousand separator
        if 'مبلغ (ریال)' in df.columns:
            df['مبلغ (ریال)'] = df['مبلغ (ریال)'].apply(lambda x: f"{x:,.0f}" if pd.notna(x) and x != 0 else '0')
        
        if 'مبلغ (تومان)' in df.columns:
            df['مبلغ (تومان)'] = df['مبلغ (تومان)'].apply(lambda x: f"{x:,.0f}" if pd.notna(x) and x != 0 else '0')
        
        if 'کارمزد' in df.columns:
            df['کارمزد'] = df['کارمزد'].apply(lambda x: f"{x:,.0f}" if pd.notna(x) and x != 0 else '0')
        
        return df
    
    @staticmethod
    def _format_worksheet(writer):
        """Format the Excel worksheet with better styling"""
        try:
            workbook = writer.book
            worksheet = workbook['پرداخت‌ها']
            
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
def export_payments_to_excel(queryset, filename=None):
    """Convenience function to export payments to Excel"""
    return ExcelExportService.export_payments_to_excel(queryset, filename)