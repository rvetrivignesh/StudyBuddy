from fastapi import APIRouter, Depends, Response

from app.api.deps import get_current_user, planner_service
from app.schemas.planner import PlanOut, PlanRequest
from app.services.google_calendar import sync_plan_to_google
from app.services.planner_service import PlannerService

router = APIRouter(prefix="/subjects/{subject_id}/plan", tags=["planner"])


@router.post("", response_model=PlanOut)
async def generate_plan(subject_id: str, body: PlanRequest, user: dict = Depends(get_current_user), svc: PlannerService = Depends(planner_service)):
    """(Re)generate the study calendar from the subject's topics, pace, study days and exam date."""
    return await svc.generate(user["id"], subject_id, body)


@router.get("", response_model=PlanOut)
async def get_plan(subject_id: str, user: dict = Depends(get_current_user), svc: PlannerService = Depends(planner_service)):
    return await svc.get(user["id"], subject_id)


@router.get("/export.ics")
async def export_ics(subject_id: str, user: dict = Depends(get_current_user), svc: PlannerService = Depends(planner_service)):
    """Download an iCalendar file - import it into Google Calendar, Apple Calendar or Outlook."""
    ics = await svc.ics(user["id"], subject_id)
    return Response(ics, media_type="text/calendar", headers={"Content-Disposition": 'attachment; filename="study-plan.ics"'})


@router.post("/google-calendar", status_code=501)
async def google_calendar_sync(subject_id: str, user: dict = Depends(get_current_user), svc: PlannerService = Depends(planner_service)):
    await sync_plan_to_google(user["id"], await svc.get(user["id"], subject_id))
