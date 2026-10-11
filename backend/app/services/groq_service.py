import os
import re
import json
import logging
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

logger = logging.getLogger("marketmind.groq")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
PRIMARY_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
FAST_MODEL = os.getenv("GROQ_FAST_MODEL", "openai/gpt-oss-20b")

# Deduplicated fallback models list
_candidate_models = [PRIMARY_MODEL, FAST_MODEL, "qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"]
FALLBACK_MODELS = list(dict.fromkeys([m for m in _candidate_models if m]))

_client = None

def get_groq_client():
    global _client
    if _client is None:
        try:
            from groq import Groq
            if GROQ_API_KEY:
                _client = Groq(api_key=GROQ_API_KEY)
        except Exception as e:
            logger.warning(f"Could not initialize Groq client: {e}")
            _client = None
    return _client

def is_groq_available() -> bool:
    return bool(GROQ_API_KEY and get_groq_client() is not None)

def _safe_json_parse(text: Optional[str]) -> Optional[Any]:
    if not text:
        return None
    clean = text.strip()
    if clean.startswith("```"):
        clean = clean.split("\n", 1)[1]
    if clean.endswith("```"):
        clean = clean.rsplit("\n", 1)[0]
    if clean.startswith("json"):
        clean = clean[4:].strip()
    clean = clean.strip()
    
    try:
        return json.loads(clean, strict=False)
    except Exception:
        pass
        
    start_bracket = clean.find('[')
    end_bracket = clean.rfind(']')
    if start_bracket != -1 and end_bracket != -1 and end_bracket > start_bracket:
        bracket_content = clean[start_bracket:end_bracket+1]
        try:
            return json.loads(bracket_content, strict=False)
        except Exception:
            try:
                fixed = re.sub(r'\\([^"\\/bfnrtu])', r'\1', bracket_content)
                return json.loads(fixed, strict=False)
            except Exception:
                pass
                
    start_brace = clean.find('{')
    end_brace = clean.rfind('}')
    if start_brace != -1 and end_brace != -1 and end_brace > start_brace:
        brace_content = clean[start_brace:end_brace+1]
        try:
            return json.loads(brace_content, strict=False)
        except Exception:
            try:
                fixed = re.sub(r'\\([^"\\/bfnrtu])', r'\1', brace_content)
                return json.loads(fixed, strict=False)
            except Exception:
                pass
                
    return None

def _execute_groq_prompt(prompt: str, system_prompt: str = "You are a senior behavioral market analytics expert.", temperature: float = 0.3, max_tokens: int = 2000) -> Optional[str]:
    client = get_groq_client()
    if not client:
        return None
        
    for model_name in FALLBACK_MODELS:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature,
                max_tokens=max_tokens
            )
            content = response.choices[0].message.content
            if content and content.strip():
                return content.strip()
        except Exception as e:
            logger.warning(f"Groq generation failed with model {model_name}: {e}")
            continue
            
    return None

def generate_ai_market_insights(
    dataset_summary: Dict[str, Any],
    segments: List[Dict[str, Any]],
    correlation_pairs: List[Dict[str, Any]],
    risk_summary: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Uses Groq LLM to generate rich, data-grounded strategic market insights.
    Falls back gracefully if Groq is unreachable.
    """
    if not is_groq_available():
        return []

    prompt = f"""
Analyze the following Customer Segmentation and Behavioural dataset trained with a Self-Organizing Map (SOM):

DATASET METRICS:
- Total Customer Records: {dataset_summary.get('row_count', 'N/A')}
- Total Customer Segments: {len(segments)}
- Customer Retention Risk: {risk_summary.get('high_risk_pct', 0)}% High Risk, {risk_summary.get('medium_risk_pct', 0)}% Medium Risk, {risk_summary.get('low_risk_pct', 0)}% Low Risk

SEGMENT DETAILS:
{json.dumps([{
    'name': s.get('name'),
    'percentage': s.get('percentage'),
    'average_spending': s.get('average_spending'),
    'revenue_contribution': s.get('revenue_contribution'),
    'recency': s.get('recency'),
    'purchase_frequency': s.get('purchase_frequency')
} for s in segments], indent=2)}

TOP FEATURE CORRELATIONS:
{json.dumps(correlation_pairs[:4], indent=2)}

TASK:
Produce 4 distinct, high-impact strategic market insights in valid JSON format.
Each insight MUST have:
- "id": integer (1 to 4)
- "title": brief punchy title
- "type": one of ["revenue", "risk", "behavior", "correlation"]
- "metric": quantifiable key metric string (e.g. "42% Revenue Contribution", "r = 0.78 Correlation")
- "description": deep analytical narrative connecting behavior to business revenue and customer retention.
- "impact": impact level (e.g. "High Positive Impact", "Requires Immediate Action", "Margin Optimization Opportunity", "Growth Strategy")

Respond ONLY with valid JSON array of 4 objects. No markdown ticks, no preamble.
"""
    system_prompt = "You are MarketMind's Lead AI Econometrician. Provide rigorous, quantitative, actionable market insights. Always output pure valid JSON."
    raw = _execute_groq_prompt(prompt, system_prompt, temperature=0.2)
    
    if raw:
        try:
            parsed = _safe_json_parse(raw)
            if isinstance(parsed, list) and len(parsed) > 0:
                for idx, item in enumerate(parsed):
                    item["id"] = idx + 1
                    item["ai_generated"] = True
                    item["provider"] = "Groq"
                return parsed
        except Exception as e:
            logger.error(f"Error parsing Groq market insights JSON: {e}, raw: {raw[:200]}")
            
    return []

def generate_ai_recommendations(
    segments: List[Dict[str, Any]],
    risk_summary: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Uses Groq LLM to generate bespoke marketing playbooks for each segment.
    """
    if not is_groq_available():
        return []

    prompt = f"""
We identified {len(segments)} customer archetypes via Kohonen Self-Organizing Maps (SOM) and Hierarchical Clustering:

SEGMENTS:
{json.dumps([{
    'segment_id': s.get('segment_id'),
    'name': s.get('name'),
    'badge': s.get('badge'),
    'percentage': s.get('percentage'),
    'average_spending': s.get('average_spending'),
    'revenue_contribution': s.get('revenue_contribution'),
    'purchase_frequency': s.get('purchase_frequency'),
    'recency': s.get('recency')
} for s in segments], indent=2)}

OVERALL AT-RISK BASE: {risk_summary.get('at_risk_pct', 0)}%

TASK:
For each segment in the list, generate a tailored, executive-level business marketing playbook.
Return a valid JSON array of objects, one for each segment:
- "segment_id": integer
- "segment_name": string
- "badge": string
- "summary": 1 concise sentence highlighting their commercial standing
- "business_interpretation": deep psychological and behavioral motivation analysis
- "marketing_recommendation": tactical marketing strategy
- "suggested_campaign": memorable campaign name
- "target_goal": measurable KPI target (e.g. increase repeat orders from X to Y)

Respond ONLY with valid JSON array of objects matching the number of segments. No extra conversational text.
"""
    system_prompt = "You are a Chief Marketing Officer and Customer Retention Strategist. Provide sharp, creative, data-backed marketing playbooks. Output pure valid JSON only."
    raw = _execute_groq_prompt(prompt, system_prompt, temperature=0.3)
    
    if raw:
        try:
            parsed = _safe_json_parse(raw)
            if isinstance(parsed, list) and len(parsed) > 0:
                for item in parsed:
                    item["ai_generated"] = True
                    item["provider"] = "Groq"
                return parsed
        except Exception as e:
            logger.error(f"Error parsing Groq recommendations JSON: {e}")
            
    return []

def ask_ai_analyst(query: str, context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Answers user natural language questions about customer behavior, SOM topology, and marketing tactics.
    """
    if not is_groq_available():
        return {
            "answer": "Groq AI is currently not configured or reachable.",
            "provider": "Offline",
            "model": "None"
        }

    prompt = f"""
You are the embedded AI Customer Analytics Copilot for MarketMind.
The user is reviewing customer segmentation analysis produced by a Kohonen Self-Organizing Map (SOM).

CURRENT ANALYSIS CONTEXT:
{json.dumps(context, indent=2)}

USER QUESTION:
"{query}"

INSTRUCTIONS:
Provide an expert, concise, articulate, and actionable answer citing specific figures from the context above where relevant.
Include 2-3 specific bullet points with next-step recommendations if applicable.
"""
    system_prompt = "You are MarketMind AI, an elite customer analytics copilot powered by Groq. Be helpful, specific, and data-driven."
    answer = _execute_groq_prompt(prompt, system_prompt, temperature=0.4, max_tokens=1000)
    
    return {
        "answer": answer or "I could not formulate an answer at this moment. Please try again.",
        "provider": "Groq",
        "model": PRIMARY_MODEL
    }

def generate_ai_executive_summary(
    analysis_info: Dict[str, Any],
    dataset_info: Dict[str, Any],
    segments: List[Dict[str, Any]],
    risk_summary: Dict[str, Any]
) -> str:
    """
    Generates a 2-paragraph executive narrative for the PDF report.
    """
    if not is_groq_available():
        return ""

    prompt = f"""
Write a high-level 2-paragraph Executive Briefing for an Enterprise Customer Behavioral Report:
- Dataset: {dataset_info.get('filename')} with {dataset_info.get('row_count'):,} customer profiles.
- SOM Lattice: {analysis_info.get('grid_width')}x{analysis_info.get('grid_height')} Neurons, Quantization Error: {analysis_info.get('quantization_error')}, Topographic Error: {analysis_info.get('topographic_error')}.
- Segments: {len(segments)} archetypes: {', '.join([s.get('name', '') for s in segments])}.
- Risk: {risk_summary.get('high_risk_pct')}% High Churn Risk, {risk_summary.get('at_risk_pct')}% Total At-Risk.

Focus on commercial opportunities, margin protection, and proactive retention tactics.
Keep it strictly under 150 words. Do not use markdown headers.
"""
    res = _execute_groq_prompt(prompt, temperature=0.3, max_tokens=300)
    return res or ""
