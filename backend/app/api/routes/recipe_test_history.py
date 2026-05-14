from __future__ import annotations  
from fastapi import APIRouter  
from app.api.routes import recipe_test_impl as impl

router = APIRouter(prefix='/recipe-test', tags=['recipe-test'])

@router.get('/history')  
def get_history(limit: int = 500):  
    return impl.get_history(limit)  
