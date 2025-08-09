import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    default: 0,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId, // ✅ Store as ObjectId reference
    ref: 'User',
    required: false,
  },
  paymentRef: {
    type: String,
  },
  paymentType: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  orderId: {
    type: String,
  },
  paymentStatus: {
    type: String,
    default: 'PENDING',
  },

}, {
  timestamps: true, // ✅ Automatically manage createdAt & updatedAt
});

// ✅ Prevent OverwriteModelError
const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export default Payment;
