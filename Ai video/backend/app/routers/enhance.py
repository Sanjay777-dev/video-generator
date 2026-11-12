from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import settings
from app.services.prompt_enhancer import enhance_prompt

router = APIRouter(prefix="/api", tags=["prompt tools"])


class EnhanceRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=2000)


class EnhanceResponse(BaseModel):
    prompt: str


@router.post("/enhance", response_model=EnhanceResponse)
def enhance(request: EnhanceRequest) -> EnhanceResponse:
    if len(request.prompt) > settings.max_prompt_length:
        raise HTTPException(status_code=422, detail="Prompt is too long.")
    try:
        return EnhanceResponse(prompt=enhance_prompt(request.prompt))
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
