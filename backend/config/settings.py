"""
Django settings for PLD project.
"""

import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

# -----------------------------
# Base
# -----------------------------
BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")
DEBUG = False

ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "").split(",")
INTERNAL_IPS = ['127.0.0.1', 'localhost']
DOMAIN = os.getenv("DOMAIN", "academy.sepahansc.com")

# -----------------------------
# Applications
# -----------------------------
INSTALLED_APPS = [
    "daphne",
    "corsheaders",
    "channels",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "import_export",
    
    # Project apps
    "users",   
    "authentication",
    
    "academy_management.sports",
    "academy_management.academies",
    "academy_management.courses",
    "academy_management.enrollment",
    "academy_management.payment",
    
    'football_talent.academies',
    'football_talent.courses',
    'football_talent.enrollment',
    "football_talent.payment",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

# -----------------------------
# Templates
# -----------------------------
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# -----------------------------
# WSGI & ASGI
# -----------------------------
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# -----------------------------
# Database
# -----------------------------
import dj_database_url
DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL'),
        conn_max_age=600,
        conn_health_checks=True,
        ssl_require=False
    )
}

if not DEBUG:
    DATABASES['default']['OPTIONS'] = {
        'connect_timeout': 10,
        'keepalives': 1,
        'keepalives_idle': 60,
        'keepalives_interval': 30,
        'keepalives_count': 5,
    }
    
# -----------------------------
# Auth
# -----------------------------
AUTH_USER_MODEL = "users.User"
AUTHENTICATION_BACKENDS = [
    "authentication.backends.OTPAuthBackend",
    "django.contrib.auth.backends.ModelBackend",
]

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# -----------------------------
# Internationalization
# -----------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Tehran"
USE_I18N = True
USE_TZ = True

# -----------------------------
# Static & Media
# -----------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "static"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# -----------------------------
# REST Framework
# -----------------------------
REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "authentication.auth.VersionedJWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "core.renderers.GlobalJSONRenderer",
    ],
}

# -----------------------------
# JWT Settings
# -----------------------------
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=int(os.getenv("JWT_ACCESS_HOURS", 24))),
    "REFRESH_TOKEN_LIFETIME": timedelta(hours=int(os.getenv("JWT_REFRESH_HOURS", 168))),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "uid",
}

# -----------------------------
# Cookies & CORS
# -----------------------------
SESSION_COOKIE_SAMESITE = "Lax"  # 'Lax' works with HTTP, 'None' requires HTTPS
CSRF_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = True  # False for HTTP, True for HTTPS
CSRF_COOKIE_SECURE = True     # False for HTTP, True for HTTPS

CSRF_TRUSTED_ORIGINS = os.getenv("CSRF_TRUSTED_ORIGINS", "").split(",")

CORS_ALLOW_ALL_ORIGINS = DEBUG  # This is the most important for development
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOWED_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")

# -----------------------------
# Channels & Redis
# -----------------------------
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {"hosts": [(os.getenv("REDIS_HOST", "redis"), int(os.getenv('REDIS_PORT', 6379)))]},
    },
}

# -----------------------------
# Caches
# -----------------------------
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": f"redis://{os.getenv('REDIS_HOST', 'redis')}:{os.getenv('REDIS_PORT', 6379)}/1",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}

# -----------------------------
# Celery
# -----------------------------
CELERY_BROKER_URL = f"redis://{os.getenv('REDIS_HOST', 'redis')}:{os.getenv('REDIS_PORT', 6379)}/0"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"

# -----------------------------
# Zibal Payment Gateway Settings
# -----------------------------
ZIBAL_MERCHANT = os.environ.get('ZIBAL_MERCHANT')
ZIBAL_FOOTBALL_MERCHANT = os.environ.get('ZIBAL_FOOTBALL_MERCHANT')

# -----------------------------
# Sms.ir
# -----------------------------
SMSIR_API_KEY = os.environ.get('SMSIR_API_KEY')


# -----------------------------
# OTP config
# -----------------------------
# Cache prefixes
OTP_CACHE_PREFIX = "otp"
OTP_REQUEST_LIMIT_PREFIX = "otp_request"
OTP_BLOCKED_PREFIX = "otp_blocked"
PHONE_VERIFIED_PREFIX = "phone_verified"

# Time settings (in seconds)
OTP_EXPIRY_SECONDS = 300           # 5 minutes  - OTP valid duration
OTP_RATE_WINDOW = 1800             # 30 minutes - Rate limit window
PHONE_VERIFIED_EXPIRY = 1200       # 20 minutes - Time to complete signup
OTP_BLOCK_DURATION = 900           # 15 minutes - Block duration after failures

# Limits
OTP_MAX_REQUESTS = 5               # Max OTP requests per window
OTP_MAX_VERIFICATION_ATTEMPTS = 5  # Max failed attempts per OTP

# Security
OTP_HASH_SECRET = SECRET_KEY       # Use Django's SECRET_KEY for hashing



















import os
from pathlib import Path

# Logging configuration - Console only for Docker
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {
            'format': '{asctime} | {levelname} | {module}: {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'users': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'authentication': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'payment': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}