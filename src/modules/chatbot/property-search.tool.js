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
      query: { type: "string", description: "Free-text keyword alias for search" },
      city: { type: "string" },
      propertyType: { type: "integer", description: "Property type id; available values: 1, 2, 3, 4, 5" },
      property_type: { type: "integer", description: "Alias for propertyType" },
      spaceType: { type: "integer", description: "Space type id; available values: 1, 2" },
      space_type: { type: "integer", description: "Alias for spaceType" },
      minPrice: { type: "number", description: "Lower bound of the user's budget, per night" },
      min_price: { type: "number", description: "Alias for minPrice" },
      maxPrice: { type: "number", description: "Upper bound of the user's budget, per night" },
      max_price: { type: "number", description: "Alias for maxPrice" },
      price_per_night_max: { type: "number", description: "Alias for maxPrice" },
      minGuests: { type: "integer" },
      min_guests: { type: "integer", description: "Alias for minGuests" },
      number_of_guests: { type: "integer", description: "Alias for minGuests" },
      checkInDate: { type: "string", description: "YYYY-MM-DD" },
      check_in_date: { type: "string", description: "Alias for checkInDate" },
      checkOutDate: { type: "string", description: "YYYY-MM-DD" },
      check_out_date: { type: "string", description: "Alias for checkOutDate" },
      sort: { type: "integer", description: "Sort order id; available values: 1, 2, 3" },
      page: { type: "integer", description: "Page number for paged results" },
      pageSize: { type: "integer", description: "Number of results per page; top 5 are recommended" },
    },
    required: [],
  },
};

export function toGeminiToolDeclarations(tools = []) {
  return tools.map((tool) => ({
    functionDeclarations: [
      {
        name: tool.name,
        description: tool.description,
        parametersJsonSchema: tool.parameters,
      },
    ],
  }));
}

function normalizeArgs(args = {}) {
  return {
    search: args.search ?? args.query ?? "",
    city: args.city ?? "",
    propertyType: args.propertyType ?? args.property_type,
    spaceType: args.spaceType ?? args.space_type,
    minPrice: args.minPrice ?? args.min_price,
    maxPrice: args.maxPrice ?? args.max_price ?? args.price_per_night_max,
    minGuests: args.minGuests ?? args.min_guests ?? args.number_of_guests,
    checkInDate: args.checkInDate ?? args.check_in_date,
    checkOutDate: args.checkOutDate ?? args.check_out_date,
    sort: args.sort,
    page: args.page ?? 1,
    pageSize: args.pageSize ?? 5,
  };
}

export async function executeSearch(args, authToken) {
  const baseUrl = process.env.SMARTSTAY_API_URL;

  if (!baseUrl) {
    return {
      success: false,
      error: "SMARTSTAY_API_URL is not configured. Set it in your environment before testing the chatbot.",
    };
  }

  const normalizedArgs = normalizeArgs(args);

  console.log("Executing tool search_properties", { args, normalizedArgs, authToken: !!authToken });

  try {
    const response = await axios.get(`${baseUrl}/api/properties`, {
      params: {
        Search: normalizedArgs.search,
        City: normalizedArgs.city,
        PropertyType: normalizedArgs.propertyType,
        SpaceType: normalizedArgs.spaceType,
        MinPrice: normalizedArgs.minPrice,
        MaxPrice: normalizedArgs.maxPrice,
        MinGuests: normalizedArgs.minGuests,
        CheckInDate: normalizedArgs.checkInDate,
        CheckOutDate: normalizedArgs.checkOutDate,
        Sort: normalizedArgs.sort,
        Page: normalizedArgs.page,
        PageSize: normalizedArgs.pageSize,
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
