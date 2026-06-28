from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from datetime import datetime

# ─── Input Schemas ─────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    url: HttpUrl
    use_case: str
    language: str
    user_id: Optional[str] = None

# ─── Endpoint Schema ───────────────────────────────────────────────────────────

class EndpointSchema(BaseModel):
    method: str
    path: str
    description: Optional[str] = None
    parameters: Optional[str] = None
    is_relevant: Optional[bool] = True
    relevance_score: Optional[int] = 0

    class Config:
        from_attributes = True

# ─── Nested Output Schemas ─────────────────────────────────────────────────────

class ApiSummarySchema(BaseModel):
    api_name: str
    category: str
    auth_type: str
    total_endpoints: int
    relevant_endpoints_count: int
    recommended_method: str

class AuthCardSchema(BaseModel):
    auth_type: str
    required_params: Optional[str] = None
    location: Optional[str] = None
    example: Optional[str] = None
    description: Optional[str] = None

class IntegrationRecommendationSchema(BaseModel):
    why_rest: str
    sdk_exists: str
    best_library: str
    recommendation_summary: str

class ConfidenceScoresSchema(BaseModel):
    auth: int
    endpoints: int
    relevance: int
    wrapper: int

class DownloadMetadataSchema(BaseModel):
    language: str
    generated_time: str
    wrapper_version: str

# ─── Analysis Response ─────────────────────────────────────────────────────────

class AnalyzeResponse(BaseModel):
    id: Optional[int] = None
    doc_url: Optional[str] = None
    use_case: Optional[str] = None
    user_id: Optional[str] = None
    api_summary: ApiSummarySchema
    auth_card: AuthCardSchema
    integration_recommendation: IntegrationRecommendationSchema
    endpoints: List[EndpointSchema]
    generated_code: str
    confidence_scores: ConfidenceScoresSchema
    download_metadata: DownloadMetadataSchema

    class Config:
        from_attributes = True

# ─── History Schemas ───────────────────────────────────────────────────────────

class HistoryItemSchema(BaseModel):
    id: int
    api_name: str
    doc_url: str
    auth_type: str
    use_case: Optional[str] = None
    category: str
    language: Optional[str] = None
    date_analyzed: datetime
    user_id: Optional[str] = None

    class Config:
        from_attributes = True

# ─── Chat Schemas ──────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = None
    analysis_context: Optional[dict] = None
    conversation_history: Optional[List[dict]] = []

class ChatResponse(BaseModel):
    reply: str
    role: str = "assistant"

class ChatHistoryItemSchema(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

# ─── Export Schemas ────────────────────────────────────────────────────────────

class TextExportRequest(BaseModel):
    analysis_id: int
