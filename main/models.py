from django.db import models
from django.utils import timezone

# Create your models here.
class TestDB(models.Model):
    columnA = models.CharField(max_length=200)
    columnB = models.DateTimeField('date')
    # columnC = models.IntegerField(default=0)

class response_t(models.Model):
    cat = models.CharField(max_length=200, default={})
    data = models.CharField(max_length=200)
    updated = models.DateTimeField('date updated')