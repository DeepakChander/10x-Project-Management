"""
Pydantic models for the Role Management & Permission system.

Covers organizations, departments, teams, memberships, roles, and permissions.
"""

from datetime import datetime
from enum import IntEnum
from typing import Optional

from pydantic import BaseModel, Field


# ── Role Hierarchy ──────────────────────────────────────────────

class RoleLevel(IntEnum):
    """7-level role hierarchy. Higher number = more authority."""
    AGENT = 1
    VIEWER = 2
    MEMBER = 3
    LEAD = 4
    MANAGER = 5
    ADMIN = 6
    OWNER = 7


ROLE_NAMES = {v: v.name.lower() for v in RoleLevel}
ROLE_FROM_NAME = {name: level for level, name in ROLE_NAMES.items()}


# ── User Profile ────────────────────────────────────────────────

class UserProfileBase(BaseModel):
    email: str = Field(..., min_length=3)
    display_name: str = Field(..., min_length=1, max_length=255)
    avatar_url: Optional[str] = None
    user_type: str = Field(default="human", pattern="^(human|agent)$")


class UserProfileCreate(UserProfileBase):
    pass


class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = Field(None, min_length=1, max_length=255)
    avatar_url: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|inactive)$")


class UserProfile(UserProfileBase):
    id: str
    status: str = "active"
    created_at: datetime
    updated_at: datetime
    last_active_at: Optional[datetime] = None


# ── Organization ────────────────────────────────────────────────

class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255, pattern="^[a-z0-9-]+$")


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    settings: Optional[dict] = None


class Organization(OrganizationBase):
    id: str
    owner_id: str
    settings: dict = {}
    created_at: datetime
    updated_at: datetime


# ── Department ──────────────────────────────────────────────────

class DepartmentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class DepartmentCreate(DepartmentBase):
    org_id: str


class DepartmentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    head_id: Optional[str] = None


class Department(DepartmentBase):
    id: str
    org_id: str
    head_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Team ────────────────────────────────────────────────────────

class TeamBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class TeamCreate(TeamBase):
    department_id: str


class TeamUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    lead_id: Optional[str] = None


class Team(TeamBase):
    id: str
    department_id: str
    lead_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Organization Membership ─────────────────────────────────────

class OrgMembershipCreate(BaseModel):
    user_id: str
    org_id: str
    org_role: str = Field(default="member", pattern="^(agent|viewer|member|lead|manager|admin|owner)$")
    department_id: Optional[str] = None
    team_id: Optional[str] = None


class OrgMembershipUpdate(BaseModel):
    org_role: Optional[str] = Field(None, pattern="^(agent|viewer|member|lead|manager|admin|owner)$")
    department_id: Optional[str] = None
    team_id: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(invited|active|deactivated)$")


class OrgMembership(BaseModel):
    id: str
    user_id: str
    org_id: str
    department_id: Optional[str] = None
    team_id: Optional[str] = None
    org_role: str
    status: str
    invited_by: Optional[str] = None
    joined_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


# ── Project Membership ──────────────────────────────────────────

class ProjectMembershipCreate(BaseModel):
    user_id: str
    project_id: str
    project_role: str = Field(default="member", pattern="^(agent|viewer|member|lead|manager|admin|owner)$")


class ProjectMembershipUpdate(BaseModel):
    project_role: Optional[str] = Field(None, pattern="^(agent|viewer|member|lead|manager|admin|owner)$")


class ProjectMembership(BaseModel):
    id: str
    user_id: str
    project_id: str
    project_role: str
    assigned_by: Optional[str] = None
    assigned_at: datetime
    created_at: datetime
    updated_at: datetime


# ── Permission ──────────────────────────────────────────────────

class Permission(BaseModel):
    id: str
    role: str
    resource: str
    action: str
    scope: str
    conditions: dict = {}
    created_at: datetime


# ── Role Assignment (Audit) ─────────────────────────────────────

class RoleAssignment(BaseModel):
    id: str
    user_id: str
    role: str
    scope_type: str
    scope_id: str
    assigned_by: Optional[str] = None
    assigned_at: datetime
    expires_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    revoked_by: Optional[str] = None


# ── Role Resolution Response ────────────────────────────────────

class EffectiveRoleResponse(BaseModel):
    user_id: str
    org_role: Optional[str] = None
    project_role: Optional[str] = None
    effective_role: Optional[str] = None
    effective_level: int = 0


class PermissionCheckResponse(BaseModel):
    allowed: bool
    user_id: str
    resource: str
    action: str
    effective_role: Optional[str] = None
    reason: str = ""
