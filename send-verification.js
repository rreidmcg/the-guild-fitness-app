import { authUtils } from './server/auth.js';

async function sendEmailVerification() {
  const email = 'rreidmcg@gmail.com';
  const username = 'Rob';
  const token = '4093f3b77841ed7c49219f423b4ec7faa3759b73787ce789bd2d2a10a8a693fe';
  
  console.log('Sending verification email to:', email);
  console.log('Verification token:', token);
  
  try {
    const emailSent = await authUtils.sendVerificationEmail(email, username, token);
    
    if (emailSent) {
      console.log('✅ Verification email sent successfully!');
      console.log('Check your email inbox at:', email);
      console.log('Verification URL: http://localhost:5000/verify-email?token=' + token);
    } else {
      console.log('❌ Failed to send verification email');
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

sendEmailVerification();