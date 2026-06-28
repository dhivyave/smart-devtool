from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import json
import os

import models
import schemas
from database import engine, get_db
from scraper import scrape_documentation
from ai_generator import analyze_api_doc, generate_wrapper_code
from groq import AsyncGroq

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart DevTool for API Integration")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

groq_client = AsyncGroq(api_key=os.environ.get("GROQ_API_KEY"))

# ─── Root ───────────────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"status": "ok"}

# ─── Analyze ────────────────────────────────────────────────────────────────────

@app.post("/analyze", response_model=schemas.AnalyzeResponse)
async def analyze_api(request: schemas.AnalyzeRequest, db: Session = Depends(get_db)):
    url_str = str(request.url)

    # Delete existing analysis for this URL + user to avoid UNIQUE constraint violations
    existing_query = db.query(models.ApiAnalysis).filter(models.ApiAnalysis.doc_url == url_str)
    if request.user_id:
        existing_query = existing_query.filter(models.ApiAnalysis.user_id == request.user_id)
    existing_analysis = existing_query.first()
    if existing_analysis:
        db.delete(existing_analysis)
        db.commit()

    # 1. Scrape the URL
    text_content = await scrape_documentation(url_str)
    if not text_content:
        raise HTTPException(status_code=400, detail="Failed to scrape documentation URL")

    # 2. AI Analysis
    analysis_result = await analyze_api_doc(text_content, request.use_case, request.language)

    # Extract relevant endpoints
    all_endpoints = analysis_result.get("endpoints", [])
    relevant_endpoints = [ep for ep in all_endpoints if ep.get("is_relevant", True)]

    # Generate wrapper code
    generated_code = await generate_wrapper_code(
        language=request.language,
        use_case=request.use_case,
        relevant_endpoints=relevant_endpoints,
        auth_info=analysis_result.get("auth", {})
    )

    # 3. Store in DB
    db_analysis = models.ApiAnalysis(
        api_name=analysis_result.get("api_name", "Unknown API"),
        doc_url=url_str,
        auth_type=analysis_result.get("auth", {}).get("type", "Unknown"),
        use_case=request.use_case,
        category=analysis_result.get("category", "General"),
        sdk_recommendation=analysis_result.get("integration", {}).get("recommendation_summary", ""),
        confidence_auth=int(analysis_result.get("auth", {}).get("confidence", 90)),
        confidence_endpoints=int(analysis_result.get("endpoints_confidence", 90)),
        confidence_relevance=int(analysis_result.get("relevance_confidence", 90)),
        confidence_wrapper=int(analysis_result.get("wrapper_confidence", 90)),
        auth_params=analysis_result.get("auth", {}).get("required_params", "None"),
        auth_location=analysis_result.get("auth", {}).get("location", "Header"),
        auth_example=analysis_result.get("auth", {}).get("example", "None"),
        auth_description=analysis_result.get("auth", {}).get("description", ""),
        rec_why_rest=analysis_result.get("integration", {}).get("why_rest", ""),
        rec_sdk_exists=analysis_result.get("integration", {}).get("sdk_exists", ""),
        rec_best_library=analysis_result.get("integration", {}).get("best_library", ""),
        user_id=request.user_id
    )
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)

    # Store all endpoints
    for ep in all_endpoints:
        db_endpoint = models.Endpoint(
            api_analysis_id=db_analysis.id,
            path=ep.get("path"),
            method=ep.get("method"),
            description=ep.get("description"),
            parameters=ep.get("parameters"),
            is_relevant=1 if ep.get("is_relevant", True) else 0,
            relevance_score=int(ep.get("relevance_score", 0))
        )
        db.add(db_endpoint)

    db_code = models.GeneratedCode(
        api_analysis_id=db_analysis.id,
        language=request.language,
        code=generated_code
    )
    db.add(db_code)
    db.commit()

    # 4. Construct response
    api_summary = schemas.ApiSummarySchema(
        api_name=db_analysis.api_name,
        category=db_analysis.category,
        auth_type=db_analysis.auth_type,
        total_endpoints=len(all_endpoints),
        relevant_endpoints_count=len(relevant_endpoints),
        recommended_method=db_analysis.sdk_recommendation
    )
    auth_card = schemas.AuthCardSchema(
        auth_type=db_analysis.auth_type,
        required_params=db_analysis.auth_params,
        location=db_analysis.auth_location,
        example=db_analysis.auth_example,
        description=db_analysis.auth_description
    )
    integration_recommendation = schemas.IntegrationRecommendationSchema(
        why_rest=db_analysis.rec_why_rest,
        sdk_exists=db_analysis.rec_sdk_exists,
        best_library=db_analysis.rec_best_library,
        recommendation_summary=db_analysis.sdk_recommendation
    )
    endpoints_response = [
        schemas.EndpointSchema(
            method=ep.get("method"),
            path=ep.get("path"),
            description=ep.get("description"),
            parameters=ep.get("parameters"),
            is_relevant=bool(ep.get("is_relevant", True)),
            relevance_score=int(ep.get("relevance_score", 0))
        ) for ep in all_endpoints
    ]
    confidence_scores = schemas.ConfidenceScoresSchema(
        auth=db_analysis.confidence_auth,
        endpoints=db_analysis.confidence_endpoints,
        relevance=db_analysis.confidence_relevance,
        wrapper=db_analysis.confidence_wrapper
    )
    download_metadata = schemas.DownloadMetadataSchema(
        language=request.language,
        generated_time=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        wrapper_version="v1.0.0"
    )

    return schemas.AnalyzeResponse(
        id=db_analysis.id,
        doc_url=db_analysis.doc_url,
        use_case=db_analysis.use_case,
        user_id=db_analysis.user_id,
        api_summary=api_summary,
        auth_card=auth_card,
        integration_recommendation=integration_recommendation,
        endpoints=endpoints_response,
        generated_code=generated_code,
        confidence_scores=confidence_scores,
        download_metadata=download_metadata
    )

# ─── Get Single Analysis ────────────────────────────────────────────────────────

@app.get("/analysis/{analysis_id}", response_model=schemas.AnalyzeResponse)
def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    db_analysis = db.query(models.ApiAnalysis).filter(models.ApiAnalysis.id == analysis_id).first()
    if not db_analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    db_endpoints = db.query(models.Endpoint).filter(models.Endpoint.api_analysis_id == analysis_id).all()
    db_code = db.query(models.GeneratedCode).filter(models.GeneratedCode.api_analysis_id == analysis_id).first()

    all_endpoints = db_endpoints
    relevant_count = sum(1 for ep in all_endpoints if ep.is_relevant)

    api_summary = schemas.ApiSummarySchema(
        api_name=db_analysis.api_name,
        category=db_analysis.category,
        auth_type=db_analysis.auth_type,
        total_endpoints=len(all_endpoints),
        relevant_endpoints_count=relevant_count,
        recommended_method=db_analysis.sdk_recommendation or ""
    )
    auth_card = schemas.AuthCardSchema(
        auth_type=db_analysis.auth_type,
        required_params=db_analysis.auth_params,
        location=db_analysis.auth_location,
        example=db_analysis.auth_example,
        description=db_analysis.auth_description
    )
    integration_recommendation = schemas.IntegrationRecommendationSchema(
        why_rest=db_analysis.rec_why_rest or "",
        sdk_exists=db_analysis.rec_sdk_exists or "",
        best_library=db_analysis.rec_best_library or "",
        recommendation_summary=db_analysis.sdk_recommendation or ""
    )
    endpoints_response = [
        schemas.EndpointSchema(
            method=ep.method,
            path=ep.path,
            description=ep.description,
            parameters=ep.parameters,
            is_relevant=bool(ep.is_relevant),
            relevance_score=ep.relevance_score
        ) for ep in all_endpoints
    ]
    confidence_scores = schemas.ConfidenceScoresSchema(
        auth=db_analysis.confidence_auth,
        endpoints=db_analysis.confidence_endpoints,
        relevance=db_analysis.confidence_relevance,
        wrapper=db_analysis.confidence_wrapper
    )
    language = db_code.language if db_code else "Unknown"
    generated_time = db_code.generation_timestamp.strftime("%Y-%m-%d %H:%M:%S UTC") if db_code else db_analysis.date_analyzed.strftime("%Y-%m-%d %H:%M:%S UTC")
    download_metadata = schemas.DownloadMetadataSchema(
        language=language,
        generated_time=generated_time,
        wrapper_version="v1.0.0"
    )

    return schemas.AnalyzeResponse(
        id=db_analysis.id,
        doc_url=db_analysis.doc_url,
        use_case=db_analysis.use_case,
        user_id=db_analysis.user_id,
        api_summary=api_summary,
        auth_card=auth_card,
        integration_recommendation=integration_recommendation,
        endpoints=endpoints_response,
        generated_code=db_code.code if db_code else "// No code generated",
        confidence_scores=confidence_scores,
        download_metadata=download_metadata
    )

# ─── History ────────────────────────────────────────────────────────────────────

@app.get("/history")
def get_history(user_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.ApiAnalysis)
    if user_id:
        query = query.filter(models.ApiAnalysis.user_id == user_id)
    analyses = query.order_by(models.ApiAnalysis.date_analyzed.desc()).all()

    result = []
    for a in analyses:
        code = db.query(models.GeneratedCode).filter(models.GeneratedCode.api_analysis_id == a.id).first()
        result.append({
            "id": a.id,
            "api_name": a.api_name,
            "doc_url": a.doc_url,
            "auth_type": a.auth_type,
            "use_case": a.use_case,
            "category": a.category,
            "language": code.language if code else "Unknown",
            "date_analyzed": a.date_analyzed.isoformat(),
            "user_id": a.user_id
        })
    return result

@app.delete("/history/{analysis_id}")
def delete_analysis(analysis_id: int, db: Session = Depends(get_db)):
    db_analysis = db.query(models.ApiAnalysis).filter(models.ApiAnalysis.id == analysis_id).first()
    if not db_analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    db.delete(db_analysis)
    db.commit()
    return {"message": "Deleted successfully"}

# ─── Chat ───────────────────────────────────────────────────────────────────────

@app.post("/chat", response_model=schemas.ChatResponse)
async def chat(request: schemas.ChatRequest, db: Session = Depends(get_db)):
    # Build system context
    context_str = ""
    if request.analysis_context:
        ctx = request.analysis_context
        context_str = f"""
You are an AI assistant specialized in API integration. You have access to the following API analysis context:
- API Name: {ctx.get('api_name', 'Unknown')}
- Category: {ctx.get('category', 'Unknown')}
- Auth Type: {ctx.get('auth_type', 'Unknown')}
- Auth Description: {ctx.get('auth_description', '')}
- Use Case: {ctx.get('use_case', '')}
- Relevant Endpoints: {json.dumps(ctx.get('endpoints', [])[:10])}
- Generated Wrapper Language: {ctx.get('language', 'Unknown')}
- Integration Recommendation: {ctx.get('recommendation', '')}

Answer questions about this API integration. Be concise, technical, and helpful.
If asked to generate code, use the correct language ({ctx.get('language', 'Python')}).
"""
    else:
        context_str = """You are an AI assistant specialized in API integration, SDK development, and developer tooling.
Be concise, technical, and helpful. Help developers integrate APIs effectively."""

    # Build messages for Groq
    messages = [{"role": "system", "content": context_str}]
    if request.conversation_history:
        for msg in request.conversation_history[-10:]:  # Last 10 messages for context
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
    messages.append({"role": "user", "content": request.message})

    try:
        response = await groq_client.chat.completions.create(
            messages=messages,
            model="llama-3.1-8b-instant",
            temperature=0.4,
            max_tokens=1024
        )
        reply = response.choices[0].message.content
    except Exception as e:
        reply = f"I encountered an error processing your request. Please try again. ({str(e)})"

    # Store in DB
    user_msg = models.ChatMessage(
        user_id=request.user_id,
        role="user",
        content=request.message,
        analysis_context=json.dumps(request.analysis_context) if request.analysis_context else None
    )
    assistant_msg = models.ChatMessage(
        user_id=request.user_id,
        role="assistant",
        content=reply
    )
    db.add(user_msg)
    db.add(assistant_msg)
    db.commit()

    return schemas.ChatResponse(reply=reply)

@app.get("/chat/history")
def get_chat_history(user_id: Optional[str] = None, limit: int = 50, db: Session = Depends(get_db)):
    query = db.query(models.ChatMessage)
    if user_id:
        query = query.filter(models.ChatMessage.user_id == user_id)
    messages = query.order_by(models.ChatMessage.created_at.asc()).limit(limit).all()
    return [{"id": m.id, "role": m.role, "content": m.content, "created_at": m.created_at.isoformat()} for m in messages]

@app.delete("/chat/history")
def clear_chat_history(user_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.ChatMessage)
    if user_id:
        query = query.filter(models.ChatMessage.user_id == user_id)
    query.delete()
    db.commit()
    return {"message": "Chat history cleared"}

# ─── Text Export ────────────────────────────────────────────────────────────────

@app.post("/export/text")
def export_text(request: schemas.TextExportRequest, db: Session = Depends(get_db)):
    db_analysis = db.query(models.ApiAnalysis).filter(models.ApiAnalysis.id == request.analysis_id).first()
    if not db_analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    db_endpoints = db.query(models.Endpoint).filter(models.Endpoint.api_analysis_id == request.analysis_id).all()
    db_code = db.query(models.GeneratedCode).filter(models.GeneratedCode.api_analysis_id == request.analysis_id).first()

    relevant_eps = [ep for ep in db_endpoints if ep.is_relevant]

    lines = [
        f"Smart DevTool — API Analysis Report",
        f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}",
        f"{'='*60}",
        f"",
        f"API: {db_analysis.api_name}",
        f"Category: {db_analysis.category}",
        f"Documentation URL: {db_analysis.doc_url}",
        f"Use Case: {db_analysis.use_case}",
        f"",
        f"AUTHENTICATION",
        f"-" * 40,
        f"Type: {db_analysis.auth_type}",
        f"Location: {db_analysis.auth_location}",
        f"Required Params: {db_analysis.auth_params}",
        f"Example: {db_analysis.auth_example}",
        f"",
        f"INTEGRATION RECOMMENDATION",
        f"-" * 40,
        f"Best Library: {db_analysis.rec_best_library}",
        f"SDK Status: {db_analysis.rec_sdk_exists}",
        f"Summary: {db_analysis.sdk_recommendation}",
        f"",
        f"RELEVANT ENDPOINTS ({len(relevant_eps)})",
        f"-" * 40,
    ]

    for ep in relevant_eps:
        lines.append(f"  {ep.method} {ep.path} — {ep.description or 'No description'}")

    if db_code:
        lines += [f"", f"GENERATED WRAPPER ({db_code.language})", f"-" * 40, db_code.code]

    return {"content": "\n".join(lines), "filename": f"{db_analysis.api_name.replace(' ', '_')}_analysis.txt"}
