from __future__ import annotations
from uuid import uuid4
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.file_ops_service import (
    delete_file,
    rename_file_via_copy_delete,
    save_as_file,
    transfer_many
)

router = APIRouter(prefix="/recipe-file-ops", tags=["recipe-file-ops"])

class SaveAsRequest(BaseModel):
    sourceEqpId: str
    sourceDir: str
    sourceName: str
    targetEqpId: str
    targetDir: str
    targetName: str

class RenameRequest(BaseModel):
    eqpId: str
    remoteDir: str
    sourceName: str
    targetName: str

class DeleteRequest(BaseModel):
    eqpId: str
    remoteDir: str
    filenames: list[str] = Field(default_factory=list)

class TransferItem(BaseModel):
    sourceEqpId: str
    remoteDir: str
    filename: str

class TransferRequest(BaseModel):
    items: list[TransferItem] = Field(default_factory=list)
    targetEqpIds: list[str] = Field(default_factory=list)
    targetDir: str

@router.post("/save-as")
def save_as(req: SaveAsRequest):
    try:
        session_id = f"save-as-{uuid4().hex[:12]}"
        return save_as_file(
            source_eq_id=req.sourceEqpId,
            source_dir=req.sourceDir,
            source_name=req.sourceName,
            target_eq_id=req.targetEqpId,
            target_dir=req.targetDir,
            target_name=req.targetName,
            session_id=session_id
        ).__dict__
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.post("/rename")
def rename(req: RenameRequest):
    try:
        session_id = f"rename-{uuid4().hex[:12]}"
        return rename_file_via_copy_delete(
            eqp_id=req.eqpId,
            remote_dir=req.remoteDir,
            source_name=req.sourceName,
            target_name=req.targetName,
            session_id=session_id
        ).__dict__
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.post("/delete")
def delete(req: DeleteRequest):
    deleted = []
    failed = []
    for filename in req.filenames:
        try:
            delete_file(req.eqpId, req.remoteDir, filename)
            deleted.append(filename)
        except Exception as exc:
            failed.append({"filename": filename, "reason": str(exc)})
    return {
        "status": "ok" if deleted and not failed else ("partial" if deleted else "failed"),
        "deleted": deleted,
        "failed": failed
    }

@router.post("/transfer")
def transfer(req: TransferRequest):
    try:
        session_id = f"transfer-{uuid4().hex[:12]}"
        items = [(x.sourceEqpId, x.remoteDir, x.filename) for x in req.items]
        return transfer_many(
            items=items,
            target_eqp_ids=req.targetEqpIds,
            target_dir=req.targetDir,
            session_id=session_id
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))