import re
from datetime import date, datetime
from typing import Optional, List, Dict, Any

EXP_KEYWORDS = [
    "EXP", "EXPIRES", "EXPIRY", "EXPIRATION",
    "BEST BEFORE", "BEST-BEFORE", "BB", "BBD",
    "USE BY", "USE-BY",
]

NON_EXP_CLUES = [
    "ORDER", "TOTAL", "SUBTOTAL", "TAX", "VISA", "MASTERCARD",
    "AMOUNT", "BALANCE", "AUTH", "APPROVED", "TIME", "PM", "AM",
]

def _normalize_text(t: str) -> str:
    # Uppercase + normalize common OCR confusions
    t = t.upper()
    # OCR sometimes reads O as 0 inside numbers; only do a gentle replace near digits
    t = re.sub(r"(?<=\d)O(?=\d)", "0", t)
    return t

def _extract_date_strings(text: str) -> List[Dict[str, Any]]:
    """
    Return list of {"raw": str, "start": int, "end": int, "context": str}
    """
    candidates = []

    patterns = [
        # 2025-12-20, 2025/12/20
        r"\b(20\d{2})[-/\.](\d{1,2})[-/\.](\d{1,2})\b",
        # 20-12-2025, 20/12/2025
        r"\b(\d{1,2})[-/\.](\d{1,2})[-/\.](20\d{2})\b",
        # 20-12-25, 20/12/25
        r"\b(\d{1,2})[-/\.](\d{1,2})[-/\.](\d{2})\b",
        # DEC 20 2025 / 20 DEC 2025
        r"\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*\s+\d{1,2}(?:,)?\s+(20\d{2})\b",
        r"\b\d{1,2}\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*\s+(20\d{2})\b",
    ]

    for pat in patterns:
        for m in re.finditer(pat, text):
            start, end = m.start(), m.end()
            raw = text[start:end]
            ctx_start = max(0, start - 40)
            ctx_end = min(len(text), end + 40)
            context = text[ctx_start:ctx_end]
            candidates.append({"raw": raw, "start": start, "end": end, "context": context})

    return candidates

def _parse_date(raw: str) -> Optional[date]:
    raw = raw.strip().replace(",", " ")
    # Try strict-ish parsing ourselves for numeric forms
    # 2025-12-20
    m = re.match(r"^(20\d{2})[-/\.](\d{1,2})[-/\.](\d{1,2})$", raw)
    if m:
        y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
        try:
            return date(y, mo, d)
        except ValueError:
            return None


    # 20-12-2025
    m = re.match(r"^(\d{1,2})[-/\.](\d{1,2})[-/\.](20\d{2})$", raw)
    if m:
        d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        # This assumes day-first (common on labels). We’ll validate by date().
        try:
            return date(y, mo, d)
        except ValueError:
            return None


    # 20-12-25 (assume 20xx)
    m = re.match(r"^(\d{1,2})[-/\.](\d{1,2})[-/\.](\d{2})$", raw)
    if m:
        d, mo, yy = int(m.group(1)), int(m.group(2)), int(m.group(3))
        y = 2000 + yy
        try:
            return date(y, mo, d)
        except ValueError:
            return None


    # Month name forms
    try:
        dt = datetime.strptime(raw, "%b %d %Y")
        return dt.date()
    except:
        pass

    try:
        dt = datetime.strptime(raw, "%d %b %Y")
        return dt.date()
    except:
        pass
    
    return None

def extract_expiry(text: str, today: Optional[date] = None) -> Dict[str, Any]:
    """
    Returns:
    {
      "expiry_date": "YYYY-MM-DD" or None,
      "confidence": 0..1,
      "picked": {raw, parsed, score, context} or None,
      "candidates": [ ... top few ... ]
    }
    """
    if today is None:
        today = date.today()

    t = _normalize_text(text)
    found = _extract_date_strings(t)

    scored = []
    for c in found:
        raw = c["raw"]
        parsed = _parse_date(raw)
        if not parsed:
            continue

        ctx = c["context"]
        score = 0

        # keyword boosting
        for kw in EXP_KEYWORDS:
            if kw in ctx:
                score += 3

        for bad in NON_EXP_CLUES:
            if bad in ctx:
                score -= 2

        # dates in the past are often receipt/order dates; penalize hard
        if parsed < today:
            score -= 4

        # expiry dates are usually not insanely far away (but could be)
        # soft penalty if > 3 years in future
        if parsed > date(today.year + 3, today.month, today.day):
            score -= 1

        scored.append({
            "raw": raw,
            "parsed": parsed.isoformat(),
            "score": score,
            "context": ctx.strip()
        })

    scored.sort(key=lambda x: (x["score"], x["parsed"]), reverse=True)

    picked = scored[0] if scored else None

    # confidence: map score to 0..1
    confidence = 0.0
    if picked:
        # score 6+ => very confident
        confidence = max(0.0, min(1.0, (picked["score"] + 2) / 8))

    return {
        "expiry_date": picked["parsed"] if picked else None,
        "confidence": confidence,
        "picked": picked,
        "candidates": scored[:5],
    }
