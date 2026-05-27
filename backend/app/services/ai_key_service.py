import base64
from cryptography.fernet import Fernet
from flask import current_app

def get_fernet_cipher():
    # Retrieve AI_ENCRYPTION_KEY from config
    key = current_app.config.get('AI_ENCRYPTION_KEY', '')
    if not key:
        # Fallback key for testing/dev if not set
        key = Fernet.generate_key()
    
    # If the key is not url-safe base64 of 32 bytes, generate a valid one based on config string
    try:
        # Check if it is a valid Fernet key
        return Fernet(key)
    except Exception:
        # If it fails, let's pad/transform the config key to fit 32 bytes URL-safe base64
        # We take the string, encode it, pad it to 32 bytes, and base64 encode it.
        padded_key = (key + "travelmind_fallback_encryption_padding_keys")[:32].encode('utf-8')
        b64_key = base64.urlsafe_b64encode(padded_key)
        return Fernet(b64_key)

def encrypt_key(plain_text: str) -> str:
    """Encrypts plain API key to ciphertext."""
    if not plain_text:
        return ""
    cipher = get_fernet_cipher()
    encrypted_bytes = cipher.encrypt(plain_text.encode('utf-8'))
    return encrypted_bytes.decode('utf-8')

def decrypt_key(cipher_text: str) -> str:
    """Decrypts encrypted API key to plain text."""
    if not cipher_text:
        return ""
    cipher = get_fernet_cipher()
    decrypted_bytes = cipher.decrypt(cipher_text.encode('utf-8'))
    return decrypted_bytes.decode('utf-8')
