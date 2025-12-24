from ninja import Schema
from uuid import UUID
from typing import Optional, List, Literal

Role = Literal["admin", "requestor", "viewer"]

class UserSchema(Schema):
    id: UUID
    email: str

class RegisterSchema(Schema):
    email: str
    password: str

class TeamSchema(Schema):
    id: UUID
    name: str

class MembershipSchema(Schema):
    id: UUID
    role: str
    team: TeamSchema
    user: UserSchema

class MembershipOut(Schema):
    team_id: UUID
    team_name: str
    role: str

class UserOut(Schema):
    id: UUID
    email: str
    memberships: List[MembershipOut]

class UserUpdateSchema(Schema):
    email: Optional[str] = None

class MemberOut(Schema):
    id: UUID
    email: str
    role: Role

class UserSearchOut(Schema):
    id: UUID
    email: str

class InviteIn(Schema):
    email: str
    role: Role = "viewer"

class UpdateMemberIn(Schema):
    role: Role

class CreateMemberIn(Schema):
    email: str
    role: Role = "viewer"

class TeamSchema(Schema):
    id: str
    name: str

class TeamCreateIn(Schema):
    name: str

class SiteSettingOut(Schema):
    allow_registration: bool

class SiteSettingIn(Schema):
    allow_registration: bool

class PasswordChangeIn(Schema):
    current_password: str
    new_password: str