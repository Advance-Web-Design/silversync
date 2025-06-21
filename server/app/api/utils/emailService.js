import nodemailer from 'nodemailer';

/**
 * Creates and configures email transporter based on environment variables
 * Supports Gmail, Outlook, and custom SMTP configurations
 */
function createEmailTransporter() {
  // Check if we have environment variables for email configuration
  const emailService = process.env.EMAIL_SERVICE; // 'gmail', 'outlook', or 'smtp'
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;

  if (!emailUser || !emailPassword) {
    console.warn('Email credentials not configured. Email functionality will be disabled.');
    return null;
  }

  let transporterConfig;

  switch (emailService?.toLowerCase()) {
    case 'gmail':
      transporterConfig = {
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPassword // Use App Password for Gmail
        }
      };
      break;
      
    case 'outlook':
      transporterConfig = {
        service: 'hotmail',
        auth: {
          user: emailUser,
          pass: emailPassword
        }
      };
      break;
      
    case 'smtp':
      if (!smtpHost || !smtpPort) {
        console.error('SMTP configuration incomplete. Need SMTP_HOST and SMTP_PORT.');
        return null;
      }
      transporterConfig = {
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: parseInt(smtpPort) === 465, // true for 465, false for other ports
        auth: {
          user: emailUser,
          pass: emailPassword
        }
      };
      break;
      
    default:
      console.error('Unsupported email service. Use gmail, outlook, or smtp.');
      return null;
  }
  try {
    return nodemailer.createTransport(transporterConfig);
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    return null;
  }
}

/**
 * Sends an email using the configured transporter
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content (optional)
 * @returns {Promise<boolean>} - True if email sent successfully
 */
export async function sendEmail({ to, subject, text, html }) {
  const transporter = createEmailTransporter();
  
  if (!transporter) {
    console.log('Email service not configured. Simulating email send:');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${text}`);
    console.log('📧 Email would be sent in production with proper configuration.');
    return true; // Return true for development/testing
  }

  try {
    const mailOptions = {
      from: {
        name: 'Connect the Shows Game',
        address: process.env.EMAIL_USER
      },
      to: to,
      subject: subject,
      text: text,
      html: html || text.replace(/\n/g, '<br>')
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email. Please try again later.');
  }
}

/**
 * Sends a password reset email with the new temporary password
 * @param {string} email - User's email address
 * @param {string} username - User's username
 * @param {string} newPassword - Temporary password
 * @returns {Promise<boolean>} - True if email sent successfully
 */
export async function sendPasswordResetEmail(email, username, newPassword) {
  const subject = 'Password Reset - Silver Sync';
  
  const textContent = `Hello ${username},

You have requested a password reset for your Silver Sync account.

Your temporary password is: ${newPassword}

For security reasons, please log in with this temporary password and change it immediately in your profile settings.

If you did not request this password reset, please contact support immediately.

Best regards,
Silver Sync Team`;
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - Silver Sync</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; min-height: 100vh;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); overflow: hidden;">
          
          <!-- Header Section -->          <div style="background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%); padding: 40px 30px; text-align: center; position: relative;">
            <div style="background: rgba(255, 255, 255, 0.1); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; border: 3px solid rgba(255, 255, 255, 0.3); line-height: 74px; text-align: center;">
              <span style="font-size: 36px; vertical-align: middle;">🔐</span>
            </div>
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">Password Reset</h1>
            <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px; font-weight: 400;">Silver Sync Account Security</p>
          </div>
          
          <!-- Content Section -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 15px 0; color: #333333; font-size: 24px; font-weight: 600;">Hello ${username}! 👋</h2>
              <p style="margin: 0; color: #666666; font-size: 16px; line-height: 1.6;">We received a request to reset your password for your Silver Sync account.</p>
            </div>
            
            <!-- Password Box -->
            <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0; box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);">
              <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 16px; font-weight: 500;">Your temporary password is:</p>
              <div style="background: rgba(255, 255, 255, 0.95); border-radius: 8px; padding: 15px; margin: 10px 0;">
                <span style="font-size: 24px; font-weight: 700; color: #2c5aa0; letter-spacing: 2px; font-family: 'Courier New', monospace;">${newPassword}</span>
              </div>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">Copy this password to log in</p>
            </div>
            
            <!-- Instructions -->
            <div style="background: #f8f9fa; border-left: 4px solid #ffd700; border-radius: 0 8px 8px 0; padding: 20px; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px; font-weight: 600; display: flex; align-items: center;">
                ⚠️ Important Security Notice
              </h3>
              <ul style="margin: 0; padding-left: 20px; color: #555555; line-height: 1.7;">
                <li>Change your password in your profile settings after logging in</li>
                <li>If you didn't request this reset, contact support immediately</li>
              </ul>
            </div>
              <!-- Action Button -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="https://silversync.vercel.app/" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 25px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                🚀 Go to Login Page
              </a>
            </div>
          </div>
          
          <!-- Footer Section -->
          <div style="background: #f8f9fa; padding: 25px 30px; border-top: 1px solid #e9ecef;">
            <div style="text-align: center;">
              <div style="margin-bottom: 15px;">
                <span style="font-size: 24px;">🎮</span>
                <span style="color: #333333; font-weight: 600; font-size: 18px; margin-left: 8px;">Silver Sync</span>
              </div>
              <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">This is an automated message from Silver Sync Game Platform</p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © 2025 Silver Sync Team. All rights reserved.<br>
                Need help? Contact us at silversync@gmail.com
              </p>
            </div>
          </div>
          
        </div>
        
        <!-- Bottom spacing -->
        <div style="height: 40px;"></div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: subject,
    text: textContent,
    html: htmlContent
  });
}
