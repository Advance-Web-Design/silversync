# Email Configuration Guide for Forgot Password Feature

The "Forgot Password" feature is now fully implemented! Here's how to set it up:

## Current Status
✅ **Frontend**: Complete with proper UI, loading states, and error handling  
✅ **Backend**: Complete with email verification and password reset logic  
✅ **Email Service**: Ready to use with multiple email providers  

## Quick Setup

### Option 1: Development/Testing Mode (Default)
No configuration needed! The system will simulate email sending and log the password reset details to the server console.

When a user requests a password reset, you'll see output like:
```
📧 EMAIL SIMULATION - Password Reset Email Sent
📧 To: user@example.com
📧 Subject: Password Reset - Connect the Shows
📧 Message Content:
[New temporary password will be shown here]
```

### Option 2: Real Email Service (Production)

1. **Create a `.env.local` file** in the `server` directory
2. **Choose your email service** and add the configuration:

#### For Gmail (Recommended):
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Gmail Setup Steps:**
1. Enable 2-factor authentication on your Gmail account
2. Go to [App Passwords](https://support.google.com/accounts/answer/185833)
3. Generate an app password for "Mail"
4. Use that 16-character password (not your regular password)

#### For Outlook/Hotmail:
```env
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-outlook-password
```

#### For Custom SMTP:
```env
EMAIL_SERVICE=smtp
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=your-smtp-password
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
```

## How It Works

1. **User enters username and email** on the forgot password form
2. **Backend verifies** that the username exists and email matches
3. **New temporary password** is generated (8 characters, includes uppercase and numbers)
4. **Password is updated** in the Firebase database (hashed)
5. **Email is sent** with the temporary password
6. **User receives email** and can log in with the temporary password
7. **User should change password** immediately after logging in

## Security Features

- ✅ Email validation (proper email format)
- ✅ Username and email must match exactly
- ✅ Passwords are hashed before storing
- ✅ Generic error messages (doesn't reveal if username/email exists)
- ✅ Temporary passwords are strong (uppercase, lowercase, numbers)
- ✅ HTML and text email formats
- ✅ Professional email template

## Testing

1. **Start both servers**:
   ```bash
   # Terminal 1 - Server
   cd server
   npm run dev
   
   # Terminal 2 - Client  
   cd client
   npm run dev
   ```

2. **Open the app**: http://localhost:5173
3. **Click "Login"** button
4. **Click "Forgot password?"** link
5. **Enter a valid username and email** from your database
6. **Check server console** for the email content (in development mode)
7. **Use the temporary password** to log in

## Troubleshooting

**"Email service not configured" message**: This is normal in development mode. The password reset still works - check the server console for the temporary password.

**"Failed to send email"**: Check your email credentials in `.env.local` and make sure:
- Gmail: You're using an App Password, not your regular password
- Outlook: Your account doesn't require 2FA or use an app password
- SMTP: Your host, port, and credentials are correct

**"User does not exist" or "Email does not match"**: For security, these show generic messages. Make sure you're testing with valid usernames and emails from your database.

## Email Template Preview

The password reset email includes:
- Professional styling with your app colors
- Clear instructions
- Prominent display of the temporary password  
- Security warnings
- Both HTML and plain text versions

Ready to test! 🚀
