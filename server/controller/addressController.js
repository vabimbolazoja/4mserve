import fetch from "node-fetch";

export const validateAddress = async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ message: "Address is required" });
    }

    // Query Nominatim API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
        address
      )}`,
      {
        headers: {
          // ✅ Use a clear User-Agent (Nominatim requires this)
          "User-Agent": "SalarioPay/1.0 (support@salariopay.com)",
          "Accept-Language": "en",
        },
      }
    );

    // Handle non-200 responses
    if (!response.ok) {
      const text = await response.text(); // capture error body for debugging
      console.error("Nominatim error:", response.status, text);

      return res.status(response.status).json({
        message: "Error querying Nominatim API",
        status: response.status,
        error: text,
      });
    }

    const data = await response.json();

    // If no results returned
    if (!data || data.length === 0) {
      return res
        .status(404)
        .json({ message: "Address not found or invalid" });
    }

    // Extract country from Nominatim result
    const displayName = data[0].display_name.toLowerCase();
    let country = null;

    if (displayName.includes("nigeria")) country = "Nigeria";
    else if (displayName.includes("united states") || displayName.includes("usa"))
      country = "United States";
    else if (displayName.includes("canada")) country = "Canada";
    else if (displayName.includes("netherlands")) country = "Netherlands";
    else if (displayName.includes("spain")) country = "Spain";

    // Only allow supported countries
    if (!country) {
      return res
        .status(400)
        .json({ message: "❌ Address not supported for delivery" });
    }

    // ✅ Success response
    return res.json({
      message: "✅ Address validated successfully",
      country,
      full: data[0], // send back raw Nominatim data too for debugging
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
