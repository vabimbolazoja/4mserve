import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  deliveryInfo: {
    address: { type: String, required: true },
    name:{ type: String, required: true },
    email:{ type: String, required: true },
    phone:{ type: String, required: true },
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId, // ✅ Reference to User
    ref: 'User',
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  orderStatus: {
    type: String,
    default: 'PENDING',
  },
  totalAmt: {
    type: Number,
    default: 0,
  },
  paymentStatus: {
    type: String,
    default: 'PENDING',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  ref: {
    type: String,
    unique: true,
  },
  deliveryStatus: {
    type: String,
    default: 'PENDING',
  },
  location: {
    type: String,
  },
  expectedDate: {
    type: String,
  },
  rider: {
    type: String,
  },
  paymentType: {
    type: String,
  },
  orders: [
    {
      prod_id: { type: String, required: true },
      prod_name: { type: String, required: true },
      moq: { type: Number, required: true },
      image: { type: String, required: true },
      price: { type: Number, required: true },
      qty: { type: Number, required: true },
      subtotal: { type: Number, required: true },
    },
  ],
}, {
  timestamps: true, // ✅ auto createdAt & updatedAt
});

// ✅ Prevent OverwriteModelError
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;
