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
    priceGbp: {
      type: Number,
      required: true,
    },
    priceCanada: {
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
    stock: {
      type: Number,
      default: 0,
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

const normalizeCurrencyFields = (_doc, ret) => {
  ret.priceGbp = ret.priceGbp != null ? ret.priceGbp : null;
  ret.priceCanada = ret.priceCanada != null ? ret.priceCanada : null;
  return ret;
};

productSchema.set('toJSON', { transform: normalizeCurrencyFields });
productSchema.set('toObject', { transform: normalizeCurrencyFields });

if (mongoose.models.Product) {
  delete mongoose.models.Product;
}

const Product = mongoose.model('Product', productSchema);
export default Product;
