# Management command: seed Shinhan Bank VN departments, staff, projects & issues.
# Data definitions in: plane/bgtasks/seed_department_staff_data.py

import random
from datetime import datetime, date, timedelta

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Max

from plane.db.models import (
    User, Workspace, WorkspaceMember, Project, ProjectMember,
    State, Issue, IssueSequence, IssueActivity, IssueAssignee,
    Department, StaffProfile,
)
from plane.bgtasks.seed_department_staff_data import (
    DEPARTMENTS, STAFF_DATA, LINKED_PROJECTS, CROSS_PROJECTS,
    CROSS_TEAM_MEMBERS, ISSUE_TEMPLATES,
)


def _all_seed_identifiers():
    return [p[2] for p in LINKED_PROJECTS] + [p[1] for p in CROSS_PROJECTS]


class Command(BaseCommand):
    help = "Seed departments, staff, projects & dummy issues for Shinhan Bank VN"

    def add_arguments(self, parser):
        parser.add_argument("--workspace", type=str, help="Workspace slug")
        parser.add_argument("--email", type=str, help="Admin user email")
        parser.add_argument("--clean", action="store_true", help="Delete existing seed data first")

    def handle(self, *args, **options):
        try:
            ws, admin = self._resolve_context(options)
            self.stdout.write(f"Workspace: {ws.name} | Admin: {admin.email}")
            if options.get("clean"):
                self._clean(ws)
            with transaction.atomic():
                depts = self._seed_departments(ws, admin)
                projects = self._seed_projects(ws, admin, depts)
                users = self._seed_staff(ws, admin, depts)
                self._seed_memberships(ws, depts, projects, users)
                self._seed_cross_team(ws, projects, users)
                self._seed_issues(ws, admin, projects)
            self._summary(ws)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error: {e}"))
            raise

    def _resolve_context(self, options):
        ws_slug = options.get("workspace")
        ws = Workspace.objects.get(slug=ws_slug) if ws_slug else Workspace.objects.first()
        if not ws:
            raise CommandError("No workspace found.")
        email = options.get("email")
        if email:
            admin = User.objects.get(email=email)
        else:
            wm = WorkspaceMember.objects.filter(workspace=ws, role=20).first()
            admin = wm.member if wm else User.objects.filter(is_superuser=True).first()
        if not admin:
            raise CommandError("No admin user found.")
        return ws, admin

    def _clean(self, ws):
        self.stdout.write("Cleaning...")
        StaffProfile.objects.filter(workspace=ws).delete()
        Project.objects.filter(workspace=ws, identifier__in=_all_seed_identifiers()).delete()
        Department.objects.filter(workspace=ws).delete()
        User.objects.filter(email__endswith="@swing.shinhan.com").delete()

    def _seed_departments(self, ws, admin):
        self.stdout.write("Seeding departments...")
        dept_map, order = {}, 1000
        for d in DEPARTMENTS:
            dept, created = Department.objects.get_or_create(
                workspace=ws, code=d["code"],
                defaults={
                    "name": d["name"], "short_name": d["short_name"], "dept_code": d["dept_code"],
                    "level": d["level"], "parent": dept_map.get(d["parent_code"]),
                    "sort_order": order, "created_by": admin, "updated_by": admin,
                },
            )
            dept_map[d["code"]] = dept
            order += 1000
            self.stdout.write(f"  {'+ ' if created else '= '}{d['code']} — {d['name']}")
        self.stdout.write(self.style.SUCCESS(f"  {len(dept_map)} departments."))
        return dept_map

    def _seed_projects(self, ws, admin, depts):
        self.stdout.write("Seeding projects...")
        proj_map = {}
        for dept_code, name, ident in LINKED_PROJECTS:
            proj, created = Project.objects.get_or_create(
                workspace=ws, identifier=ident,
                defaults={"name": name, "network": 0, "created_by": admin},
            )
            proj_map[ident] = proj
            if created:
                dept = depts.get(dept_code)
                if dept:
                    dept.linked_project = proj
                    dept.save(update_fields=["linked_project"])
                self._create_states(ws, proj, admin)
                self.stdout.write(f"  + {ident}: {name} → {dept_code}")
        for name, ident in CROSS_PROJECTS:
            proj, created = Project.objects.get_or_create(
                workspace=ws, identifier=ident,
                defaults={"name": name, "network": 0, "created_by": admin},
            )
            proj_map[ident] = proj
            if created:
                self._create_states(ws, proj, admin)
                self.stdout.write(f"  + {ident}: {name} (cross)")
        for proj in proj_map.values():
            ProjectMember.objects.get_or_create(
                project=proj, member=admin, defaults={"role": 20, "workspace": ws},
            )
        self.stdout.write(self.style.SUCCESS(f"  {len(proj_map)} projects."))
        return proj_map

    def _create_states(self, ws, proj, admin):
        states = [
            ("Backlog", "#A3A3A3", 15000, "backlog", True), ("Todo", "#3A3A3A", 25000, "unstarted", False),
            ("In Progress", "#F59E0B", 35000, "started", False), ("Done", "#16A34A", 45000, "completed", False),
            ("Cancelled", "#EF4444", 55000, "cancelled", False),
        ]
        State.objects.bulk_create([
            State(name=n, color=c, sequence=s, group=g, default=d, project=proj, workspace=ws, created_by=admin)
            for n, c, s, g, d in states
        ], ignore_conflicts=True)

    def _seed_staff(self, ws, admin, depts):
        self.stdout.write("Seeding staff...")
        user_map = {}
        for sid, ln, fn, dc, pos, grade, is_mgr, phone, joining in STAFF_DATA:
            email = f"sh{sid}@swing.shinhan.com"
            user, uc = User.objects.get_or_create(
                email=email, defaults={"username": email, "first_name": fn, "last_name": ln, "is_password_autoset": True},
            )
            if uc:
                user.set_password("Shinhan@2026")
                user.save(update_fields=["password"])
            user_map[sid] = user
            WorkspaceMember.objects.get_or_create(workspace=ws, member=user, defaults={"role": 20 if is_mgr else 15})
            emp_status, leaving = "active", None
            if sid == "18506420":
                emp_status = "probation"
            elif sid == "18506421":
                emp_status, leaving = "resigned", date(2024, 6, 30)
            dept = depts.get(dc)
            _, pc = StaffProfile.objects.get_or_create(
                workspace=ws, staff_id=sid,
                defaults={
                    "user": user, "department": dept, "position": pos, "job_grade": grade,
                    "phone": phone, "date_of_joining": datetime.strptime(joining, "%Y-%m-%d").date(),
                    "date_of_leaving": leaving, "employment_status": emp_status,
                    "is_department_manager": is_mgr, "created_by": admin, "updated_by": admin,
                },
            )
            if is_mgr and dept and pc:
                dept.manager = user
                dept.save(update_fields=["manager"])
        self.stdout.write(self.style.SUCCESS(f"  {len(user_map)} staff."))
        return user_map

    def _seed_memberships(self, ws, depts, projects, users):
        self.stdout.write("Assigning memberships...")
        count = 0
        for dc, _, ident in LINKED_PROJECTS:
            dept, proj = depts.get(dc), projects.get(ident)
            if not dept or not proj:
                continue
            for sp in StaffProfile.objects.filter(workspace=ws, department=dept, employment_status__in=["active", "probation"]):
                _, c = ProjectMember.objects.get_or_create(
                    project=proj, member=sp.user, defaults={"role": 20 if sp.is_department_manager else 15, "workspace": ws},
                )
                count += c
            parent = dept.parent
            while parent:
                for mp in StaffProfile.objects.filter(workspace=ws, department=parent, is_department_manager=True, employment_status="active"):
                    _, c = ProjectMember.objects.get_or_create(project=proj, member=mp.user, defaults={"role": 15, "workspace": ws})
                    count += c
                parent = parent.parent
        self.stdout.write(self.style.SUCCESS(f"  {count} memberships."))

    def _seed_cross_team(self, ws, projects, users):
        for ident, sids in CROSS_TEAM_MEMBERS.items():
            proj = projects.get(ident)
            if not proj:
                continue
            for sid in sids:
                user = users.get(sid)
                if user:
                    ProjectMember.objects.get_or_create(project=proj, member=user, defaults={"role": 15, "workspace": ws})

    def _seed_issues(self, ws, admin, projects):
        self.stdout.write("Seeding issues...")
        total = 0
        for ident, proj in projects.items():
            templates = ISSUE_TEMPLATES.get(ident, [])
            if not templates:
                continue
            states = list(State.objects.filter(workspace=ws, project=proj).exclude(group="cancelled").values_list("id", flat=True))
            members = list(ProjectMember.objects.filter(project=proj, is_active=True).values_list("member_id", flat=True))
            if not states or not members:
                continue
            seq = (IssueSequence.objects.filter(project=proj).aggregate(m=Max("sequence"))["m"] or 0) + 1
            sort = 65535
            issues = []
            for name, prio in templates:
                issues.append(Issue(
                    name=name, priority=prio, state_id=random.choice(states), project=proj, workspace=ws,
                    sequence_id=seq, sort_order=sort, created_by_id=random.choice(members),
                    description_html=f"<p>{name}</p>", description_stripped=name,
                    start_date=date.today() - timedelta(days=random.randint(0, 14)),
                    target_date=date.today() + timedelta(days=random.randint(7, 60)),
                ))
                seq += 1
                sort += random.randint(1000, 5000)
            created = Issue.objects.bulk_create(issues, ignore_conflicts=True)
            IssueSequence.objects.bulk_create([
                IssueSequence(issue=i, sequence=i.sequence_id, project=proj, workspace=ws) for i in created
            ], batch_size=100, ignore_conflicts=True)
            IssueActivity.objects.bulk_create([
                IssueActivity(issue=i, actor=admin, project=proj, workspace=ws, comment="created the issue", verb="created", created_by=admin)
                for i in created
            ], batch_size=100, ignore_conflicts=True)
            assignees = []
            for i in created:
                for aid in random.sample(members, random.randint(1, min(3, len(members)))):
                    assignees.append(IssueAssignee(issue=i, assignee_id=aid, project=proj, workspace=ws))
            IssueAssignee.objects.bulk_create(assignees, batch_size=100, ignore_conflicts=True)
            total += len(created)
            self.stdout.write(f"  + {ident}: {len(created)} issues")
        self.stdout.write(self.style.SUCCESS(f"  {total} issues total."))

    def _summary(self, ws):
        self.stdout.write("\n" + "=" * 50)
        self.stdout.write("SEED SUMMARY")
        self.stdout.write(f"  Departments: {Department.objects.filter(workspace=ws).count()} (L1:{Department.objects.filter(workspace=ws, level=1).count()} L2:{Department.objects.filter(workspace=ws, level=2).count()} L3:{Department.objects.filter(workspace=ws, level=3).count()})")
        sp = StaffProfile.objects.filter(workspace=ws)
        self.stdout.write(f"  Staff: {sp.count()} (active:{sp.filter(employment_status='active').count()} probation:{sp.filter(employment_status='probation').count()} resigned:{sp.filter(employment_status='resigned').count()})")
        ids = _all_seed_identifiers()
        self.stdout.write(f"  Projects: {Project.objects.filter(workspace=ws, identifier__in=ids).count()} ({len(LINKED_PROJECTS)} linked + {len(CROSS_PROJECTS)} cross)")
        ic = sum(Issue.objects.filter(project__identifier=i, workspace=ws).count() for i in ids)
        self.stdout.write(f"  Issues: {ic}")
        self.stdout.write("=" * 50)
        self.stdout.write(self.style.SUCCESS("Seed completed!"))
