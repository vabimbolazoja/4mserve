import fetch from "node-fetch";

export const validateAddress = async (req, res) => {
  try {
    // Use query param since frontend sends address in URL
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ message: "Address is required" });
    }

    // Call Nominatim API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
      {
        headers: {
          "User-Agent": "YourAppName/1.0 (support@yourapp.com)",
          "Accept-Language": "en",
        },
      }
    );

    if (response.status === 429) {
      return res.status(429).json({ message: "Too many requests to Nominatim. Please try later." });
    }

    if (!response.ok) {
      return res.status(500).json({ message: "Error querying Nominatim API" });
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      return res.status(404).json({ message: "Address not found or invalid" });
    }

    const displayName = data[0].display_name.toLowerCase();
    let country = null;

    // ✅ Handle common variations
    if (displayName.includes("nigeria")) country = "Nigeria";
    else if (
      displayName.includes("united states") ||
      displayName.includes("usa") ||
      displayName.includes("united states of america")
    ) country = "United States";
    else if (displayName.includes("canada")) country = "Canada";
    else if (
      displayName.includes("netherlands") ||
      displayName.includes("holland")
    ) country = "Netherlands";
    else if (
      displayName.includes("spain") ||
      displayName.includes("españa")
    ) country = "Spain";

    if (!country) {
      return res.status(400).json({ message: "❌ Address not supported for delivery" });
    }

    return res.json({
      message: "✅ Address validated successfully",
      country,
      normalizedAddress: data[0].display_name, // full human-readable address
      lat: data[0].lat,
      lon: data[0].lon,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
