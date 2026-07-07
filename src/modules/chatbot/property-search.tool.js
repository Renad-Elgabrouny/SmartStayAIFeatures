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
      propertyType: { type: "integer", description: "Property type id; available values: 1, 2, 3, 4, 5" },
      spaceType: { type: "integer", description: "Space type id; available values: 1, 2" },
      minPrice: { type: "number", description: "Lower bound of the user's budget, per night" },
      maxPrice: { type: "number", description: "Upper bound of the user's budget, per night" },
      minGuests: { type: "integer" },
      checkInDate: { type: "string", description: "YYYY-MM-DD" },
      checkOutDate: { type: "string", description: "YYYY-MM-DD" },
      sort: { type: "integer", description: "Sort order id; available values: 1, 2, 3" },
      page: { type: "integer", description: "Page number for paged results" },
      pageSize: { type: "integer", description: "Number of results per page; top 5 are recommended" },
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
        PropertyType: args.propertyType,
        SpaceType: args.spaceType,
        MinPrice: args.minPrice,
        MaxPrice: args.maxPrice,
        MinGuests: args.minGuests,
        CheckInDate: args.checkInDate,
        CheckOutDate: args.checkOutDate,
        Sort: args.sort,
        Page: args.page ?? 1,
        PageSize: args.pageSize ?? 5,
      },
      headers: authToken ? { Authorization: authToken } : {},
      timeout: 8000,
    });

    const items = (response.data.items || []).slice(0, 5).map((p) => ({
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

    return {
      success: true,
      totalCount: response.data.totalCount,
      items,
      page: response.data.page,
      pageSize: response.data.pageSize,
      totalPages: response.data.totalPages,
    };
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
