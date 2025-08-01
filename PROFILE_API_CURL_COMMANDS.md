# Profile Management API - cURL Commands

## 🔐 **Authentication**
Replace `YOUR_JWT_TOKEN` with your actual JWT token from login.

## 📋 **API Endpoints & cURL Commands**

### 1. **GET Profile**
```bash
curl -X GET "http://localhost:3000/admin/users/profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@medoscopic.com",
    "phone": "+1 (555) 123-4567",
    "location": "San Francisco, CA",
    "bio": "Admin user for MedoScopic Pharma content management system.",
    "avatar": "/uploads/avatars/admin-avatar.jpg",
    "role": "Administrator",
    "joinDate": "2024-01-15T00:00:00Z",
    "lastLogin": "2024-01-20T10:30:00Z",
    "isActive": true,
    "permissions": ["read", "write", "delete", "admin"],
    "preferences": {
      "theme": "light",
      "language": "en",
      "notifications": {
        "email": true,
        "push": false
      }
    }
  },
  "message": "Profile retrieved successfully"
}
```

### 2. **UPDATE Profile**
```bash
curl -X PUT "http://localhost:3000/admin/users/profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@medoscopic.com",
    "phone": "+1 (555) 123-4567",
    "location": "San Francisco, CA",
    "bio": "Admin user for MedoScopic Pharma content management system. Responsible for managing website content, products, and user accounts."
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@medoscopic.com",
    "phone": "+1 (555) 123-4567",
    "location": "San Francisco, CA",
    "bio": "Admin user for MedoScopic Pharma content management system. Responsible for managing website content, products, and user accounts.",
    "avatar": "/uploads/avatars/admin-avatar.jpg",
    "role": "Administrator",
    "joinDate": "2024-01-15T00:00:00Z",
    "lastLogin": "2024-01-20T10:30:00Z",
    "updatedAt": "2024-01-20T15:45:00Z"
  },
  "message": "Profile updated successfully"
}
```

### 3. **UPLOAD Avatar**
```bash
curl -X POST "http://localhost:3000/admin/users/profile/avatar" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/your/avatar.jpg"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "avatar": "/uploads/avatars/new-avatar-123.jpg",
    "avatarUrl": "https://yourdomain.com/uploads/avatars/new-avatar-123.jpg"
  },
  "message": "Avatar uploaded successfully"
}
```

### 4. **CHANGE Password (Step 1: Send OTP)**
```bash
curl -X PUT "http://localhost:3000/admin/users/profile/password" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "oldPassword123",
    "newPassword": "NewPassword456!",
    "confirmPassword": "NewPassword456!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email for password change verification"
}
```

### 5. **VERIFY OTP and Change Password (Step 2: Verify OTP)**
```bash
curl -X POST "http://localhost:3000/admin/users/profile/password/verify-otp" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "otp": "123456"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### 6. **REQUEST Password Reset (Public Endpoint)**
```bash
curl -X POST "http://localhost:3000/admin/users/profile/password/reset-request" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@medoscopic.com"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password reset link sent to your email"
}
```

### 7. **RESET Password with Token (Public Endpoint)**
```bash
curl -X POST "http://localhost:3000/admin/users/profile/password/reset" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_from_email",
    "password": "NewPassword456!",
    "confirmPassword": "NewPassword456!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### 8. **UPDATE Preferences**
```bash
curl -X PUT "http://localhost:3000/admin/users/profile/preferences" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "theme": "dark",
    "language": "en",
    "emailNotifications": true,
    "pushNotifications": false
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@medoscopic.com",
    "preferences": {
      "theme": "dark",
      "language": "en",
      "notifications": {
        "email": true,
        "push": false
      }
    }
  },
  "message": "Preferences updated successfully"
}
```

### 9. **GET User Activity**
```bash
curl -X GET "http://localhost:3000/admin/users/profile/activity?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "activity_123",
      "action": "Profile Updated",
      "entity": "User",
      "entityName": "Admin User",
      "timestamp": "2024-01-20T15:45:00Z",
      "type": "update",
      "details": null
    },
    {
      "id": "activity_124",
      "action": "Password Changed",
      "entity": "User",
      "entityName": "Admin User",
      "timestamp": "2024-01-20T14:30:00Z",
      "type": "update",
      "details": null
    }
  ],
  "message": "User activity retrieved successfully"
}
```

## 🔒 **Security Features**

### **Two-Step Password Change:**
1. **Step 1**: Send current password + new password → Receive OTP via email
2. **Step 2**: Verify OTP → Password changed successfully

### **Password Reset Flow:**
1. **Request Reset**: Send email → Receive reset token + OTP via email
2. **Reset Password**: Use token + OTP + new password → Password reset

### **Password Requirements:**
- Minimum 8 characters
- Must contain uppercase, lowercase, number, and special character
- Example: `NewPassword456!`

## 📧 **Email Integration**
- OTP emails sent for password changes
- Reset emails sent for password resets
- All activities logged in dashboard

## 🎯 **Activity Logging**
All profile actions are automatically logged and appear in:
- Dashboard recent activity
- User activity endpoint
- System audit trail

## ⚠️ **Error Responses**

### **Validation Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["Email is required"],
      "firstName": ["First name must be at least 2 characters"]
    }
  }
}
```

### **Authentication Error:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Current password is incorrect"
  }
}
```

### **Not Found Error:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found"
  }
}
```

## 🚀 **Testing Tips**

1. **Start with GET profile** to see current data
2. **Test validation** by sending invalid data
3. **Test password flow** step by step
4. **Check activity logs** after each action
5. **Verify email integration** (OTP sending)
6. **Test file upload** with avatar endpoint

## 📝 **Notes**

- All endpoints require JWT authentication except password reset endpoints
- OTP expires in 10 minutes
- Reset tokens expire in 24 hours
- File upload supports common image formats
- All activities are logged for audit trail
- Password requirements are enforced server-side 