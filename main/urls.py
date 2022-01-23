from unicodedata import name
from django.urls import path
from .views import *

urlpatterns = [
    path('', main_view, name = 'main_view')
]