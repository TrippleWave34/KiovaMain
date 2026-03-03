from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.sql import func
from database import Base


class Image(Base):
    __tablename__ = "images"

    id        = Column(String, primary_key=True, index=True)
    uid       = Column(String, index=True)
    image_url = Column(String)
    tags      = Column(String, nullable=True)  # comma-separated e.g. "dress,red,fashion"


class FavouriteImage(Base):
    __tablename__ = "favourites"

    id        = Column(String, primary_key=True, index=True)
    uid       = Column(String, index=True)
    image_url = Column(String)
    tags      = Column(String, nullable=True)  # comma-separated


class UserTokens(Base):
    __tablename__ = "users"

    uid        = Column(String, primary_key=True, index=True)
    tokens     = Column(Integer, nullable=False, default=5)
    last_reset = Column(DateTime(timezone=True), nullable=False, server_default=func.now())