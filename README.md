<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0f2d5e,e87722&height=200&section=header&text=Radian%20Training%20Tracker&fontSize=42&fontColor=ffffff&fontAlignY=38&desc=CRM%20%2B%20Training%20Management%20for%20Professional%20Courses&descAlignY=58&descSize=16&animation=fadeIn" width="100%"/>

<br/>

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Inter&weight=500&size=18&duration=3000&pause=1000&color=0f2d5e&center=true&vCenter=true&width=600&lines=Track+leads+through+every+stage+of+enrollment;Manage+payments%2C+installments+%26+certificates;Export+branded+PDF+statements+%26+Excel+reports;Built+for+Radian+Training+Centre)](https://github.com/youngdaggerduc/Radian-Training-Tracker)

<br/>

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

</div>

---

## What is this?

Radian Training Tracker is an internal operations platform built for **Radian Training Centre** — a professional certification and skills training company based in Trinidad & Tobago.

It replaces spreadsheets with a unified system that handles the full student lifecycle: from the moment a prospect enquires about a course, through enrollment and installment payments, to certificate issuance.

---

## Features

### Lead Pipeline
A Kanban-style CRM tracks every prospect from first contact to enrollment (or loss). Each lead card holds the enquiry date, assigned staff member, course of interest, source, and priority. Staff can log notes, add follow-up reminders, and move leads through stages: **New → Contacted → Interested → Enrolled → Lost**.

### Trainee Management
Once enrolled, a lead becomes a trainee with a full profile: course, cohort, payment plan, certificate status, and notes. The payments tab shows every installment — paid, pending, and overdue — with the outstanding balance calculated automatically.

### Payments & Installments
Trainees can be on any payment plan. Each payment is recorded with an amount, date, and receipt reference. The system flags overdue installments and surfaces them in the dashboard's notification bell.

### Certificate Tracking
Staff mark when a certificate is ready for collection and when it's been handed over. The trainee drawer shows the cert stage with a one-click status update.

### Company View
All leads and trainees are grouped by their employer/company. The Companies page shows each organization's total revenue collected, outstanding balance, active leads, and enrolled trainees — useful for corporate accounts where a company sends multiple staff for training.

### Exports
- **Trainee Account Statement** — branded PDF for a specific trainee showing their course, full payment history, and balance
- **Company Account Statement** — same but rolled up for all trainees under one company
- **Excel/PDF reports** — leads by status, payments by stage, full schedule, company-level summary — all filterable

### Dashboard
At-a-glance stats: active leads, enrolled trainees, revenue collected this month, outstanding balance. A notification bell surfaces time-sensitive follow-ups — overdue payments, leads that have gone cold, certificates ready for pickup.

### Staff Accounts
Multi-user with two roles: **Admin** (full access, can manage staff accounts) and **Staff** (standard CRM access). Each staff member has their own login; leads and trainees can be assigned to specific staff.

### WhatsApp Templates
Inside each trainee or lead drawer, staff can copy pre-written WhatsApp message templates — registration confirmation, payment reminders, certificate ready notices — with a single click.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | FastAPI + Tortoise ORM |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Frontend | React 18 + Vite |
| Auth | JWT (python-jose + bcrypt) |
| PDF exports | jsPDF + autoTable |
| Excel exports | SheetJS (xlsx) |
| Hosting | Render (API) + Vercel (frontend) |

---

## Data Model

```
Lead
 ├── name, company, phone, email
 ├── courseId, source, priority, assignedTo
 ├── stage (new → contacted → interested → enrolled → lost)
 └── notes[], followUps[]

Trainee
 ├── name, company, phone, email
 ├── courseId, cohort, enrollmentDate
 ├── payments[]  (amount, date, receipt)
 ├── certReady, certCollected
 └── notes[]

Course
 └── name, duration, price

User (staff)
 └── username, passwordHash, role (admin | staff)
```

---

## Deployment

Hosted on **Render** (backend, free tier with optional $7/mo always-on upgrade) and **Vercel** (frontend, always free). Full step-by-step setup is in [`CLAUDE.md`](./CLAUDE.md).

<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=0f2d5e,e87722&height=100&section=footer&animation=fadeIn" width="100%"/>
</div>
