from django.urls import re_path

from .consumers import CharConsumer

websocet_urlpatterns = [
    re_path(r'', CharConsumer.as_asgi())
]