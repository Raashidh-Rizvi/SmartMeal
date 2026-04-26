"""
Image serving route for cuisine images
Serves images from the data/image_for_cuisines folder
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os
from pathlib import Path

router = APIRouter(tags=["images"])

# Base path for cuisine images
IMAGE_BASE_PATH = Path(__file__).resolve().parent.parent / "data" / "image_for _cuisines" / "data"

@router.get("/cuisine-images")
def list_cuisine_images():
    """List all available cuisine images"""
    if not IMAGE_BASE_PATH.exists():
        raise HTTPException(status_code=404, detail="Images folder not found")
    
    try:
        images = [f for f in os.listdir(IMAGE_BASE_PATH) if f.lower().endswith(('.jpg', '.png', '.jpeg'))]
        return {"success": True, "count": len(images), "images": images}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cuisine-images/{image_name}")
def get_cuisine_image(image_name: str):
    """Serve a specific cuisine image by name"""
    image_path = IMAGE_BASE_PATH / image_name
    
    # Prevent directory traversal attacks
    if not str(image_path).startswith(str(IMAGE_BASE_PATH)):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    if not image_path.exists():
        raise HTTPException(status_code=404, detail=f"Image {image_name} not found")
    
    return FileResponse(
        path=image_path,
        media_type="image/jpeg",
        headers={"Content-Disposition": f"inline; filename={image_name}"}
    )


@router.get("/search-image/{query}")
def search_image(query: str):
    """
    Search for an image matching a recipe name or ingredient.
    Returns the first matching image filename.
    
    Example: /search-image/chicken%20rice%20curry
    Returns: filename of matching image or null
    """
    if not IMAGE_BASE_PATH.exists():
        raise HTTPException(status_code=404, detail="Images folder not found")
    
    try:
        query_lower = query.lower()
        images = [f for f in os.listdir(IMAGE_BASE_PATH) if f.lower().endswith(('.jpg', '.png', '.jpeg'))]
        
        # Try exact keyword matching in filename
        keywords = query_lower.split()
        
        # Score images based on keyword matches
        scored_images = []
        for img in images:
            img_lower = img.lower()
            matches = sum(1 for keyword in keywords if keyword in img_lower)
            if matches > 0:
                scored_images.append((img, matches))
        
        if scored_images:
            # Sort by match count descending and return top match
            scored_images.sort(key=lambda x: x[1], reverse=True)
            best_match = scored_images[0][0]
            return {"success": True, "image": best_match, "url": f"/api/images/cuisine-images/{best_match}"}
        
        # If no match found, return a random image
        if images:
            import random
            random_img = random.choice(images)
            return {"success": True, "image": random_img, "url": f"/api/images/cuisine-images/{random_img}"}
        
        return {"success": False, "image": None, "message": "No images found"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
