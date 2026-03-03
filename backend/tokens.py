"""
Token system — all token logic lives here.

Supabase `users` table schema (run this SQL in Supabase dashboard):

    create table users (
        uid         text primary key,
        tokens      integer not null default 5,
        last_reset  timestamptz not null default now()
    );

One row per Firebase uid. Tokens reset to 5 every Monday.
"""

from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from models import UserTokens   # see models.py additions below

WEEKLY_FREE_TOKENS = 5


def _next_monday() -> datetime:
    """Return next Monday 00:00 UTC."""
    now = datetime.now(timezone.utc)
    days_ahead = 7 - now.weekday()   # weekday(): Mon=0 … Sun=6
    if days_ahead == 7:
        days_ahead = 0               # today IS Monday — keep same week
    return (now + timedelta(days=days_ahead)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )


def _should_reset(last_reset: datetime) -> bool:
    """True if last_reset was before this week's Monday 00:00 UTC."""
    now   = datetime.now(timezone.utc)
    # Find most recent Monday 00:00 UTC
    days_since_monday = now.weekday()          # Mon=0
    this_monday = (now - timedelta(days=days_since_monday)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    if last_reset.tzinfo is None:
        last_reset = last_reset.replace(tzinfo=timezone.utc)
    return last_reset < this_monday


def get_or_create_user(uid: str, db: Session) -> "UserTokens":
    """Fetch user row, creating it if it doesn't exist. Also handles weekly reset."""
    user = db.query(UserTokens).filter(UserTokens.uid == uid).first()

    if not user:
        user = UserTokens(
            uid=uid,
            tokens=WEEKLY_FREE_TOKENS,
            last_reset=datetime.now(timezone.utc),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    # Weekly reset check
    if _should_reset(user.last_reset):
        user.tokens     = WEEKLY_FREE_TOKENS
        user.last_reset = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)

    return user


def get_token_balance(uid: str, db: Session) -> dict:
    user = get_or_create_user(uid, db)
    next_reset = _next_monday()
    diff       = next_reset - datetime.now(timezone.utc)
    days       = diff.days
    hours      = diff.seconds // 3600
    return {
        "tokens":     user.tokens,
        "next_reset": f"{days}d {hours}h",
    }


def deduct_token(uid: str, db: Session) -> dict:
    """Deduct 1 token. Raises 402 if balance is 0."""
    user = get_or_create_user(uid, db)

    if user.tokens <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="No tokens left. Top up to keep generating outfits.",
        )

    user.tokens -= 1
    db.commit()
    db.refresh(user)
    return {"tokens_remaining": user.tokens}


def credit_tokens(uid: str, amount: int, db: Session) -> dict:
    """Add tokens to a user's balance (called from Stripe webhook)."""
    user = get_or_create_user(uid, db)
    user.tokens += amount
    db.commit()
    db.refresh(user)
    return {"tokens": user.tokens}
