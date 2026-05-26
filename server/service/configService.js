// services/configService.js
import CountryConfig from "../models/config.js";

// Get all configs
export async function getAllConfigs() {
  return await CountryConfig.find({});
}

// Get config by country
export async function getConfigByCountry(country) {
  return await CountryConfig.findOne({ country });
}

// Update or create config for a country
export async function upsertConfig(
  country,
  deliveryPriceInKg,
  increment_percentage,
  maxqty
) {
  const config = await CountryConfig.findOneAndUpdate(
    { country },
    { deliveryPriceInKg, increment_percentage, maxqty },
    { new: true, upsert: true } // create if not exists
  );
  return config;
}
