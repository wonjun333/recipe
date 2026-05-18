from __future__ import annotations  
from fastapi import APIRouter  
from app.api.routes import recipe_test_impl as impl  

router = APIRouter(prefix='/recipe-test', tags=['recipe-test'])  

@router.get('/eqp-options')  
def get_eqp_options():  
    return impl.get_eqp_options()  

@router.post('/load')  
def load_recipe_test(req: impl.LoadRequest):  
    return impl.load_recipe_test(req)