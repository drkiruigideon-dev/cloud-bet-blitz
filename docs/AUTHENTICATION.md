# Cloud Bet Blitz Authentication

## Document Information

**Project:** Cloud Bet Blitz  
**Version:** 2.0  
**Status:** Draft  
**Last Updated:** June 2026  
**Owner:** Gideon Kirui

---

# Overview

Cloud Bet Blitz uses **Supabase Authentication** as the identity provider.

Passwords are securely hashed and managed by Supabase. Application-specific user information is stored in the `profiles` table.

---

# Authentication Flow

```
User
 │
 ▼
Enter Phone Number + Password
 │
 ▼
Supabase Authentication
 │
 ▼
JWT Token
 │
 ▼
Protected Routes
 │
 ▼
Database (RLS)
```

---

# Registration Flow

1. User enters:
   - Username
   - Phone Number
   - Password
   - Confirm Password

2. Supabase creates the authentication account.

3. Database trigger executes:
   - Create Profile
   - Create Wallet
   - Assign Default User Role

4. User is automatically logged in.

---

# Login Flow

Phone Number

↓

Retrieve associated account

↓

Password Verification

↓

JWT Token

↓

Application Access

---

# Security

- Passwords are never stored in plaintext.
- JWT authentication.
- Row Level Security enabled.
- Protected routes.
- Session validation.

---

# Future Improvements

- Phone OTP Verification
- Password Reset via SMS
- Two-Factor Authentication (2FA)
- Device Management