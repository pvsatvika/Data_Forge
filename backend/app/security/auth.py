from dataclasses import dataclass
from typing import Optional, Dict
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import PyJWKClient

from app.config.settings import settings

security = HTTPBearer(auto_error=False)

@dataclass
class AuthenticatedUser:
    id: str
    email: Optional[str] = None

_jwks_clients: Dict[str, PyJWKClient] = {}

def get_jwks_client(supabase_url: str) -> PyJWKClient:
    url = supabase_url.rstrip("/")
    jwks_url = f"{url}/auth/v1/.well-known/jwks.json"
    if jwks_url not in _jwks_clients:
        _jwks_clients[jwks_url] = PyJWKClient(jwks_url)
    return _jwks_clients[jwks_url]

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> AuthenticatedUser:
    """
    FastAPI dependency that extracts and verifies Supabase JWT bearer access tokens.
    Obtains the authenticated user's Supabase user ID ('sub' claim).
    Rejects unauthenticated requests with HTTP 401 Unauthorized.
    Supports asymmetric JWKS verification (ES256, RS256) and symmetric HMAC secret verification (HS256).
    Never accepts unverified tokens.
    """
    if not credentials or not credentials.credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials required. Please provide a valid Supabase Bearer token.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = credentials.credentials

    try:
        header = jwt.get_unverified_header(token)
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authorization token header: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"}
        )

    alg = header.get("alg")
    kid = header.get("kid")

    # Determine verification strategy based on algorithm and kid
    if alg in ["ES256", "RS256"] or (kid is not None and alg != "HS256"):
        if not settings.SUPABASE_URL:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed: SUPABASE_URL is unconfigured for JWKS token verification.",
                headers={"WWW-Authenticate": "Bearer"}
            )
        try:
            jwks_client = get_jwks_client(settings.SUPABASE_URL)
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            expected_issuer = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1"
            
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256", "RS256"],
                audience=settings.SUPABASE_AUDIENCE or "authenticated",
                issuer=expected_issuer,
                options={
                    "verify_aud": True,
                    "verify_iss": True,
                    "verify_signature": True
                }
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Access token has expired. Please sign in again.",
                headers={"WWW-Authenticate": "Bearer"}
            )
        except jwt.InvalidAudienceError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization token: invalid audience.",
                headers={"WWW-Authenticate": "Bearer"}
            )
        except jwt.InvalidIssuerError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization token: invalid issuer.",
                headers={"WWW-Authenticate": "Bearer"}
            )
        except jwt.PyJWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authorization token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"}
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"JWKS verification failed: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"}
            )

    elif alg == "HS256":
        if not settings.SUPABASE_JWT_SECRET:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed: server JWT verification secret is unconfigured.",
                headers={"WWW-Authenticate": "Bearer"}
            )
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience=settings.SUPABASE_AUDIENCE or None,
                options={
                    "verify_aud": bool(settings.SUPABASE_AUDIENCE),
                    "verify_signature": True
                }
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Access token has expired. Please sign in again.",
                headers={"WWW-Authenticate": "Bearer"}
            )
        except jwt.InvalidAudienceError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization token: invalid audience.",
                headers={"WWW-Authenticate": "Bearer"}
            )
        except jwt.PyJWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authorization token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"}
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: unsupported token algorithm '{alg}'.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing required user identifier ('sub').",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return AuthenticatedUser(
        id=str(user_id),
        email=payload.get("email")
    )
