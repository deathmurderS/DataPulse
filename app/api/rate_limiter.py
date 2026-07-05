"""
Rate Limiter Module
Simple in-memory rate limiter for API protection.
"""

import time
from collections import defaultdict
from typing import Tuple
from loguru import logger

from app.config import settings


class RateLimiter:
    """Simple in-memory sliding window rate limiter."""

    def __init__(self):
        self._requests: dict = defaultdict(list)

    def check_rate_limit(self, client_ip: str) -> Tuple[bool, int]:
        """
        Check if a request from client_ip is within rate limit.
        Returns (allowed: bool, remaining_requests: int).
        """
        now = time.time()
        window = settings.api_rate_limit_window
        max_requests = settings.api_rate_limit

        # Clean old entries
        self._requests[client_ip] = [
            req_time for req_time in self._requests[client_ip]
            if now - req_time < window
        ]

        # Count requests in current window
        current_count = len(self._requests[client_ip])
        remaining = max(0, max_requests - current_count)

        if current_count >= max_requests:
            logger.debug(f"Rate limit exceeded for {client_ip}: {current_count}/{max_requests}")
            return False, remaining

        # Add current request
        self._requests[client_ip].append(now)
        return True, remaining

    def get_client_stats(self, client_ip: str) -> dict:
        """Get rate limit stats for a client."""
        now = time.time()
        window = settings.api_rate_limit_window

        self._requests[client_ip] = [
            req_time for req_time in self._requests[client_ip]
            if now - req_time < window
        ]

        return {
            "client_ip": client_ip,
            "current_requests": len(self._requests[client_ip]),
            "limit": settings.api_rate_limit,
            "window_seconds": window,
            "remaining": max(0, settings.api_rate_limit - len(self._requests[client_ip])),
        }