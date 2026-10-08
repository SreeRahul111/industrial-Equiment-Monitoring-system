try:
    from argon2 import PasswordHasher
    from argon2.exceptions import VerifyMismatchError
    _hasher = PasswordHasher()
    def get_password_hash(password: str) -> str:
        return _hasher.hash(password)

    def verify_password(plain_password: str, hashed_password: str) -> bool:
        try:
            return _hasher.verify(hashed_password, plain_password)
        except (VerifyMismatchError, Exception):
            return False
except ImportError:
    import hashlib
    import secrets

    def get_password_hash(password: str) -> str:
        salt = secrets.token_hex(16)
        key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return f"{salt}${key.hex()}"

    def verify_password(plain_password: str, hashed_password: str) -> bool:
        try:
            salt, key_hex = hashed_password.split('$', 1)
            key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000)
            return secrets.compare_digest(key.hex(), key_hex)
        except Exception:
            return False
