// models/CountryConfig.js
import mongoose from "mongoose";

const countryConfigSchema = new mongoose.Schema(
  {
    country: { type: String, required: true, unique: true }, // e.g. Nigeria, USA
    deliveryPriceInKg: { type: Number, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("CountryConfig", countryConfigSchema);
