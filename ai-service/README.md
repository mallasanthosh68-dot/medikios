# MediKiosk AI & OCR Microservice

High-performance Python FastAPI service providing Optical Character Recognition (PyTesseract) and LLM-powered clinical triage summarization with HL7 FHIR R4 JSON serialization.

## Tech Stack
- **FastAPI**: Modern, fast (high-performance) web framework for building APIs with Python
- **PyTesseract / Pillow**: Medical document text extraction
- **Google Generative AI**: Gemini LLM integration for multilingual reasoning
- **Pydantic**: Data validation and strict JSON serialization

## Quick Start

### 1. Install Dependencies
```bash
cd ai-service
pip install -r requirements.txt
```

### 2. Start the Microservice
```bash
uvicorn main:app --reload --port 8000
```

Interactive API documentation (Swagger UI) is available at:
`http://localhost:8000/docs`
