import fetch from "node-fetch";

export const validateAddress = async (req, res) => {
  try {
    const { address } = req.query;

    if (!address || address.trim().length < 5) {
      return res.status(400).json({ message: "Please provide a valid address" });
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
      {
        headers: {
          // 👇 must be a real identifier, not placeholder
          "User-Agent": "MyDeliveryApp/1.0 (support@mydelivery.com)",
          "Accept-Language": "en",
        },
      }
    );

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ message: "Error querying Nominatim API" });
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "Address not found or invalid" });
    }

    const displayName = data[0].display_name?.toLowerCase() || "";
    let country = null;

    if (displayName.includes("nigeria")) country = "Nigeria";
    else if (displayName.includes("united states") || displayName.includes("usa"))
      country = "United States";
    else if (displayName.includes("canada")) country = "Canada";
    else if (displayName.includes("netherlands")) country = "Netherlands";

    if (!country) {
      return res.status(400).json({ message: "❌ Address not supported for delivery" });
    }

    return res.json({
      message: "✅ Address validated successfully",
      country,
      raw: data[0],
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
