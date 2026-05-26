<<<<<<< HEAD
import uuid
import os
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from app.api.deps import get_current_user
from app.models.user import UserInDB

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "static", "uploads")
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_MB = 5


@router.post("/image", status_code=status.HTTP_200_OK)
async def upload_image(
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_user),
) -> JSONResponse:
    """Upload an image file. Returns the URL to the saved image."""

    # Validate content type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type '{file.content_type}'. Allowed: JPEG, PNG, WEBP, GIF.",
        )

    # Read and check size
    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large ({size_mb:.1f} MB). Maximum allowed is {MAX_SIZE_MB} MB.",
        )

    # Generate unique filename, preserve extension
    ext = os.path.splitext(file.filename or "image.jpg")[1].lower() or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    save_path = os.path.join(UPLOAD_DIR, filename)

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    with open(save_path, "wb") as f:
        f.write(contents)

    image_url = f"/static/uploads/{filename}"
    return JSONResponse(content={"url": image_url})
=======
from fastapi import APIRouter, UploadFile, File, HTTPException
import os
import uuid

router = APIRouter()

UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "static", "uploads"
)


@router.post("/image")
async def upload_file(file: UploadFile = File(...)):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    content = await file.read()
    with open(path, "wb") as f:
        f.write(content)
    return {"url": f"/static/uploads/{filename}"}
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
