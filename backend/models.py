from sqlalchemy import Column, String
from database import Base

class Image(Base):
    __tablename__ = "images"

    id = Column(String, primary_key=True, index=True)
    uid = Column(String, index=True)
    image_url = Column(String)