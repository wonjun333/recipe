from __future__ import annotations

from fastapi import APIRouter
from app.api.routes import recipe_test_impl as impl

router = APIRouter(prefix='/recipe-test', tags=['recipe-test'])

@router.post('/cas/save')
def save_cas(req: impl.SaveCasRequest):
    return impl.save_cas(req)

@router.post('/cas/persist')
def persist_cas(req: impl.PersistCasRequest):
    return impl.persist_cas(req)

@router.post('/job/save')
def save_job(req: impl.SaveJobRequest):
    return impl.save_job(req)

@router.post('/job/persist')
def persist_job(req: impl.PersistJobRequest):
    return impl.persist_job(req)

@router.post('/recipe/clone')
def clone_recipe(req: impl.PersistRecipeRequest):
    return impl.clone_recipe(req)

@router.post('/file/rename')
def rename_file(req: impl.RenameFileRequest):
    return impl.rename_file(req)

@router.post('/file/delete')
def delete_files(req: impl.DeleteFilesRequest):
    return impl.delete_files(req)

@router.post('/transfer')
def transfer_files(req: impl.TransferRequest):
    return impl.transfer_files(req)