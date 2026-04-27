from pydantic import BaseModel
from typing import Generic, TypeVar, Optional
import time

T = TypeVar("T")

class BaseResponse(BaseModel, Generic[T]):
    """
    标准 API 响应格式
    """
    code: int = 200
    data: Optional[T] = None
    message: str = "success"
    timestamp: int = int(time.time())

    @classmethod
    def success(cls, data: T, message: str = "success"):
        return cls(code=200, data=data, message=message)

    @classmethod
    def error(cls, code: int = 500, message: str = "error"):
        return cls(code=code, data=None, message=message)
