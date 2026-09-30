import sys
from pathlib import Path
import pytest
import jwt
from fastapi.testclient import TestClient

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.config.settings import settings
from app.main import app

TEST_JWT_SECRET = "test_jwt_secret_key_32bytes_long_for_data_forge_tests"

@pytest.fixture(autouse=True)
def configure_test_jwt_secret():
    """Automatically configure test JWT secret for all tests."""
    original_secret = settings.SUPABASE_JWT_SECRET
    settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET
    yield
    settings.SUPABASE_JWT_SECRET = original_secret

def make_test_jwt(
    user_id: str = "user_default_123",
    email: str = "default@example.com",
    secret: str = TEST_JWT_SECRET,
    aud: str = "authenticated",
    exp: int = None
) -> str:
    payload = {"sub": user_id, "email": email, "aud": aud}
    if exp is not None:
        payload["exp"] = exp
    return jwt.encode(payload, secret, algorithm="HS256")

@pytest.fixture
def client():
    """Client authenticated with default test user ID for backward compatibility with existing tests."""
    token = make_test_jwt("user_default_123", "default@example.com")
    with TestClient(app, headers={"Authorization": f"Bearer {token}"}) as c:
        yield c

@pytest.fixture
def unauth_client():
    """Unauthenticated client without Authorization header."""
    with TestClient(app) as c:
        yield c

@pytest.fixture
def user_a_client():
    """Authenticated client for User A."""
    token = make_test_jwt("user_a_111", "usera@example.com")
    with TestClient(app, headers={"Authorization": f"Bearer {token}"}) as c:
        yield c

@pytest.fixture
def user_b_client():
    """Authenticated client for User B."""
    token = make_test_jwt("user_b_222", "userb@example.com")
    with TestClient(app, headers={"Authorization": f"Bearer {token}"}) as c:
        yield c
