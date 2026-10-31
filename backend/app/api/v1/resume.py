from fastapi import APIRouter, Depends, UploadFile

from app.api.deps import get_current_user, resume_service
from app.schemas.resume import AnalyzeRequest, ResumeAnalysis, ResumeData, ResumeOut, ResumeUpdate
from app.services.resume_service import ResumeService

router = APIRouter(prefix="/resume", tags=["resume"])


@router.post("/upload", response_model=ResumeOut)
async def upload_resume(file: UploadFile, user: dict = Depends(get_current_user), svc: ResumeService = Depends(resume_service)):
    """Upload an ATS-friendly resume (PDF/DOCX/TXT); details are extracted and stored."""
    return await svc.upload(user["id"], file)


@router.put("", response_model=ResumeOut)
async def save_resume(body: ResumeData, user: dict = Depends(get_current_user), svc: ResumeService = Depends(resume_service)):
    """Create/replace the resume from the input form."""
    return await svc.save(user["id"], body, source="form")


@router.patch("", response_model=ResumeOut)
async def edit_resume(body: ResumeUpdate, user: dict = Depends(get_current_user), svc: ResumeService = Depends(resume_service)):
    """Live edit: send only the fields that changed."""
    return await svc.patch(user["id"], body)


@router.get("", response_model=ResumeOut)
async def get_resume(user: dict = Depends(get_current_user), svc: ResumeService = Depends(resume_service)):
    return await svc.get(user["id"])


@router.post("/analyze", response_model=ResumeAnalysis)
async def analyze_resume(body: AnalyzeRequest, user: dict = Depends(get_current_user), svc: ResumeService = Depends(resume_service)):
    """Strengths, weaknesses and suggestions (optionally against a job description)."""
    return await svc.analyze(user["id"], body.job_description)


@router.get("/analysis", response_model=ResumeAnalysis)
async def latest_analysis(user: dict = Depends(get_current_user), svc: ResumeService = Depends(resume_service)):
    return await svc.latest_analysis(user["id"])
