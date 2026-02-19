"""
Authentication API

Handles signup, login, logout
"""

import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..services.auth_service import AuthService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignUpRequest(BaseModel):
    email: str
    display_name: str
    password: str
    org_name: str | None = None
    company_domain: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str
    role: str | None = None


class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: str


class LogoutRequest(BaseModel):
    session_token: str


# ── Sign Up ──────────────────────────────────────────────────────

@router.post("/signup")
async def signup(request: SignUpRequest) -> dict[str, Any]:
    """
    Register new user and optionally create organization.

    First user creates org and becomes owner.
    """
    try:
        service = AuthService()
        result = service.register_user(
            email=request.email,
            display_name=request.display_name,
            password=request.password,
            org_name=request.org_name,
        )

        return {
            "message": "User created successfully",
            "user": result["user"],
            "organization": result.get("organization"),
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Signup failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Login ────────────────────────────────────────────────────────

@router.post("/login")
async def login(request: LoginRequest) -> dict[str, Any]:
    """
    Login with email and password.

    Optionally validates role against actual org membership.
    Returns user info and session token.
    """
    try:
        service = AuthService()
        result = service.login(
            email=request.email,
            password=request.password,
            role=request.role,
        )

        return {
            "message": "Login successful",
            "user": result["user"],
            "session_token": result["session_token"],
        }

    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        logger.error(f"Login failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Email Verification ────────────────────────────────────────────

@router.post("/verify-email")
async def verify_email(request: VerifyEmailRequest) -> dict[str, Any]:
    """Verify user email using token from the verification link."""
    try:
        service = AuthService()
        result = service.verify_email(request.token)
        return {"message": "Email verified successfully", **result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Email verification failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/resend-verification")
async def resend_verification(request: ResendVerificationRequest) -> dict[str, Any]:
    """Resend email verification link for an unverified user."""
    try:
        service = AuthService()
        service.resend_verification(request.email)
        return {"message": "Verification email sent"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Resend verification failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Logout ───────────────────────────────────────────────────────

@router.post("/logout")
async def logout(request: LogoutRequest) -> dict[str, str]:
    """
    Logout and invalidate session.
    """
    try:
        from ..middleware.permission_middleware import invalidate_session_cache
        invalidate_session_cache(request.session_token)

        service = AuthService()
        service.logout(request.session_token)

        return {"message": "Logged out successfully"}

    except Exception as e:
        logger.error(f"Logout failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
