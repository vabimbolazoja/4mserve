import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    postalcode: {
      type: String,
      required: true,
    },
     state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
  
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

const Store = mongoose.models.Store || mongoose.model('Store', storeSchema);
export default Store;
