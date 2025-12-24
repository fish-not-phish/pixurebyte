from ninja import Router
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from .models import SiteSetting, Team, Membership
from .schemas import *
from typing import List
from ninja_jwt.authentication import JWTAuth
import uuid as pyuuid
from django.shortcuts import get_object_or_404
from ninja.errors import HttpError
from django.contrib.auth.models import AbstractBaseUser
from ninja.responses import Response
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

User = get_user_model()
router = Router(tags=["auth"])

@router.post("/register", response=UserSchema)
def register(request, payload: RegisterSchema):
    settings = SiteSetting.get_settings()
    if not settings.allow_registration:
        raise HttpError(403, "User registration is currently disabled.")
    is_first_user = User.objects.count() == 0

    user = User.objects.create(
        email=payload.email,
        password=make_password(payload.password),
        is_staff=is_first_user,
        is_superuser=is_first_user,
    )

    team = Team.objects.create(name="Personal")
    Membership.objects.create(user=user, team=team, role="admin")

    return user

@router.get("/me", response=UserOut, auth=JWTAuth())
def me(request):
    memberships = [
        {
            "team_id": m.team.id,
            "team_name": m.team.name,
            "role": m.role,
        }
        for m in request.user.memberships.select_related("team")
    ]

    return {
        "id": request.user.id,
        "email": request.user.email,
        "memberships": memberships,
    }

@router.patch("/me", response=UserOut, auth=JWTAuth())
def update_me(request, data: UserUpdateSchema):
    if data.email:
        request.user.email = data.email
        request.user.save()

    memberships = [
        {
            "team_id": m.team.id,
            "team_name": m.team.name,
            "role": m.role,
        }
        for m in request.user.memberships.select_related("team")
    ]
    return {
        "id": request.user.id,
        "email": request.user.email,
        "memberships": memberships,
    }

@router.get("/teams", response=List[TeamSchema], auth=JWTAuth())
def get_teams(request):
    memberships = request.user.memberships.select_related("team")
    return [{"id": str(m.team.id), "name": m.team.name} for m in memberships]

@router.get("/memberships", response=List[MembershipSchema], auth=JWTAuth())
def memberships(request):
    return Membership.objects.filter(user=request.user)

@router.get("/teams", response=List[TeamSchema], auth=JWTAuth())
def get_teams(request):
    teams = Team.objects.filter(memberships__user=request.user).distinct()
    return list(teams)

def _require_team_member(team_id: UUID, user: AbstractBaseUser) -> Team:
    team = get_object_or_404(Team, id=team_id)
    if not Membership.objects.filter(user=user, team=team).exists():
        raise HttpError(403, "Not in this team")
    return team

def _require_team_admin(team: Team, user: AbstractBaseUser):
    if not Membership.objects.filter(user=user, team=team, role="admin").exists():
        raise HttpError(403, "Admins only")

@router.get("/team/{team_id}/members", response=List[MemberOut], auth=JWTAuth())
def list_members(request, team_id: UUID):
    team = _require_team_member(team_id, request.user)
    memberships = Membership.objects.filter(team=team).select_related("user")
    return [{"id": m.user.id, "email": m.user.email, "role": m.role} for m in memberships]

@router.patch("/team/{team_id}/members/{user_id}", response=MemberOut, auth=JWTAuth())
def update_member(request, team_id: UUID, user_id: UUID, payload: UpdateMemberIn):
    team = _require_team_member(team_id, request.user)
    _require_team_admin(team, request.user)

    if str(request.user.id) == str(user_id):
        raise HttpError(400, "You cannot change your own role")

    membership = get_object_or_404(Membership, user_id=user_id, team=team)
    membership.role = payload.role
    membership.save()
    return {"id": membership.user.id, "email": membership.user.email, "role": membership.role}

@router.delete("/team/{team_id}/members/{user_id}", auth=JWTAuth())
def remove_member(request, team_id: UUID, user_id: UUID):
    team = _require_team_member(team_id, request.user)
    _require_team_admin(team, request.user)

    if str(request.user.id) == str(user_id):
        raise HttpError(400, "You cannot remove yourself")

    membership = get_object_or_404(Membership, user_id=user_id, team=team)
    membership.delete()
    return {"success": True, "id": str(user_id)}

@router.get("/team/{team_id}/search-users", response=List[UserSearchOut], auth=JWTAuth())
def search_users(request, team_id: UUID, q: str):
    team = _require_team_member(team_id, request.user)
    member_ids = Membership.objects.filter(team=team).values_list("user_id", flat=True)
    users = User.objects.exclude(id__in=member_ids).filter(email__icontains=q)[:10]
    return [{"id": u.id, "email": u.email} for u in users]

@router.post("/team/{team_id}/invite", response=MemberOut, auth=JWTAuth())
def invite_member(request, team_id: UUID, payload: InviteIn):
    team = _require_team_member(team_id, request.user)
    _require_team_admin(team, request.user)

    user = User.objects.filter(email__iexact=payload.email).first()
    if not user:
        raise HttpError(404, "User not found")

    membership, _ = Membership.objects.get_or_create(user=user, team=team, defaults={"role": payload.role})

    return {"id": user.id, "email": user.email, "role": membership.role}

@router.post("/team/{team_id}/create-member", response=CreateMemberOut, auth=JWTAuth())
def create_member(request, team_id: UUID, payload: CreateMemberIn):
    team = _require_team_member(team_id, request.user)
    _require_team_admin(team, request.user)

    if User.objects.filter(email__iexact=payload.email).exists():
        raise HttpError(400, "User already exists")

    plain_password = pyuuid.uuid4().hex[:12]
    user = User.objects.create(
        email=payload.email,
        password=make_password(plain_password),
        is_superuser=False,
        is_staff=False,
    )
    Membership.objects.create(user=user, team=team, role=payload.role)
    return {"id": user.id, "email": user.email, "role": payload.role, "password": plain_password,}

@router.post("/team/create", response=TeamSchema, auth=JWTAuth())
def create_team(request, payload: TeamCreateIn):
    team = Team.objects.create(name=payload.name)
    Membership.objects.create(user=request.user, team=team, role="admin")
    return {"id": str(team.id), "name": team.name}

@router.get("/settings", response=SiteSettingOut)
def get_site_settings(request):
    setting = SiteSetting.get_settings()
    return SiteSettingOut(allow_registration=setting.allow_registration)

@router.put("/settings", response=SiteSettingOut, auth=JWTAuth())
def update_site_settings(request, payload: SiteSettingIn):
    if not request.user.is_staff:
        return Response({"detail": "Unauthorized"}, status=403)

    setting = SiteSetting.get_settings()
    setting.allow_registration = payload.allow_registration
    setting.save()
    return Response(
        {"allow_registration": setting.allow_registration}, status=200
    )

@router.post("/me/password", auth=JWTAuth())
def change_password(request, payload: PasswordChangeIn):
    user = request.user

    if not user.check_password(payload.current_password):
        raise HttpError(400, "Current password is incorrect")

    try:
        validate_password(payload.new_password, user=user)
    except ValidationError as e:
        raise HttpError(400, e.messages)

    user.set_password(payload.new_password)
    user.save()

    return {"success": True}