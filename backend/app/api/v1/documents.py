from fastapi import APIRouter, BackgroundTasks, Depends, UploadFile

from app.ai.rag.ingest import ingest_document
from app.api.deps import document_service, get_current_user
from app.schemas.document import DocumentOut
from app.services.document_service import DocumentService

router = APIRouter(prefix="/subjects/{subject_id}/documents", tags=["documents (RAG)"])


@router.post("", response_model=DocumentOut, status_code=202)
async def upload_document(
    subject_id: str,
    file: UploadFile,
    background: BackgroundTasks,
    user: dict = Depends(get_current_user),
    svc: DocumentService = Depends(document_service),
):
    """Upload study material (pdf, docx, pptx, txt, md). Indexing runs in the background; poll `status`."""
    doc = await svc.upload(user["id"], subject_id, file)
    background.add_task(ingest_document, doc["id"])
    return doc


@router.get("", response_model=list[DocumentOut])
async def list_documents(subject_id: str, user: dict = Depends(get_current_user), svc: DocumentService = Depends(document_service)):
    return await svc.list(user["id"], subject_id)


@router.get("/{doc_id}", response_model=DocumentOut)
async def get_document(subject_id: str, doc_id: str, user: dict = Depends(get_current_user), svc: DocumentService = Depends(document_service)):
    return await svc.get(user["id"], subject_id, doc_id)


@router.delete("/{doc_id}", status_code=204)
async def delete_document(subject_id: str, doc_id: str, user: dict = Depends(get_current_user), svc: DocumentService = Depends(document_service)):
    await svc.delete(user["id"], subject_id, doc_id)
