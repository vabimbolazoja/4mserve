import bcrypt from "bcryptjs"; // or "bcrypt"
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import Admin from '../models/admins.js';
import sendEmail from '../utils/sendMail.js';
import renderTemplate from '../utils/renderTemplate.js';

// ===============================
// Register
// ===============================
export const register = async (req, res) => {
  const { email, password , firstName, lastName, phoneNumber} = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      verificationToken,
    });

    await user.save();
    const verifyUrl = `https://www.4marketdays.com/verify-mail?token=${verificationToken}`;
    const html = renderTemplate({
      title: 'Verify Your Email',
      message: 'Thank you for registering! Please click the button below to verify your email.',
      action_url: verifyUrl,
      action_label: 'Verify Email',
      year: new Date().getFullYear(),
    });

    await sendEmail({
      to: email,
      subject: 'Email Verification',
      html,
    });

    res.status(201).json({ message: 'Registration successful. Please verify your email.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const registerAdmin = async (req, res) => {
  const { email, password,isAdmin,firstName,lastName } = req.body;

  try {
    const userExists = await Admin.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Admin already exists' });

    const admin = new Admin({
      email,
      password,
      firstName,lastName,
      isAdmin,
    });

    await admin.save();

    res.status(201).json({ message: 'Registration successful.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};





// ===============================
// Verify Email
// ===============================

export const verifyEmailAddressResend = async (req, res) => {
  const { email } = req.query;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate a new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    await user.save();

    const verifyUrl = `https://www.4marketdays.com/verify-mail?token=${verificationToken}`;
    const html = renderTemplate({
      title: 'Verify Your Email',
      message: 'Thank you for registering! Please click the button below to verify your email.',
      action_url: verifyUrl,
      action_label: 'Verify Email',
      year: new Date().getFullYear(),
    });

    await sendEmail({
      to: email,
      subject: 'Email Verification',
      html,
    });

    res.status(200).json({ message: 'Email verification re-sent successfully. Please verify your email.' });


  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}


export const verifyEmailAddress = async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ message: 'Invalid or expired verification token' });

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({ message: 'Email successfully verified' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ===============================
// Login
// ===============================
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });


    if (!user.isVerified) return res.status(403).json({ message: 'Please verify your email first' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.status(200).json({ token,user, firstName:user?.firstName, lastName:user?.lastName, message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Admin.findOne({ email });
    console.log(user)
    if (!user) return res.status(400).json({ message: 'Invalid credentials/Email' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials/Password' });

  
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,      // Required for HTTPS (Vercel is always HTTPS)
      sameSite: "none",  // Required for cross-site cookies
      path: "/",         // Cookie valid for entire site
    });

    // Return token
  
    res.status(200).json({ token });;

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// ===============================
// Forgot Password
// ===============================
export const initiatePasswordReset = async (req, res) => {
  const { email } = req.query;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    const resetUrl = `https://www.4marketdays.com/reset-password?token=${resetToken}`;
    const html = renderTemplate({
      title: 'Reset Your Password',
      message: 'Click the button below to reset your password. If you didn’t request this, ignore the email.',
      action_url: resetUrl,
      action_label: 'Reset Password',
      year: new Date().getFullYear(),
    });

    await sendEmail({
      to: user.email,
      subject: 'Password Reset',
      html,
    });

    res.status(200).json({ message: 'Password reset link sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ===============================
// Reset Password
// ===============================
export const resetPassword = async (req, res) => {
  const { token } = req.query;
  const { password } = req.body;

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

    const salt = await bcrypt.genSalt(10);
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ message: 'Password successfully reset' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
