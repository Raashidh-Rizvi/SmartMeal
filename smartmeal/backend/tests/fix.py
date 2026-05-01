import pathlib

path = pathlib.Path("app/routes/auth.py")
content = path.read_text("utf-8")

target = """    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")"""

replacement = """    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is deactivated. Please contact support.")"""

new_content = content.replace(target, replacement)
path.write_text(new_content, "utf-8")

print("Fixed auth.py")
