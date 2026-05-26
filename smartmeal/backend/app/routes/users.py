from datetime import datetime, timezone
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.db.database import get_db
from app.core.security import verify_password, get_password_hash
from app.models.user import UserResponse, UserInDB, UserBase, PasswordUpdate
from app.api.deps import get_current_user
from bson import ObjectId

router = APIRouter()

@router.put("/me", response_model=dict)
async def update_user_me(
    user_update: UserBase,
    current_user: UserInDB = Depends(get_current_user),
) -> Any:
    db = get_db()
    
    # Check if email is being updated and if it's already taken
    if user_update.email != current_user.email:
        user_exists = await db["users"].find_one({"email": {"$regex": f"^{user_update.email}$", "$options": "i"}})
        if user_exists:
            raise HTTPException(
                status_code=400,
                detail="The user with this email already exists in the system.",
            )
            
    update_data = user_update.model_dump()
    update_data["updatedAt"] = datetime.now(timezone.utc)
    
    await db["users"].update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": update_data}
    )
    
    updated_user = await db["users"].find_one({"_id": ObjectId(current_user.id)})
    updated_user["_id"] = str(updated_user["_id"])
    return {
        "message": "updated",
        "user": UserResponse(**updated_user).model_dump(by_alias=True)
    }

@router.put("/me/password", response_model=dict)
async def update_password_me(
    password_data: PasswordUpdate,
    current_user: UserInDB = Depends(get_current_user),
) -> Any:
<<<<<<< HEAD
    if not verify_password(password_data.oldPassword, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect old password")
        
    db = get_db()
    new_password_hash = get_password_hash(password_data.newPassword)
    
    await db["users"].update_one(
        {"_id": ObjectId(current_user.id)},
=======
    db = get_db()
    
    if password_data.otp:
        # OTP verification logic
        otp_record = await db["otps"].find_one({"email": current_user.email.lower()})
        if not otp_record or otp_record["otp"] != password_data.otp:
            raise HTTPException(status_code=400, detail="Invalid OTP code")
        
        expiry = otp_record["expiry"]
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
            
        if expiry < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="OTP has expired")
            
        # Delete used OTP
        await db["otps"].delete_one({"email": current_user.email.lower()})
    elif password_data.oldPassword:
        # Standard password verification
        if not verify_password(password_data.oldPassword, current_user.password_hash):
            raise HTTPException(status_code=400, detail="Incorrect current password")
    else:
        raise HTTPException(status_code=400, detail="Either current password or OTP is required")
        
    new_password_hash = get_password_hash(password_data.newPassword)
    
    # Robust ID handling
    user_id_val = str(current_user.id)
    query_id = ObjectId(user_id_val) if len(user_id_val) == 24 else user_id_val
    
    await db["users"].update_one(
        {"_id": query_id},
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
        {"$set": {
            "password_hash": new_password_hash,
            "updatedAt": datetime.now(timezone.utc)
        }}
    )
    
    return {"message": "password_updated"}

@router.delete("/me", response_model=dict)
async def delete_user_me(
    current_user: UserInDB = Depends(get_current_user),
) -> Any:
    db = get_db()
    
<<<<<<< HEAD
    await db["users"].delete_one({"_id": ObjectId(current_user.id)})
=======
    user_id_val = str(current_user.id)
    query_id = ObjectId(user_id_val) if len(user_id_val) == 24 else user_id_val
    await db["users"].delete_one({"_id": query_id})
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
    
    return {"message": "deleted"}
