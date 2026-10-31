from fastapi import APIRouter, BackgroundTasks, Depends

from app.api.deps import get_current_user, subject_service
from app.schemas.subject import SubjectCreate, SubjectOut, SubjectUpdate
from app.services.subject_service import SubjectService, parse_syllabus_task

router = APIRouter(prefix="/subjects", tags=["subjects"])


@router.post("", response_model=SubjectOut, status_code=201)
async def create_subject(
    body: SubjectCreate,
    background: BackgroundTasks,
    user: dict = Depends(get_current_user),
    svc: SubjectService = Depends(subject_service),
):
    """Creates the subject; the syllabus is parsed into a topic tree in the background (poll `topics_status`)."""
    subject = await svc.create(user["id"], body)
    background.add_task(parse_syllabus_task, subject["id"])
    return subject


@router.get("", response_model=list[SubjectOut])
async def list_subjects(user: dict = Depends(get_current_user), svc: SubjectService = Depends(subject_service)):
    return await svc.list(user["id"])


@router.get("/{subject_id}", response_model=SubjectOut)
async def get_subject(subject_id: str, user: dict = Depends(get_current_user), svc: SubjectService = Depends(subject_service)):
    return await svc.get_owned(user["id"], subject_id)


@router.patch("/{subject_id}", response_model=SubjectOut)
async def update_subject(
    subject_id: str,
    body: SubjectUpdate,
    background: BackgroundTasks,
    user: dict = Depends(get_current_user),
    svc: SubjectService = Depends(subject_service),
):
    subject, syllabus_changed = await svc.update(user["id"], subject_id, body)
    if syllabus_changed:
        background.add_task(parse_syllabus_task, subject_id)
    return subject


@router.post("/{subject_id}/parse-syllabus", response_model=SubjectOut, status_code=202)
async def reparse_syllabus(
    subject_id: str,
    background: BackgroundTasks,
    user: dict = Depends(get_current_user),
    svc: SubjectService = Depends(subject_service),
):
    subject = await svc.get_owned(user["id"], subject_id)
    await svc.mark_pending(subject_id)
    background.add_task(parse_syllabus_task, subject_id)
    return {**subject, "topics_status": "pending"}


@router.delete("/{subject_id}", status_code=204)
async def delete_subject(subject_id: str, user: dict = Depends(get_current_user), svc: SubjectService = Depends(subject_service)):
    await svc.delete(user["id"], subject_id)
