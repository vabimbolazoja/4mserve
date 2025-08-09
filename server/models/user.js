import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,

  },
  image: {
    type: String,
    required: false,
    unique: false,

  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isDisabled: {
    type: Boolean,
    default: false,
    required: false,
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, {
  timestamps: true,
});

// 🔐 Automatically hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Prevent OverwriteModelError
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
