from datetime import date, timedelta


def build_seed():
    def d(offset=0):
        return (date.today() + timedelta(days=offset)).isoformat()

    leads = [
        {
            "id": "L-1041", "name": "Jevon Marcano", "company": "BPTT",
            "phone": "+1-868-732-4051", "email": "jmarcano@bptt-eng.com",
            "course_id": "cisrs-l1", "source": "Website", "priority": "High",
            "status": "Interested", "inquiry_date": d(-3), "assigned_to": "s1",
            "notes": [
                {"date": d(-3), "by": "s1", "text": "Inquired about Level 1 — has 6 months yard experience. Wants June batch."},
                {"date": d(-1), "by": "s1", "text": "Confirmed budget approval from BPTT. Awaiting purchase order."},
            ],
            "follow_ups": [
                {"id": "F1", "date": d(1), "time": "10:00", "method": "Call", "notes": "PO confirmation call", "outcome": ""},
            ],
        },
        {
            "id": "L-1042", "name": "Ronaldo Persad", "company": "Massy Energy",
            "phone": "+1-868-680-2231", "email": "rpersad@massy.tt",
            "course_id": "cisrs-supv", "source": "Referral", "priority": "High",
            "status": "Contacted", "inquiry_date": d(-5), "assigned_to": "s2",
            "notes": [
                {"date": d(-5), "by": "s2", "text": "Referred by L. Bissessar. Holds Level 2, needs supervisor cert."},
            ],
            "follow_ups": [
                {"id": "F2", "date": d(-1), "time": "14:00", "method": "WhatsApp", "notes": "Send course outline + dates", "outcome": ""},
            ],
        },
        {
            "id": "L-1043", "name": "Anisa Mohammed", "company": "",
            "phone": "+1-868-471-0089", "email": "anisa.m@gmail.com",
            "course_id": "gms-wah", "source": "WhatsApp", "priority": "Medium",
            "status": "New Interest", "inquiry_date": d(-1), "assigned_to": "s1",
            "notes": [], "follow_ups": [],
        },
        {
            "id": "L-1044", "name": "Kareem Joseph", "company": "Atlantic LNG",
            "phone": "+1-868-322-7766", "email": "kjoseph@atlanticlng.com",
            "course_id": "cisrs-adv-insp", "source": "Phone", "priority": "Medium",
            "status": "Follow Up Needed", "inquiry_date": d(-10), "assigned_to": "s3",
            "notes": [
                {"date": d(-10), "by": "s3", "text": "Wants to confirm dates after site rotation ends."},
            ],
            "follow_ups": [
                {"id": "F3", "date": d(-2), "time": "09:30", "method": "Call", "notes": "Rotation schedule check", "outcome": ""},
            ],
        },
        {
            "id": "L-1045", "name": "Shanice Williams", "company": "Trinity Exploration",
            "phone": "+1-868-298-1145", "email": "swilliams@trinity-exp.com",
            "course_id": "gms-adv-r", "source": "Website", "priority": "Low",
            "status": "New Interest", "inquiry_date": d(0), "assigned_to": "s2",
            "notes": [], "follow_ups": [],
        },
        {
            "id": "L-1046", "name": "Devon Bachan", "company": "NGC",
            "phone": "+1-868-455-2009", "email": "dbachan@ngc.co.tt",
            "course_id": "cisrs-l2a", "source": "Walk-in", "priority": "High",
            "status": "Interested", "inquiry_date": d(-2), "assigned_to": "s1",
            "notes": [
                {"date": d(-2), "by": "s1", "text": "Walked in with team manager. Possibly enrolling 3 staff."},
            ],
            "follow_ups": [],
        },
    ]

    trainees = [
        {
            "id": "T-2008", "lead_id": "L-1040", "name": "John Smith",
            "company": "BHP Trinidad", "phone": "+1-868-721-9912", "email": "jsmith@bhp.com",
            "course_id": "cisrs-l1", "total_cost": 8437.50,
            "registration_date": d(-22), "payment_method": "Bank Transfer", "paid": 4218.75,
            "plan": [
                {"id": "P1", "amount": 4218.75, "due": d(-22), "paid": True, "paidOn": d(-22), "method": "Bank Transfer", "ref": "BT-228841", "label": "Deposit"},
                {"id": "P2", "amount": 4218.75, "due": d(1), "paid": False, "method": "", "ref": "", "label": "Balance"},
            ],
            "payment_notes": "Deposit confirmed. Final payment due before enrollment.",
            "enrollment": None, "certificate": None, "stage": "payment-plan",
        },
        {
            "id": "T-2009", "lead_id": "L-1039", "name": "Sarah Williams",
            "company": "Heritage Petroleum", "phone": "+1-868-689-5510", "email": "swilliams@heritage-pet.com",
            "course_id": "cisrs-supv", "total_cost": 7875.00,
            "registration_date": d(-18), "payment_method": "Company Credit", "paid": 3000.00,
            "plan": [
                {"id": "P1", "amount": 3000.00, "due": d(-18), "paid": True, "paidOn": d(-18), "method": "Company Credit", "ref": "INV-7741", "label": "Deposit"},
                {"id": "P2", "amount": 2437.50, "due": d(-4), "paid": False, "method": "", "ref": "", "label": "Instalment 2"},
                {"id": "P3", "amount": 2437.50, "due": d(10), "paid": False, "method": "", "ref": "", "label": "Balance"},
            ],
            "payment_notes": "PO# H-2206 issued; client AP delay flagged.",
            "enrollment": None, "certificate": None, "stage": "payment-plan",
        },
        {
            "id": "T-2010", "lead_id": "L-1037", "name": "Marlon Cuffy",
            "company": "Shell Trinidad", "phone": "+1-868-712-3318", "email": "mcuffy@shell.com",
            "course_id": "cisrs-basic-insp", "total_cost": 6750.00,
            "registration_date": d(-30), "payment_method": "Bank Transfer", "paid": 6750.00,
            "plan": [
                {"id": "P1", "amount": 6750.00, "due": d(-30), "paid": True, "paidOn": d(-30), "method": "Bank Transfer", "ref": "BT-228812", "label": "Full Payment"},
            ],
            "payment_notes": "",
            "enrollment": {
                "startDate": d(5), "endDate": d(7), "instructor": "i1",
                "location": "Radian Training Yard — Couva", "batch": "CISRS-INS-26-04",
                "status": "Enrolled", "enrollmentDate": d(-10),
            },
            "certificate": None, "stage": "enrolled",
        },
        {
            "id": "T-2011", "lead_id": "L-1036", "name": "Tina Ramnarine",
            "company": "Phoenix Park Gas", "phone": "+1-868-432-5567", "email": "tramnarine@ppgpl.com",
            "course_id": "gms-wah", "total_cost": 675.00,
            "registration_date": d(-15), "payment_method": "Card", "paid": 675.00,
            "plan": [
                {"id": "P1", "amount": 675.00, "due": d(-15), "paid": True, "paidOn": d(-15), "method": "Card", "ref": "VISA-...4421", "label": "Full Payment"},
            ],
            "payment_notes": "",
            "enrollment": {
                "startDate": d(-2), "endDate": d(-2), "instructor": "i3",
                "location": "Radian Training Yard — Point Lisas", "batch": "GMS-WAH-26-11",
                "status": "Attending", "enrollmentDate": d(-8),
            },
            "certificate": None, "stage": "enrolled",
        },
        {
            "id": "T-2007", "lead_id": "L-1031", "name": "Hassan Ali",
            "company": "Atlantic LNG", "phone": "+1-868-655-2010", "email": "hali@atlanticlng.com",
            "course_id": "cisrs-l1", "total_cost": 8437.50,
            "registration_date": d(-45), "payment_method": "Bank Transfer", "paid": 8437.50,
            "plan": [
                {"id": "P1", "amount": 8437.50, "due": d(-45), "paid": True, "paidOn": d(-45), "method": "Bank Transfer", "ref": "BT-228701", "label": "Full Payment"},
            ],
            "payment_notes": "",
            "enrollment": {
                "startDate": d(-12), "endDate": d(-8), "instructor": "i2",
                "location": "Radian Training Yard — Couva", "batch": "CISRS-L1-26-03",
                "status": "Completed", "enrollmentDate": d(-30),
            },
            "certificate": {
                "completionDate": d(-8), "number": "CISRS/L1/26/00141",
                "status": "Ready for Collection", "readyOn": d(-3),
                "collectionDate": None, "collectedBy": "", "idVerified": False, "staffNotes": "",
            },
            "stage": "cert-ready",
        },
        {
            "id": "T-2006", "lead_id": "L-1028", "name": "Renee Boodram",
            "company": "Massy Energy", "phone": "+1-868-789-3322", "email": "rboodram@massy.tt",
            "course_id": "cisrs-l2a", "total_cost": 8437.50,
            "registration_date": d(-60), "payment_method": "Company Credit", "paid": 8437.50,
            "plan": [
                {"id": "P1", "amount": 8437.50, "due": d(-60), "paid": True, "paidOn": d(-58), "method": "Company Credit", "ref": "INV-7689", "label": "Full Payment"},
            ],
            "payment_notes": "",
            "enrollment": {
                "startDate": d(-25), "endDate": d(-21), "instructor": "i1",
                "location": "Radian Training Yard — Couva", "batch": "CISRS-L2-26-02",
                "status": "Completed", "enrollmentDate": d(-50),
            },
            "certificate": {
                "completionDate": d(-21), "number": "CISRS/L2/26/00098",
                "status": "Collected", "readyOn": d(-18),
                "collectionDate": d(-12), "collectedBy": "Renee Boodram",
                "idVerified": True, "staffNotes": "Drivers permit verified, signed for in pickup log.",
            },
            "stage": "cert-collected",
        },
        {
            "id": "T-2012", "lead_id": "L-1038", "name": "Adrian Lewis",
            "company": "", "phone": "+1-868-411-5598", "email": "adrian.lewis@yahoo.com",
            "course_id": "gms-basic-r", "total_cost": 1687.50,
            "registration_date": d(-8), "payment_method": "Cash", "paid": 1687.50,
            "plan": [
                {"id": "P1", "amount": 1687.50, "due": d(-8), "paid": True, "paidOn": d(-8), "method": "Cash", "ref": "RCT-0091", "label": "Full Payment"},
            ],
            "payment_notes": "",
            "enrollment": None, "certificate": None, "stage": "payment-complete",
        },
    ]

    return leads, trainees
