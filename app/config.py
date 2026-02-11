import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROVIDER_BASE_URL: str
    PROVIDER_BEARER_TOKEN: str
    DEFAULT_REGION: str = "US"
    RATE_LIMIT_PER_SECOND: float = 5.0
    DATABASE_PATH: str = "./sms.db"
    
    # ViteMobile Specific
    VITEMOBILE_SERVER_TYPE: str = "PUBLIC" # PUBLIC or PRIVATE
    VITEMOBILE_PROTOCOL: str = "SMS"

    class Config:
        env_file = ".env"

settings = Settings()
