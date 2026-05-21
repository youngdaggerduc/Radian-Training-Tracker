from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Any, Optional

from app.deps import get_current_user
from app.models import Course, Lead, Trainee, User
from app.seed import build_seed

router = APIRouter(prefix="/api", tags=["api"], dependencies=[Depends(get_current_user)])


# ── Serialisation helpers ─────────────────────────────────────────────────────

def lead_out(l: Lead) -> dict:
    return {
        "id": l.id,
        "name": l.name,
        "company": l.company,
        "phone": l.phone,
        "email": l.email,
        "gender": l.gender,
        "courseId": l.course_id,
        "source": l.source,
        "priority": l.priority,
        "status": l.status,
        "inquiryDate": l.inquiry_date,
        "assignedTo": l.assigned_to,
        "notes": l.notes,
        "followUps": l.follow_ups,
    }


def trainee_out(t: Trainee) -> dict:
    return {
        "id": t.id,
        "leadId": t.lead_id,
        "name": t.name,
        "company": t.company,
        "phone": t.phone,
        "email": t.email,
        "gender": t.gender,
        "courseId": t.course_id,
        "totalCost": t.total_cost,
        "registrationDate": t.registration_date,
        "paymentMethod": t.payment_method,
        "paid": t.paid,
        "plan": t.plan,
        "paymentNotes": t.payment_notes,
        "notes": t.notes,
        "enrollment": t.enrollment,
        "certificate": t.certificate,
        "stage": t.stage,
    }


# ── ID generation ─────────────────────────────────────────────────────────────

async def next_lead_id() -> str:
    ids = await Lead.all().values_list("id", flat=True)
    nums = [int(i[2:]) for i in ids if i.startswith("L-") and i[2:].isdigit()]
    return f"L-{max(nums) + 1}" if nums else "L-1047"


async def next_trainee_id() -> str:
    ids = await Trainee.all().values_list("id", flat=True)
    nums = [int(i[2:]) for i in ids if i.startswith("T-") and i[2:].isdigit()]
    return f"T-{max(nums) + 1}" if nums else "T-2013"


# ── Pydantic models ───────────────────────────────────────────────────────────

class LeadIn(BaseModel):
    name: str
    company: str = ""
    phone: str = ""
    email: str = ""
    gender: str = ""
    courseId: str
    source: str = ""
    priority: str = "Medium"
    status: str = "New Interest"
    inquiryDate: str
    assignedTo: str = ""
    notes: list = []
    followUps: list = []


class LeadPatch(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gender: Optional[str] = None
    courseId: Optional[str] = None
    source: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    inquiryDate: Optional[str] = None
    assignedTo: Optional[str] = None
    notes: Optional[list] = None
    followUps: Optional[list] = None


class TraineeIn(BaseModel):
    leadId: str
    name: str
    company: str = ""
    phone: str = ""
    email: str = ""
    gender: str = ""
    courseId: str
    totalCost: float
    registrationDate: str
    paymentMethod: str = ""
    paid: float = 0
    plan: list = []
    paymentNotes: str = ""
    notes: list = []
    enrollment: Optional[dict] = None
    certificate: Optional[dict] = None
    stage: str = "initial-payment"


class TraineePatch(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gender: Optional[str] = None
    courseId: Optional[str] = None
    totalCost: Optional[float] = None
    registrationDate: Optional[str] = None
    paymentMethod: Optional[str] = None
    paid: Optional[float] = None
    plan: Optional[list] = None
    paymentNotes: Optional[str] = None
    notes: Optional[list] = None
    enrollment: Optional[Any] = None
    certificate: Optional[Any] = None
    stage: Optional[str] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

def course_out(c: Course) -> dict:
    return {"id": c.id, "provider": c.provider, "name": c.name, "price": c.price, "days": c.days, "active": c.active}


@router.get("/state")
async def get_state():
    if await Lead.all().count() == 0 and await Trainee.all().count() == 0:
        seed_leads, seed_trainees = build_seed()
        for data in seed_leads:
            await Lead.create(**data)
        for data in seed_trainees:
            await Trainee.create(**data)

    leads    = await Lead.all()
    trainees = await Trainee.all()
    courses  = await Course.all().order_by("provider", "name")
    return {
        "leads":    [lead_out(l) for l in leads],
        "trainees": [trainee_out(t) for t in trainees],
        "courses":  [course_out(c) for c in courses],
    }


@router.post("/leads", status_code=201)
async def create_lead(body: LeadIn):
    new_id = await next_lead_id()
    lead = await Lead.create(
        id=new_id,
        name=body.name,
        company=body.company,
        phone=body.phone,
        email=body.email,
        gender=body.gender,
        course_id=body.courseId,
        source=body.source,
        priority=body.priority,
        status=body.status,
        inquiry_date=body.inquiryDate,
        assigned_to=body.assignedTo,
        notes=body.notes,
        follow_ups=body.followUps,
    )
    return lead_out(lead)


@router.patch("/leads/{lead_id}")
async def update_lead(lead_id: str, body: LeadPatch):
    lead = await Lead.get_or_none(id=lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    updates: dict[str, Any] = {}
    if body.name is not None:       updates["name"] = body.name
    if body.company is not None:    updates["company"] = body.company
    if body.phone is not None:      updates["phone"] = body.phone
    if body.email is not None:      updates["email"] = body.email
    if body.gender is not None:     updates["gender"] = body.gender
    if body.courseId is not None:   updates["course_id"] = body.courseId
    if body.source is not None:     updates["source"] = body.source
    if body.priority is not None:   updates["priority"] = body.priority
    if body.status is not None:     updates["status"] = body.status
    if body.inquiryDate is not None: updates["inquiry_date"] = body.inquiryDate
    if body.assignedTo is not None: updates["assigned_to"] = body.assignedTo
    if body.notes is not None:      updates["notes"] = body.notes
    if body.followUps is not None:  updates["follow_ups"] = body.followUps

    if updates:
        await lead.update_from_dict(updates).save()

    return lead_out(lead)


@router.delete("/leads/{lead_id}", status_code=204)
async def delete_lead(lead_id: str):
    lead = await Lead.get_or_none(id=lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    await lead.delete()


@router.post("/trainees", status_code=201)
async def create_trainee(body: TraineeIn):
    new_id = await next_trainee_id()
    trainee = await Trainee.create(
        id=new_id,
        lead_id=body.leadId,
        name=body.name,
        company=body.company,
        phone=body.phone,
        email=body.email,
        gender=body.gender,
        course_id=body.courseId,
        total_cost=body.totalCost,
        registration_date=body.registrationDate,
        payment_method=body.paymentMethod,
        paid=body.paid,
        plan=body.plan,
        payment_notes=body.paymentNotes,
        notes=body.notes,
        enrollment=body.enrollment,
        certificate=body.certificate,
        stage=body.stage,
    )
    return trainee_out(trainee)


@router.patch("/trainees/{trainee_id}")
async def update_trainee(trainee_id: str, body: TraineePatch):
    trainee = await Trainee.get_or_none(id=trainee_id)
    if not trainee:
        raise HTTPException(status_code=404, detail="Trainee not found")

    updates: dict[str, Any] = {}
    if body.name is not None:             updates["name"] = body.name
    if body.company is not None:          updates["company"] = body.company
    if body.phone is not None:            updates["phone"] = body.phone
    if body.email is not None:            updates["email"] = body.email
    if body.gender is not None:           updates["gender"] = body.gender
    if body.courseId is not None:         updates["course_id"] = body.courseId
    if body.totalCost is not None:        updates["total_cost"] = body.totalCost
    if body.registrationDate is not None: updates["registration_date"] = body.registrationDate
    if body.paymentMethod is not None:    updates["payment_method"] = body.paymentMethod
    if body.paid is not None:             updates["paid"] = body.paid
    if body.plan is not None:             updates["plan"] = body.plan
    if body.paymentNotes is not None:     updates["payment_notes"] = body.paymentNotes
    if body.notes is not None:            updates["notes"] = body.notes
    if body.enrollment is not None:       updates["enrollment"] = body.enrollment
    if body.certificate is not None:      updates["certificate"] = body.certificate
    if body.stage is not None:            updates["stage"] = body.stage

    if updates:
        await trainee.update_from_dict(updates).save()

    return trainee_out(trainee)


@router.delete("/trainees/{trainee_id}", status_code=204)
async def delete_trainee(trainee_id: str):
    trainee = await Trainee.get_or_none(id=trainee_id)
    if not trainee:
        raise HTTPException(status_code=404, detail="Trainee not found")
    await trainee.delete()

    return trainee_out(trainee)
