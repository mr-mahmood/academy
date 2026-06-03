"""
Django Shell Script to Import Data with Sequential IDs Starting from 1
Run with: sudo cat import_data.py | sudo docker exec -i academy_backend python manage.py shell
"""

from datetime import datetime
from django.db import transaction
from django.db import connection
from academy_management.academies.models import Academy
from academy_management.sports.models import Sport
from users.models import User
from academy_management.courses.models import Course, CourseSchedule
from backend.academy_management.payment.models import Payment
from academy_management.enrollment.models import Enrollment

print("=" * 60)
print("⚠️  WARNING: This will DELETE ALL existing data and renumber everything from 1! ⚠️")
print("=" * 60)

# ==============================================
# 0. DELETE ALL EXISTING DATA
# ==============================================
print("\n🗑️  Deleting all existing data...")

with transaction.atomic():
    Payment.objects.all().delete()
    CourseSchedule.objects.all().delete()
    Enrollment.objects.all().delete()
    Course.objects.all().delete()
    User.objects.all().delete()
    Sport.objects.all().delete()
    Academy.objects.all().delete()

print("✅ All existing data cleared!")

# Reset all sequences to 1
print("\n🔄 Resetting sequences to 1...")
with connection.cursor() as cursor:
    cursor.execute("ALTER SEQUENCE academies_id_seq RESTART WITH 1;")
    cursor.execute("ALTER SEQUENCE sports_id_seq RESTART WITH 1;")
    cursor.execute("ALTER SEQUENCE user_id_seq RESTART WITH 1;")
    cursor.execute("ALTER SEQUENCE courses_id_seq RESTART WITH 1;")
    cursor.execute("ALTER SEQUENCE course_schedules_id_seq RESTART WITH 1;")
    cursor.execute("ALTER SEQUENCE payments_id_seq RESTART WITH 1;")
print("✅ Sequences reset to 1")

print("\n" + "=" * 60)
print("Starting Fresh Data Import with Sequential IDs")
print("=" * 60)

# ==============================================
# 1. IMPORT ACADEMIES (Sequential IDs)
# ==============================================
print("\n📚 Importing Academies (IDs will be 1, 2, 3...)...")

academies_data = [
    {"old_id": 9, "name": "خلیج فارس", "address_text": "شاهین شهر خ بهداری ورزشگاه ملت سالن خلیج فارس", "is_active": True},
    {"old_id": 7, "name": "باران", "address_text": "مرداویج انتهای خیابان استقلال جنوبی", "is_active": True},
    {"old_id": 1, "name": "22 بهمن", "address_text": "سه راه حکیم نظامی خیابان دانشگاه", "is_active": True},
    {"old_id": 4, "name": "آب منطقه ای", "address_text": "مشتاق دوم کنارگذر سلمان فارسی", "is_active": True},
    {"old_id": 2, "name": "پردیس", "address_text": "بلوار کشاورز کنارگذر میثمی", "is_active": True},
    {"old_id": 6, "name": "آب و فاضلاب", "address_text": "خیابان هزارجریب خیابان شیخ کلینی اداره آب و فاضلاب", "is_active": True},
    {"old_id": 3, "name": "سیلو", "address_text": "خیابان سعادت آباد، ابتدای خیابان مصلی،فرایبورگ،اداره سیلو", "is_active": True},
    {"old_id": 5, "name": "مهاجر", "address_text": "خیابان هزارجریب، دانشکده فنی شهید مهاجر", "is_active": True},
    {"old_id": 10, "name": "مادر", "address_text": "ملک شهر، خیابان هفده شهریور، جنب دبیرستان سلامتیان", "is_active": True},
    {"old_id": 8, "name": "چمن مصنوعی آب و فاضلاب", "address_text": "خیابان هزارجریب خیابان شیخ کلینی اداره آب و فاضلاب", "is_active": True},
]

academy_map = {}

with transaction.atomic():
    for data in academies_data:
        obj = Academy.objects.create(
            name=data["name"],
            address_text=data["address_text"],
            is_active=data["is_active"],
        )
        academy_map[data["old_id"]] = obj
        print(f"  ✅ Created: {obj.name} (Old ID: {data['old_id']} → New ID: {obj.id})")

print(f"📊 Total Academies: {Academy.objects.count()}")

# ==============================================
# 2. IMPORT SPORTS (Sequential IDs)
# ==============================================
print("\n⚽ Importing Sports (IDs will be 1, 2, 3...)...")

sports_data = [
    {"old_id": 1, "name": "فوتسال"},
    {"old_id": 2, "name": "والیبال"},
    {"old_id": 3, "name": "فوتبال"},
]

sport_map = {}

with transaction.atomic():
    for data in sports_data:
        obj = Sport.objects.create(name=data["name"])
        sport_map[data["old_id"]] = obj
        print(f"  ✅ Created: {obj.name} (Old ID: {data['old_id']} → New ID: {obj.id})")

print(f"📊 Total Sports: {Sport.objects.count()}")

# ==============================================
# 3. IMPORT USERS (Sequential IDs)
# ==============================================
print("\n👤 Importing Users (IDs will be 1, 2, 3...)...")

users_data = [
    {"old_id": 1, "phone": "09024629079", "national_id": "4610900009", "name": "mahmood reissi", 
     "gender": "MALE", "role": "ADMIN", "password": "pbkdf2_sha256$1000000$75V3hENTwok2tVCkL3Akjg$XyILOqQtgNe/1bPi1IjvxPfztR/Y9BculLWbzrj1i0A=",
     "is_staff": True, "is_superuser": True, "token_version": 5},
    {"old_id": 3, "phone": "09133820398", "national_id": "4640431503", "name": "عتا دذذ", 
     "gender": "MALE", "role": "USER", "birth_date": "2020-09-02", "state": "بوشهر", "city": "کنگان", 
     "address": "تیاتی", "token_version": 1},
    {"old_id": 4, "phone": "09138162670", "national_id": "1272761371", "name": "کسری نیک شبانی", 
     "gender": "MALE", "role": "USER", "birth_date": "1998-08-02", "state": "اصفهان", "city": "اصفهان", 
     "address": "خیابان زاهد کوچه ۵ پلاک ۱۳", "token_version": 2},
    {"old_id": 5, "phone": "09132068256", "national_id": "1110805187", "name": "مرتضی نامداری", 
     "gender": "MALE", "role": "USER", "birth_date": "1979-08-12", "state": "اصفهان", "city": "اصفهان", 
     "address": "نظر میانی", "token_version": 1},
    {"old_id": 6, "phone": "09132704683", "national_id": "2491151669", "name": "سعید کشاورز", 
     "gender": "MALE", "role": "USER", "birth_date": "1978-04-01", "state": "اصفهان", "city": "اصفهان", 
     "address": "چهارباغ بالا", "token_version": 1},
    {"old_id": 7, "phone": "09131292268", "national_id": "0452655633", "name": "شیرین عالم پیکر", 
     "gender": "FEMALE", "role": "USER", "birth_date": "1979-08-04", "state": "اصفهان", "city": "اصفهان", 
     "address": "خ کمال اسماعیل", "token_version": 2},
    {"old_id": 8, "phone": "09131860199", "national_id": "1288259255", "name": "سعید طاهری", 
     "gender": "MALE", "role": "USER", "birth_date": "1981-06-11", "state": "اصفهان", "city": "اصفهان", 
     "address": "شریف واقفی", "token_version": 1},
]

user_map = {}

with transaction.atomic():
    for data in users_data:
        birth_date = None
        if data.get("birth_date"):
            birth_date = datetime.strptime(data["birth_date"], "%Y-%m-%d").date()
        
        user = User.objects.create(
            phone_number=data["phone"],
            national_id=data["national_id"],
            full_name=data["name"],
            gender=data["gender"],
            role=data["role"],
            birth_date=birth_date,
            state=data.get("state", ""),
            city=data.get("city", ""),
            address=data.get("address", ""),
            is_active=True,
            is_staff=data.get("is_staff", False),
            is_superuser=data.get("is_superuser", False),
            token_version=data.get("token_version", 1),
        )
        
        if "password" in data:
            user.password = data["password"]
            user.save()
        else:
            user.set_unusable_password()
            user.save()
        
        user_map[data["old_id"]] = user
        print(f"  ✅ Created: {user.full_name} (Old ID: {data['old_id']} → New ID: {user.id})")

print(f"📊 Total Users: {User.objects.count()}")

# ==============================================
# 4. IMPORT COURSES (Sequential IDs)
# ==============================================
print("\n📖 Importing Courses (IDs will be sequential starting from 1)...")

courses_raw = [
    {"old_id": 88, "sport_old_id": 2, "academy_old_id": 1, "max_students": 30, "enrolled": 1, "price": 25000000, "gender": "MALE", "status": "ACTIVE"},
    {"old_id": 89, "sport_old_id": 2, "academy_old_id": 1, "max_students": 30, "enrolled": 0, "price": 25000000, "gender": "MALE", "status": "ACTIVE"},
    {"old_id": 90, "sport_old_id": 2, "academy_old_id": 1, "max_students": 30, "enrolled": 0, "price": 25000000, "gender": "FEMALE", "status": "ACTIVE"},
    {"old_id": 91, "sport_old_id": 2, "academy_old_id": 1, "max_students": 30, "enrolled": 0, "price": 25000000, "gender": "FEMALE", "status": "ACTIVE"},
    {"old_id": 92, "sport_old_id": 3, "academy_old_id": 2, "max_students": 30, "enrolled": 0, "price": 45000000, "gender": "MALE", "status": "ACTIVE"},
    {"old_id": 93, "sport_old_id": 3, "academy_old_id": 2, "max_students": 30, "enrolled": 0, "price": 45000000, "gender": "MALE", "status": "ACTIVE"},
    {"old_id": 94, "sport_old_id": 2, "academy_old_id": 2, "max_students": 30, "enrolled": 0, "price": 25000000, "gender": "FEMALE", "status": "ACTIVE"},
    {"old_id": 95, "sport_old_id": 2, "academy_old_id": 2, "max_students": 30, "enrolled": 0, "price": 25000000, "gender": "FEMALE", "status": "ACTIVE"},
    {"old_id": 96, "sport_old_id": 2, "academy_old_id": 3, "max_students": 30, "enrolled": 0, "price": 25000000, "gender": "MALE", "status": "ACTIVE"},
    {"old_id": 97, "sport_old_id": 2, "academy_old_id": 3, "max_students": 30, "enrolled": 0, "price": 25000000, "gender": "MALE", "status": "ACTIVE"},
    {"old_id": 98, "sport_old_id": 1, "academy_old_id": 3, "max_students": 30, "enrolled": 0, "price": 15000000, "gender": "FEMALE", "status": "ACTIVE"},
    {"old_id": 99, "sport_old_id": 1, "academy_old_id": 3, "max_students": 30, "enrolled": 0, "price": 15000000, "gender": "FEMALE", "status": "ACTIVE"},
    {"old_id": 100, "sport_old_id": 2, "academy_old_id": 4, "max_students": 30, "enrolled": 0, "price": 25000000, "gender": "FEMALE", "status": "ACTIVE"},
    {"old_id": 101, "sport_old_id": 2, "academy_old_id": 4, "max_students": 30, "enrolled": 0, "price": 25000000, "gender": "FEMALE", "status": "ACTIVE"},
    {"old_id": 102, "sport_old_id": 2, "academy_old_id": 4, "max_students": 30, "enrolled": 0, "price": 25000000, "gender": "FEMALE", "status": "ACTIVE"},
    {"old_id": 103, "sport_old_id": 2, "academy_old_id": 4, "max_students": 30, "enrolled": 0, "price": 25000000, "gender": "FEMALE", "status": "ACTIVE"},
    {"old_id": 104, "sport_old_id": 2, "academy_old_id": 5, "max_students": 30, "enrolled": 0, "price": 25000000, "gender": "MALE", "status": "ACTIVE"},
    {"old_id": 105, "sport_old_id": 2, "academy_old_id": 5, "max_students": 30, "enrolled": 0, "price": 25000000, "gender": "MALE", "status": "ACTIVE"},
    {"old_id": 106, "sport_old_id": 2, "academy_old_id": 5, "max_students": 30, "enrolled": 0, "price": 25000000, "gender": "MALE", "status": "ACTIVE"},
    {"old_id": 107, "sport_old_id": 2, "academy_old_id": 5, "max_students": 30, "enrolled": 0, "price": 25000000, "gender": "MALE", "status": "ACTIVE"},
    {"old_id": 108, "sport_old_id": 2, "academy_old_id": 5, "max_students": 30, "enrolled": 0, "price": 25000000, "gender": "MALE", "status": "ACTIVE"},
    {"old_id": 109, "sport_old_id": 3, "academy_old_id": 5, "max_students": 30, "enrolled": 0, "price": 45000000, "gender": "MALE", "status": "ACTIVE"},
    {"old_id": 110, "sport_old_id": 3, "academy_old_id": 5, "max_students": 30, "enrolled": 0, "price": 45000000, "gender": "MALE", "status": "ACTIVE"},
    {"old_id": 111, "sport_old_id": 3, "academy_old_id": 5, "max_students": 30, "enrolled": 0, "price": 45000000, "gender": "MALE", "status": "ACTIVE"},
    {"old_id": 112, "sport_old_id": 2, "academy_old_id": 10, "max_students": 30, "enrolled": 1, "price": 25000000, "gender": "MALE", "status": "ACTIVE"},
    {"old_id": 113, "sport_old_id": 2, "academy_old_id": 9, "max_students": 30, "enrolled": 0, "price": 25000000, "gender": "FEMALE", "status": "ACTIVE"},
]

course_map = {}

with transaction.atomic():
    for data in courses_raw:
        course = Course.objects.create(
            sport=sport_map[data["sport_old_id"]],  # Now passing Sport object, not ID
            academy=academy_map[data["academy_old_id"]],  # Now passing Academy object, not ID
            max_students=data["max_students"],
            enrolled_students=data["enrolled"],
            price=data["price"],
            gender_requirement=data["gender"],
            status=data["status"],
            total_sessions=12,
        )
        course_map[data["old_id"]] = course
        print(f"  ✅ Created: Course {course.id} (Old ID: {data['old_id']} → New ID: {course.id})")

print(f"📊 Total Courses: {Course.objects.count()}")

# ==============================================
# 5. IMPORT COURSE SCHEDULES (COMPLETE LIST)
# ==============================================
print("\n📅 Importing Course Schedules (All schedules)...")

schedules_raw = [
    # Course 88 schedules
    (88, 0, "09:30:00", "11:00:00"), (88, 2, "09:30:00", "11:00:00"), (88, 4, "09:30:00", "11:00:00"),
    # Course 89 schedules
    (89, 0, "11:00:00", "12:30:00"), (89, 2, "11:00:00", "12:30:00"), (89, 4, "11:00:00", "12:30:00"),
    # Course 90 schedules
    (90, 1, "09:30:00", "11:00:00"), (90, 3, "09:30:00", "11:00:00"), (90, 5, "09:30:00", "11:00:00"),
    # Course 91 schedules
    (91, 1, "11:00:00", "12:30:00"), (91, 3, "11:00:00", "12:30:00"), (91, 5, "11:00:00", "12:30:00"),
    # Course 92 schedules
    (92, 0, "09:30:00", "11:00:00"), (92, 2, "09:30:00", "11:00:00"), (92, 4, "09:30:00", "11:00:00"),
    # Course 93 schedules
    (93, 0, "11:00:00", "12:30:00"), (93, 2, "11:00:00", "12:30:00"), (93, 4, "11:00:00", "12:30:00"),
    # Course 94 schedules
    (94, 1, "09:30:00", "11:00:00"), (94, 3, "09:30:00", "11:00:00"), (94, 5, "09:30:00", "11:00:00"),
    # Course 95 schedules
    (95, 1, "11:30:00", "12:30:00"), (95, 3, "11:30:00", "12:30:00"), (95, 5, "11:30:00", "12:30:00"),
    # Course 96 schedules
    (96, 0, "16:00:00", "17:30:00"), (96, 2, "16:00:00", "17:30:00"), (96, 4, "16:00:00", "17:30:00"),
    # Course 97 schedules
    (97, 0, "17:30:00", "19:00:00"), (97, 2, "17:30:00", "19:00:00"), (97, 4, "17:30:00", "19:00:00"),
    # Course 98 schedules
    (98, 1, "09:00:00", "10:30:00"), (98, 3, "09:00:00", "10:30:00"), (98, 5, "09:00:00", "10:30:00"),
    # Course 99 schedules
    (99, 1, "10:30:00", "12:00:00"), (99, 3, "10:30:00", "12:00:00"), (99, 5, "10:30:00", "12:00:00"),
    # Course 100 schedules
    (100, 1, "09:00:00", "10:30:00"), (100, 3, "09:00:00", "10:30:00"), (100, 5, "09:00:00", "10:30:00"),
    # Course 101 schedules
    (101, 1, "10:30:00", "12:00:00"), (101, 3, "10:30:00", "12:00:00"), (101, 5, "10:30:00", "12:00:00"),
    # Course 102 schedules
    (102, 1, "15:30:00", "17:00:00"), (102, 3, "15:30:00", "17:00:00"), (102, 5, "15:30:00", "17:00:00"),
    # Course 103 schedules
    (103, 1, "17:00:00", "18:30:00"), (103, 3, "17:00:00", "18:30:00"), (103, 5, "17:00:00", "18:30:00"),
    # Course 104 schedules
    (104, 1, "16:00:00", "17:30:00"), (104, 3, "16:00:00", "17:30:00"), (104, 5, "16:00:00", "17:30:00"),
    # Course 105 schedules
    (105, 1, "17:30:00", "19:00:00"), (105, 3, "17:30:00", "19:00:00"), (105, 5, "17:30:00", "19:00:00"),
    # Course 106 schedules
    (106, 0, "08:00:00", "10:00:00"), (106, 2, "08:00:00", "10:00:00"), (106, 4, "08:00:00", "10:00:00"),
    # Course 107 schedules
    (107, 0, "10:00:00", "11:30:00"), (107, 2, "10:00:00", "11:30:00"), (107, 4, "10:00:00", "11:30:00"),
    # Course 108 schedules
    (108, 0, "16:00:00", "17:30:00"), (108, 2, "16:00:00", "17:30:00"), (108, 4, "16:00:00", "17:30:00"),
    # Course 109 schedules
    (109, 1, "16:00:00", "17:30:00"), (109, 3, "16:00:00", "17:30:00"), (109, 5, "16:00:00", "17:30:00"),
    # Course 110 schedules
    (110, 1, "17:30:00", "19:00:00"), (110, 3, "17:30:00", "19:00:00"), (110, 5, "17:30:00", "19:00:00"),
    # Course 111 schedules
    (111, 1, "19:00:00", "21:30:00"), (111, 3, "19:00:00", "21:30:00"), (111, 5, "19:00:00", "21:30:00"),
    # Course 112 schedules
    (112, 1, "19:30:00", "21:00:00"), (112, 3, "19:30:00", "21:00:00"), (112, 5, "19:30:00", "21:00:00"),
    # Course 113 schedules
    (113, 1, "09:30:00", "12:30:00"), (113, 3, "09:30:00", "12:30:00"), (113, 5, "08:00:00", "11:00:00"),
]

schedules_created = 0

with transaction.atomic():
    for old_course_id, weekday, start, end in schedules_raw:
        start_obj = datetime.strptime(start, "%H:%M:%S").time()
        end_obj = datetime.strptime(end, "%H:%M:%S").time()
        
        CourseSchedule.objects.create(
            weekday=weekday,
            start_time=start_obj,
            end_time=end_obj,
            course=course_map[old_course_id],  # Now passing Course object
        )
        schedules_created += 1
    
    print(f"  ✅ Created {schedules_created} schedules")

print(f"📊 Total Schedules: {CourseSchedule.objects.count()}")

# ==============================================
# FINAL VERIFICATION
# ==============================================
print("\n" + "=" * 60)
print("✅ IMPORT COMPLETE - SEQUENTIAL IDs FROM 1")
print("=" * 60)

print(f"""
┌─────────────────────────────────────────┐
│           Database Statistics           │
├─────────────────────────────────────────┤
│ Academies:        {Academy.objects.count():>5}  (IDs: 1-{Academy.objects.count()})      │
│ Sports:           {Sport.objects.count():>5}  (IDs: 1-{Sport.objects.count()})      │
│ Users:            {User.objects.count():>5}  (IDs: 1-{User.objects.count()})      │
│ Courses:          {Course.objects.count():>5}  (IDs: 1-{Course.objects.count()})      │
│ Schedules:        {CourseSchedule.objects.count():>5}                         │
└─────────────────────────────────────────┘
""")

print("\n📋 New Sequential IDs:")
if Academy.objects.first():
    print(f"  First Academy ID: {Academy.objects.first().id}")# type: ignore
    print(f"  Last Academy ID: {Academy.objects.last().id}")# type: ignore
if Course.objects.first():
    print(f"  First Course ID: {Course.objects.first().id}")# type: ignore
    print(f"  Last Course ID: {Course.objects.last().id}")# type: ignore
if CourseSchedule.objects.first():
    print(f"  Total Schedules: {CourseSchedule.objects.count()}")

print("\n✅ All data imported with sequential IDs starting from 1!")
print(f"✅ Total schedules added: {schedules_created}")