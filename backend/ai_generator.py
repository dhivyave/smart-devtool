import os
import json
from groq import AsyncGroq

# Initialize Groq client
client = AsyncGroq(api_key=os.environ.get("GROQ_API_KEY"))

async def get_groq_completion(prompt: str, json_mode: bool = False) -> str:
    try:
        response = await client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            temperature=0.1,
            response_format={"type": "json_object"} if json_mode else None
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Groq API Error: {e}")
        return "{}" if json_mode else f"// Error: {e}"

async def analyze_api_doc(text: str, use_case: str, language: str) -> dict:
    prompt = f"""
    Analyze the following API documentation text to extract its endpoints and details.
    
    You must align your analysis with the user's specific use case:
    Use Case: "{use_case}"
    Target Language: {language}
    
    Tasks to perform:
    1. Identify the name of the API and its category (e.g., Weather, Payments, Messaging, CRM).
    2. Extract all available endpoints with their HTTP methods, paths, parameter descriptions, and general descriptions.
    3. Compare each extracted endpoint against the User Use Case. Mark whether it is directly relevant (is_relevant: true/false) and assign a relevance score (0 to 100).
    4. Detect the Authentication Type (e.g., Bearer Token, API Key, OAuth 2.0, None) and detailed auth info (required parameters, query/header location, example string, and explanation description).
    5. Evaluate confidence scores (0 to 100) for:
       - auth_confidence: detection of auth requirements
       - endpoints_confidence: extraction of API paths
       - relevance_confidence: matching endpoints to the user's use case
       - wrapper_confidence: how well a wrapper class can satisfy the use case using the relevant endpoints
    6. Provide integration recommendations:
       - why_rest: detailed explanation of why standard REST libraries are recommended (or not)
       - sdk_exists: state if an official or community SDK exists for the target language
       - best_library: the single most standard HTTP library/package for the target language (e.g., requests, axios, HttpClient, net/http)
       - recommendation_summary: 1-sentence integration plan
       
    Respond STRICTLY in JSON format following this exact JSON structure:
    {{
        "api_name": "API Name",
        "category": "API Category",
        "auth": {{
            "type": "Auth Type",
            "required_params": "comma-separated parameters, or None",
            "location": "Header / Query Parameter / etc.",
            "example": "Authorization: Bearer <key> or /api?key=<val>",
            "description": "Short explanation of how to authenticate.",
            "confidence": 95
        }},
        "endpoints": [
            {{
                "method": "GET",
                "path": "/path/here",
                "description": "Endpoint description",
                "parameters": "Parameters detail",
                "is_relevant": true,
                "relevance_score": 95
            }}
        ],
        "endpoints_confidence": 90,
        "relevance_confidence": 85,
        "wrapper_confidence": 90,
        "integration": {{
            "why_rest": "Explanation of why REST is appropriate...",
            "sdk_exists": "Official SDK exists / No official SDK exists...",
            "best_library": "Library name",
            "recommendation_summary": "Summary statement"
        }}
    }}
    
    Ensure the JSON is fully parseable. Do not include markdown wraps around the JSON in your response. Just return raw JSON.
    
    API Documentation snippet:
    {text[:4000]}
    """
    
    res = await get_groq_completion(prompt, json_mode=True)
    try:
        return json.loads(res)
    except Exception as e:
        print(f"Failed to parse API analysis: {e}")
        # Return fallback structured dict
        return {{
            "api_name": "Unknown API",
            "category": "General",
            "auth": {{
                "type": "Unknown",
                "required_params": "None",
                "location": "Header",
                "example": "None",
                "description": "Unable to analyze authentication details.",
                "confidence": 50
            }},
            "endpoints": [],
            "endpoints_confidence": 50,
            "relevance_confidence": 50,
            "wrapper_confidence": 50,
            "integration": {{
                "why_rest": "REST is standard for web services.",
                "sdk_exists": "Unknown",
                "best_library": "Standard Library",
                "recommendation_summary": "Standard REST integration recommended."
            }}
        }}

async def generate_wrapper_code(language: str, use_case: str, relevant_endpoints: list, auth_info: dict) -> str:
    endpoints_str = "\n".join([f"- {ep.get('method')} {ep.get('path')}: {ep.get('description')} (params: {ep.get('parameters')})" for ep in relevant_endpoints])
    prompt = f"""
    Write a highly polished, production-ready, clean-code API wrapper class in {language}.
    
    The wrapper must be specifically optimized for the following Use Case:
    Use Case: "{use_case}"
    
    Generate wrapper methods ONLY for these relevant endpoints:
    {endpoints_str}
    
    Authentication specifications to implement:
    - Auth Type: {auth_info.get('type')}
    - Credentials Location: {auth_info.get('location')}
    - Required Parameters: {auth_info.get('required_params')}
    - Description: {auth_info.get('description')}
    
    Quality Requirements:
    1. Include strict type hints/annotations for all method inputs and outputs.
    2. Add clear docstrings and comments explaining how the code satisfies the use case.
    3. Implement robust error handling (try-catch/try-except) templates to handle network and server failures.
    4. Match the naming of methods and logic directly to the displayed endpoints.
    5. DO NOT generate wrapper methods for any other endpoints.
    
    Return ONLY the raw code. Do not wrap in markdown code blocks like ```{language} ... ```. Just return the raw code.
    """
    
    code = await get_groq_completion(prompt, json_mode=False)
    # Strip markdown blocks if the model wrapped them
    if "```" in code:
        parts = code.split("```", 2)
        if len(parts) >= 2:
            code_block = parts[1]
            # Remove language prefix if present (e.g., "python\n")
            subparts = code_block.split("\n", 1)
            if len(subparts) > 1:
                code = subparts[1]
            else:
                code = code_block
    return code.strip()
