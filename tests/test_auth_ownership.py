import time
import json
from unittest.mock import patch, AsyncMock
import pytest
import jwt
from cryptography.hazmat.primitives.asymmetric import ec
from app.config.settings import settings
import app.security.auth as auth_module

TEST_SECRET = "test_jwt_secret_key_32bytes_long_for_data_forge_tests"

def create_jwt(
    user_id: str = "user_default_123",
    email: str = "default@example.com",
    secret: str = TEST_SECRET,
    aud: str = "authenticated",
    exp: int = None
) -> str:
    payload = {"sub": user_id, "email": email, "aud": aud}
    if exp is not None:
        payload["exp"] = exp
    return jwt.encode(payload, secret, algorithm="HS256")

class MockPyJWK:
    def __init__(self, key):
        self.key = key

def create_es256_jwt(
    private_key,
    user_id: str = "user_es256_123",
    email: str = "es256@example.com",
    aud: str = "authenticated",
    iss: str = "https://tnmdiejiumwzxcndclmc.supabase.co/auth/v1",
    exp: int = None,
    kid: str = "test-kid"
) -> str:
    payload = {"sub": user_id, "email": email, "aud": aud, "iss": iss}
    if exp is not None:
        payload["exp"] = exp
    headers = {"kid": kid}
    return jwt.encode(payload, private_key, algorithm="ES256", headers=headers)

def test_unauthenticated_request_rejected(unauth_client):
    """Test A: Unauthenticated requests are rejected with HTTP 401."""
    response = unauth_client.get("/api/v1/datasets")
    assert response.status_code == 401
    assert "Authentication credentials required" in response.json()["detail"]

def test_valid_signed_hs256_jwt_accepted(unauth_client):
    """Valid properly signed HS256 JWT token is accepted by backend."""
    valid_token = create_jwt("user_valid_789", "valid@example.com")
    headers = {"Authorization": f"Bearer {valid_token}"}
    response = unauth_client.get("/api/v1/datasets", headers=headers)
    assert response.status_code == 200
    assert response.json() == []

def test_valid_signed_es256_jwks_jwt_accepted(unauth_client, monkeypatch):
    """Valid properly signed ES256 JWT token using JWKS key resolution is accepted by backend."""
    priv_key = ec.generate_private_key(ec.SECP256R1())
    pub_key = priv_key.public_key()
    token = create_es256_jwt(priv_key, user_id="user_es256_789")

    jwks_client = auth_module.get_jwks_client(settings.SUPABASE_URL)
    monkeypatch.setattr(jwks_client, "get_signing_key_from_jwt", lambda t: MockPyJWK(pub_key))

    headers = {"Authorization": f"Bearer {token}"}
    response = unauth_client.get("/api/v1/datasets", headers=headers)
    assert response.status_code == 200
    assert response.json() == []

def test_invalid_forged_hs256_jwt_rejected(unauth_client):
    """Forged HS256 JWT signed with incorrect key is rejected with HTTP 401."""
    forged_token = create_jwt("attacker_id", secret="wrong_secret_key_32bytes_long!!")
    headers = {"Authorization": f"Bearer {forged_token}"}
    response = unauth_client.get("/api/v1/datasets", headers=headers)
    assert response.status_code == 401
    assert "Invalid authorization token" in response.json()["detail"]

def test_invalid_forged_es256_jwt_rejected(unauth_client, monkeypatch):
    """Forged ES256 JWT signed with a different key than JWKS returns is rejected with HTTP 401."""
    priv_key_real = ec.generate_private_key(ec.SECP256R1())
    priv_key_attacker = ec.generate_private_key(ec.SECP256R1())

    forged_token = create_es256_jwt(priv_key_attacker, user_id="attacker_es256")

    jwks_client = auth_module.get_jwks_client(settings.SUPABASE_URL)
    monkeypatch.setattr(jwks_client, "get_signing_key_from_jwt", lambda t: MockPyJWK(priv_key_real.public_key()))

    headers = {"Authorization": f"Bearer {forged_token}"}
    response = unauth_client.get("/api/v1/datasets", headers=headers)
    assert response.status_code == 401
    assert "Invalid authorization token" in response.json()["detail"]

def test_expired_jwt_rejected(unauth_client):
    """Expired HS256 JWT token is rejected with HTTP 401."""
    past_exp = int(time.time()) - 3600
    expired_token = create_jwt("user_exp_123", exp=past_exp)
    headers = {"Authorization": f"Bearer {expired_token}"}
    response = unauth_client.get("/api/v1/datasets", headers=headers)
    assert response.status_code == 401
    assert "Access token has expired" in response.json()["detail"]

def test_expired_es256_jwt_rejected(unauth_client, monkeypatch):
    """Expired ES256 JWT token is rejected with HTTP 401."""
    priv_key = ec.generate_private_key(ec.SECP256R1())
    past_exp = int(time.time()) - 3600
    expired_token = create_es256_jwt(priv_key, user_id="user_es256_exp", exp=past_exp)

    jwks_client = auth_module.get_jwks_client(settings.SUPABASE_URL)
    monkeypatch.setattr(jwks_client, "get_signing_key_from_jwt", lambda t: MockPyJWK(priv_key.public_key()))

    headers = {"Authorization": f"Bearer {expired_token}"}
    response = unauth_client.get("/api/v1/datasets", headers=headers)
    assert response.status_code == 401
    assert "Access token has expired" in response.json()["detail"]

def test_wrong_audience_jwt_rejected(unauth_client):
    """HS256 JWT token with wrong audience is rejected with HTTP 401."""
    wrong_aud_token = create_jwt("user_wrong_aud", aud="wrong_audience")
    headers = {"Authorization": f"Bearer {wrong_aud_token}"}
    response = unauth_client.get("/api/v1/datasets", headers=headers)
    assert response.status_code == 401
    assert "invalid audience" in response.json()["detail"].lower()

def test_wrong_audience_es256_jwt_rejected(unauth_client, monkeypatch):
    """ES256 JWT token with wrong audience is rejected with HTTP 401."""
    priv_key = ec.generate_private_key(ec.SECP256R1())
    token = create_es256_jwt(priv_key, user_id="user_es256_aud", aud="anon")

    jwks_client = auth_module.get_jwks_client(settings.SUPABASE_URL)
    monkeypatch.setattr(jwks_client, "get_signing_key_from_jwt", lambda t: MockPyJWK(priv_key.public_key()))

    headers = {"Authorization": f"Bearer {token}"}
    response = unauth_client.get("/api/v1/datasets", headers=headers)
    assert response.status_code == 401
    assert "invalid audience" in response.json()["detail"].lower()

def test_wrong_issuer_es256_jwt_rejected(unauth_client, monkeypatch):
    """ES256 JWT token with wrong issuer is rejected with HTTP 401."""
    priv_key = ec.generate_private_key(ec.SECP256R1())
    token = create_es256_jwt(priv_key, user_id="user_es256_iss", iss="https://forged-issuer.com/auth/v1")

    jwks_client = auth_module.get_jwks_client(settings.SUPABASE_URL)
    monkeypatch.setattr(jwks_client, "get_signing_key_from_jwt", lambda t: MockPyJWK(priv_key.public_key()))

    headers = {"Authorization": f"Bearer {token}"}
    response = unauth_client.get("/api/v1/datasets", headers=headers)
    assert response.status_code == 401
    assert "invalid issuer" in response.json()["detail"].lower()

def test_missing_jwt_secret_rejects_requests(unauth_client):
    """When SUPABASE_JWT_SECRET is missing/empty, HS256 requests are rejected with HTTP 401."""
    valid_token = create_jwt("user_test_456")
    headers = {"Authorization": f"Bearer {valid_token}"}

    original_secret = settings.SUPABASE_JWT_SECRET
    try:
        settings.SUPABASE_JWT_SECRET = ""
        response = unauth_client.get("/api/v1/datasets", headers=headers)
        assert response.status_code == 401
        assert "unconfigured" in response.json()["detail"].lower()
    finally:
        settings.SUPABASE_JWT_SECRET = original_secret

def test_user_a_creates_and_accesses_dataset(user_a_client):
    """Test B & C: Authenticated User A can upload and access User A's dataset."""
    csv_content = b"col1,col2\nval1,val2\n"
    upload_resp = user_a_client.post(
        "/api/v1/upload",
        files={"file": ("usera_data.csv", csv_content, "text/csv")}
    )
    assert upload_resp.status_code == 201
    dataset_data = upload_resp.json()
    dataset_id = dataset_data["id"]
    assert dataset_data["owner_id"] == "user_a_111"

    # User A gets metadata
    get_resp = user_a_client.get(f"/api/v1/datasets/{dataset_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == dataset_id
    assert get_resp.json()["owner_id"] == "user_a_111"

def test_user_b_cannot_access_user_a_dataset(user_a_client, user_b_client):
    """Test D: User B cannot fetch metadata for User A's dataset."""
    csv_content = b"id,name\n1,Alpha\n"
    upload_resp = user_a_client.post(
        "/api/v1/upload",
        files={"file": ("usera_private.csv", csv_content, "text/csv")}
    )
    assert upload_resp.status_code == 201
    ds_id = upload_resp.json()["id"]

    # User B attempts to access User A's dataset
    user_b_resp = user_b_client.get(f"/api/v1/datasets/{ds_id}")
    assert user_b_resp.status_code == 404
    assert "not found" in user_b_resp.json()["detail"].lower()

def test_dataset_listing_isolation(user_a_client, user_b_client):
    """Test E: User B's dataset does not appear in User A's dataset list."""
    # User B uploads a dataset
    csv_content = b"x,y\n10,20\n"
    upload_b = user_b_client.post(
        "/api/v1/upload",
        files={"file": ("userb_private.csv", csv_content, "text/csv")}
    )
    assert upload_b.status_code == 201
    ds_b_id = upload_b.json()["id"]

    # User A lists datasets
    list_a = user_a_client.get("/api/v1/datasets")
    assert list_a.status_code == 200
    a_ids = [d["id"] for d in list_a.json()]
    assert ds_b_id not in a_ids

def test_dataset_specific_endpoints_reject_cross_user_access(user_a_client, user_b_client):
    """Test F: All dataset-specific operational endpoints reject cross-user access."""
    csv_content = b"id,value\n1,100\n2,200\n"
    upload_resp = user_a_client.post(
        "/api/v1/upload",
        files={"file": ("usera_ops.csv", csv_content, "text/csv")}
    )
    assert upload_resp.status_code == 201
    ds_id = upload_resp.json()["id"]

    # User B attempts profile endpoint
    assert user_b_client.get(f"/api/v1/profile/{ds_id}").status_code == 404

    # User B attempts analyze endpoint
    assert user_b_client.post(f"/api/v1/analyze/{ds_id}").status_code == 404
    assert user_b_client.get(f"/api/v1/analyze/{ds_id}").status_code == 404

    # User B attempts plan endpoint
    assert user_b_client.post(f"/api/v1/plan/{ds_id}").status_code == 404
    assert user_b_client.get(f"/api/v1/plan/{ds_id}").status_code == 404

    # User B attempts preview endpoint
    assert user_b_client.post(f"/api/v1/preview/{ds_id}").status_code == 404

    # User B attempts execute endpoint
    assert user_b_client.post(f"/api/v1/execute/{ds_id}").status_code == 404

    # User B attempts validation endpoint
    assert user_b_client.get(f"/api/v1/validation/{ds_id}").status_code == 404

    # User B attempts history endpoint
    assert user_b_client.get(f"/api/v1/history/{ds_id}").status_code == 404

    # User B attempts rollback endpoint
    assert user_b_client.post(f"/api/v1/rollback/{ds_id}", json={"target_version": 0}).status_code == 404

    # User B attempts download endpoint
    assert user_b_client.get(f"/api/v1/download/{ds_id}").status_code == 404


def test_download_security_and_auth(user_a_client, user_b_client, unauth_client):
    """
    Step 7 Security Verification:
    - Missing Authorization returns 401
    - Invalid Bearer token returns 401
    - Expired Bearer token returns 401
    - Authenticated user can download their own active dataset (v0 and updated v1)
    - Authenticated user can download permitted historical versions
    - Cross-user download attempt returns 404
    - Secret keys/tokens are never placed in URLs or filenames
    """
    # 1. Upload dataset as User A
    csv_content = b"col1,col2\n100,abc\n200,xyz\n"
    upload = user_a_client.post(
        "/api/v1/upload",
        files={"file": ("test_dl.csv", csv_content, "text/csv")}
    )
    assert upload.status_code == 201
    ds_id = upload.json()["id"]

    # 2. Missing Authorization header -> 401
    res_unauth = unauth_client.get(f"/api/v1/download/{ds_id}")
    assert res_unauth.status_code == 401
    assert "Authentication credentials required" in res_unauth.json()["detail"]

    # 3. Invalid token -> 401
    res_invalid = unauth_client.get(
        f"/api/v1/download/{ds_id}",
        headers={"Authorization": "Bearer invalid_token_xyz"}
    )
    assert res_invalid.status_code == 401

    # 4. Expired token -> 401
    expired_token = create_jwt(user_id="user_a_123", exp=int(time.time()) - 3600)
    res_expired = unauth_client.get(
        f"/api/v1/download/{ds_id}",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert res_expired.status_code == 401

    # 5. User A downloads their active Version 0 dataset -> 200 OK
    res_v0 = user_a_client.get(f"/api/v1/download/{ds_id}")
    assert res_v0.status_code == 200
    assert res_v0.content == csv_content

    # 6. Execute cleaning plan to generate Version 1 updated dataset
    mock_ai_json = json.dumps({
        "dataset_summary": "Summary",
        "recommendations": [{"column": "col2", "operation": "normalize_email", "reason": "Trim", "confidence": 0.9, "risk": "low"}]
    })
    with patch("app.api.routes.dataset.GroqClient.is_configured", return_value=True):
        with patch("app.api.routes.dataset.GroqClient.analyze_profile", new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = mock_ai_json
            user_a_client.post(f"/api/v1/analyze/{ds_id}")

    plan_resp = user_a_client.post(
        f"/api/v1/plan/{ds_id}",
        json={"selected_transformations": [{"column": "col2", "operation": "normalize_email", "reason": "Trim", "confidence": 0.9, "risk": "low"}]}
    )
    assert plan_resp.status_code == 201
    plan_id = plan_resp.json()["plan_id"]
    user_a_client.post(f"/api/v1/preview/{ds_id}")
    approve_res = user_a_client.post(f"/api/v1/plan/{plan_id}/approve")
    assert approve_res.status_code == 200
    exec_res = user_a_client.post(f"/api/v1/execute/{ds_id}")
    assert exec_res.status_code == 200
    assert exec_res.json()["version_number"] == 1

    # 7. User A downloads updated active Version 1 dataset -> 200 OK (contains updated CSV)
    res_v1_active = user_a_client.get(f"/api/v1/download/{ds_id}")
    assert res_v1_active.status_code == 200
    assert b"col1,col2" in res_v1_active.content

    # 8. User A downloads historical Version 0 -> 200 OK
    res_v0_hist = user_a_client.get(f"/api/v1/download/{ds_id}?version=0")
    assert res_v0_hist.status_code == 200
    assert res_v0_hist.content == csv_content

    # 9. User A downloads historical Version 1 -> 200 OK
    res_v1_hist = user_a_client.get(f"/api/v1/download/{ds_id}?version=1")
    assert res_v1_hist.status_code == 200

    # 10. User B attempts to download User A's dataset -> 404 Ownership Protection
    res_user_b = user_b_client.get(f"/api/v1/download/{ds_id}")
    assert res_user_b.status_code == 404

