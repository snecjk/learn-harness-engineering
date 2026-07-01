import secrets
import string

def generate_api_key(length=32):
    chars = string.ascii_letters + string.digits  # A-Za-z0-9
    return ''.join(secrets.choice(chars) for _ in range(length))

print("APIv2 密钥:", generate_api_key())
