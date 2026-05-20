from tortoise import fields, models


class User(models.Model):
    id = fields.CharField(max_length=10, pk=True)       # "s1", "s2", "s3"
    username = fields.CharField(max_length=50, unique=True)
    name = fields.CharField(max_length=200)
    initials = fields.CharField(max_length=5)
    role = fields.CharField(max_length=100, default="Training Coordinator")
    hashed_password = fields.CharField(max_length=200)

    class Meta:
        table = "users"


class Lead(models.Model):
    id = fields.CharField(max_length=20, pk=True)
    name = fields.CharField(max_length=200)
    company = fields.CharField(max_length=200, default="")
    phone = fields.CharField(max_length=50, default="")
    email = fields.CharField(max_length=200, default="")
    course_id = fields.CharField(max_length=50)
    source = fields.CharField(max_length=100, default="")
    priority = fields.CharField(max_length=20, default="Medium")
    status = fields.CharField(max_length=50, default="New Interest")
    inquiry_date = fields.CharField(max_length=10)
    assigned_to = fields.CharField(max_length=10, default="")
    notes = fields.JSONField(default=list)
    follow_ups = fields.JSONField(default=list)

    class Meta:
        table = "leads"


class Trainee(models.Model):
    id = fields.CharField(max_length=20, pk=True)
    lead_id = fields.CharField(max_length=20)
    name = fields.CharField(max_length=200)
    company = fields.CharField(max_length=200, default="")
    phone = fields.CharField(max_length=50, default="")
    email = fields.CharField(max_length=200, default="")
    course_id = fields.CharField(max_length=50)
    total_cost = fields.FloatField()
    registration_date = fields.CharField(max_length=10)
    payment_method = fields.CharField(max_length=50, default="")
    paid = fields.FloatField(default=0)
    plan = fields.JSONField(default=list)
    payment_notes = fields.CharField(max_length=1000, default="")
    enrollment = fields.JSONField(null=True, default=None)
    certificate = fields.JSONField(null=True, default=None)
    stage = fields.CharField(max_length=50, default="initial-payment")

    class Meta:
        table = "trainees"
