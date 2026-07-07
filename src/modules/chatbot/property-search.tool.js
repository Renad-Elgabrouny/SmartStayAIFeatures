import axios from "axios";

export const searchPropertiesTool = {
  type: "function",
  name: "search_properties",
  description:
    "Search available properties by city, price range, number of guests, and dates. " +
    "Call this whenever the user describes what they're looking for (budget, location, " +
    "dates, group size, vibe) so you can recommend from REAL listings instead of guessing.",
  parameters: {
    type: "object",
    properties: {
      search: { type: "string", description: "Free-text keyword, e.g. a feature or title hint" },
      city: { type: "string" },
      minPrice: { type: "number", description: "Lower bound of the user's budget, per night" },
      maxPrice: { type: "number", description: "Upper bound of the user's budget, per night" },
      minGuests: { type: "integer" },
      checkInDate: { type: "string", description: "YYYY-MM-DD" },
      checkOutDate: { type: "string", description: "YYYY-MM-DD" },
    },
    required: [],
  },
};

export async function executeSearch(args, authToken) {
  const baseUrl = process.env.SMARTSTAY_API_URL;

  if (!baseUrl) {
    return {
      success: false,
      error: "SMARTSTAY_API_URL is not configured. Set it in your environment before testing the chatbot.",
    };
  }

  console.log("Executing tool search_properties", { args, authToken: !!authToken });

  try {
    const response = await axios.get(`${baseUrl}/api/properties`, {
      params: {
        Search: args.search,
        City: args.city,
        MinPrice: args.minPrice,
        MaxPrice: args.maxPrice,
        MinGuests: args.minGuests,
        CheckInDate: args.checkInDate,
        CheckOutDate: args.checkOutDate,
        Page: 1,
        PageSize: 6,
      },
      headers: authToken ? { Authorization: authToken } : {},
      timeout: 8000,
    });

    const items = (response.data.items || []).map((p) => ({
      id: p.id,
      title: p.title,
      propertyType: p.propertyType,
      spaceType: p.spaceType,
      city: p.city,
      pricePerNight: p.pricePerNight,
      currency: p.currency,
      maxGuests: p.maxGuests,
      averageRating: p.averageRating,
      reviewsCount: p.reviewsCount,
    }));

    return { success: true, totalCount: response.data.totalCount, items };
  } catch (err) {
    console.error("search_properties tool failed", {
      args,
      error: err.message,
      status: err.response?.status,
      detail: err.response?.data?.detail,
    });
    return {
      success: false,
      error: err.response?.data?.detail || "Couldn't search properties right now, try again shortly.",
    };
  }
}
