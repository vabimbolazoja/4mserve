import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    priceNaira: {
      type: Number,
      required: true,
    },
    priceUsd: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    nutritionalInfo: {
      type: String,
      default: '',
    },
    storageInstructions: {
      type: String,
      default: '',
    },
    moq: {
      type: Number, // Minimum Order Quantity
      default: 1,
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    rate: {
      type: Number,
      default: '4',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;
