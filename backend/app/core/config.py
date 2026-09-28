import json
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    APP_NAME: str = "SME Inventory Pro (Cambodian Edition)"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: str = "sqlite:///./inventory.db"
    
    # JWT Security
    SECRET_KEY: str = "cambodian_sme_inventory_secret_key_change_in_production_2026_super_secure!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
    
    # Cambodian Business Defaults
    DEFAULT_CURRENCY: str = "USD"
    EXCHANGE_RATE_KHR: float = 4100.0
    BUSINESS_NAME: str = "Khmer Style Fashion"
    BUSINESS_PHONE: str = "+855 23 888 999"
    BUSINESS_PROVINCE: str = "Phnom Penh"
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
