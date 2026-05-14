from __future__ import annotations  
from fastapi import APIRouter  
from app.api.routes import recipe_test_impl as impl  
router = APIRouter(prefix='/recipe-test', tags=['recipe-test'])  

@router.get('/cas-content')  
def get_cas_content(eqpId: str, casId: str):  
    return impl.get_cas_content(eqpId, casId)  

@router.get('/job-content')  
def get_job_content(eqpId: str, jobId: str):  
    return impl.get_job_content(eqpId, jobId)  

@router.get('/metrology-source-debug')  
def get_metrology_source_debug(eqpId: str):  
    return impl.get_metrology_source_debug(eqpId)  

@router.get('/recipe-source-list')  
def get_recipe_source_list(eqpId: str, sourceKind: str):  
    return impl.get_recipe_source_list(eqpId, sourceKind)  

@router.get('/recipe-content')  
def get_recipe_content(eqpId: str, recipeId: str):  
    return impl.get_recipe_content(eqpId, recipeId)  
