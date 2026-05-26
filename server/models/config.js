// models/CountryConfig.js
import mongoose from "mongoose";

const countryConfigSchema = new mongoose.Schema(
  {
    country: { type: String, required: true, unique: true }, // e.g. Nigeria, USA
    deliveryPriceInKg: { type: Number, required: true },
    increment_percentage: { type: Number },
    maxqty: { type: Number }
  },
  { timestamps: true }
);

export default mongoose.model("CountryConfig", countryConfigSchema);
