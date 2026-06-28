from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class ApiAnalysis(Base):
    __tablename__ = "apis"

    id = Column(Integer, primary_key=True, index=True)
    api_name = Column(String, index=True, default="Unknown API")
    doc_url = Column(String, index=True)
    auth_type = Column(String, default="Unknown")
    date_analyzed = Column(DateTime, default=datetime.utcnow)
    user_id = Column(String, index=True, nullable=True)  # Clerk user ID

    # Existing fields
    use_case = Column(Text, nullable=True)
    category = Column(String, default="General")
    sdk_recommendation = Column(String, default="Standard REST")
    confidence_auth = Column(Integer, default=90)
    confidence_endpoints = Column(Integer, default=90)
    confidence_relevance = Column(Integer, default=90)
    confidence_wrapper = Column(Integer, default=90)
    auth_params = Column(String, nullable=True)
    auth_location = Column(String, nullable=True)
    auth_example = Column(Text, nullable=True)
    auth_description = Column(Text, nullable=True)
    rec_why_rest = Column(Text, nullable=True)
    rec_sdk_exists = Column(String, nullable=True)
    rec_best_library = Column(String, nullable=True)

    endpoints = relationship("Endpoint", back_populates="api_analysis", cascade="all, delete-orphan")
    generated_code = relationship("GeneratedCode", back_populates="api_analysis", cascade="all, delete-orphan")


class Endpoint(Base):
    __tablename__ = "endpoints"

    id = Column(Integer, primary_key=True, index=True)
    api_analysis_id = Column(Integer, ForeignKey("apis.id"))
    path = Column(String, index=True)
    method = Column(String)
    description = Column(Text, nullable=True)
    parameters = Column(Text, nullable=True)
    is_relevant = Column(Integer, default=1)
    relevance_score = Column(Integer, default=0)

    api_analysis = relationship("ApiAnalysis", back_populates="endpoints")


class GeneratedCode(Base):
    __tablename__ = "generated_code"

    id = Column(Integer, primary_key=True, index=True)
    api_analysis_id = Column(Integer, ForeignKey("apis.id"))
    language = Column(String)
    code = Column(Text)
    generation_timestamp = Column(DateTime, default=datetime.utcnow)

    api_analysis = relationship("ApiAnalysis", back_populates="generated_code")


class ChatMessage(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=True)
    role = Column(String, default="user")  # "user" or "assistant"
    content = Column(Text)
    analysis_context = Column(Text, nullable=True)  # JSON string of current API context
    created_at = Column(DateTime, default=datetime.utcnow)
