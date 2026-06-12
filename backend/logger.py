import logging
import os
from logging.handlers import TimedRotatingFileHandler

_LOGS_DIR = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(_LOGS_DIR, exist_ok=True)

_LOG_FILE = os.path.join(_LOGS_DIR, "app.log")

_fmt = logging.Formatter(
    fmt="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# File handler — rotates daily, keeps 30 days
_file_handler = TimedRotatingFileHandler(
    _LOG_FILE, when="midnight", interval=1, backupCount=30, encoding="utf-8"
)
_file_handler.setFormatter(_fmt)
_file_handler.setLevel(logging.INFO)

# Console handler (mirrors what uvicorn already shows, but in our format)
_console_handler = logging.StreamHandler()
_console_handler.setFormatter(_fmt)
_console_handler.setLevel(logging.INFO)


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.DEBUG)
        logger.addHandler(_file_handler)
        logger.addHandler(_console_handler)
        logger.propagate = False
    return logger
