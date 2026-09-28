from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.api.deps import get_current_user, require_roles
from app.models.system import AuditLog, Notification, Setting
from app.schemas.system import AuditLogResponse, NotificationResponse, SettingResponse, SettingUpdate

router = APIRouter(tags=["System, Audit & Notifications"])

# 1. Audit Logs
@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["super_admin", "admin"])),
    entity: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500)
):
    query = db.query(AuditLog)
    if entity:
        query = query.filter(AuditLog.entity == entity)
    if action:
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(desc(AuditLog.timestamp)).limit(limit).all()
    results = []
    for l in logs:
        results.append(
            AuditLogResponse(
                id=l.id,
                user_id=l.user_id,
                user_name=l.user.full_name if l.user else "System",
                action=l.action,
                entity=l.entity,
                entity_id=l.entity_id,
                ip_address=l.ip_address,
                description=l.description,
                timestamp=l.timestamp
            )
        )
    return results

# 2. Notifications
@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    unread_only: bool = False
):
    query = db.query(Notification)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    return query.order_by(desc(Notification.created_at)).limit(30).all()

@router.put("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}

@router.put("/notifications/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}

# 3. Settings
@router.get("/settings", response_model=List[SettingResponse])
def get_settings(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Setting).all()

@router.put("/settings/{key}", response_model=SettingResponse)
def update_setting(
    key: str,
    data: SettingUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["super_admin", "admin"]))
):
    setting = db.query(Setting).filter(Setting.key == key).first()
    if not setting:
        setting = Setting(key=key, value=data.value, description=f"Custom setting {key}")
        db.add(setting)
    else:
        setting.value = data.value

    db.commit()
    db.refresh(setting)
    return setting
