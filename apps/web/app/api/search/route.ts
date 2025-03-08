import { XMLParser } from "fast-xml-parser";
import { type NextRequest, NextResponse } from "next/server";

interface SearchMetadata {
	title: string;
	id: string;
	updated: string;
	totalResults: number;
	start: number;
	itemsPerPage: number;
}

interface FeedEntry {
	id: string;
	updated: string;
	published: string;
	title: string;
	summary: string;
	author: {
		name: string;
	}[];
}

// Custom fetch with timeout function
const fetchWithTimeout = async (url: string, options = {}, timeout = 30000) => {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout);

	try {
		const response = await fetch(url, {
			...options,
			signal: controller.signal,
		});
		clearTimeout(timeoutId);
		return response;
	} catch (error) {
		clearTimeout(timeoutId);
		throw error;
	}
};

export async function GET(request: NextRequest) {
	const url = "https://export.arxiv.org/api/query";

	// Basic parameters
	const query = request.nextUrl.searchParams.get("query") || "";
	const start = request.nextUrl.searchParams.get("start") || "0";
	const max_results = request.nextUrl.searchParams.get("max_results") || "10";

	// Filter parameters
	// const dateRange = request.nextUrl.searchParams.get("date_range");
	const sortBy = request.nextUrl.searchParams.get("sort_by");
	const categories = request.nextUrl.searchParams.get("categories");

	// Build the search query with filters
	let searchQuery = `${query}`;

	// Add category filters
	if (categories) {
		const categoryList = categories.split(",");
		if (categoryList.length > 0) {
			const categoryFilter = categoryList
				.map((cat) => `cat:${cat}`)
				.join("+OR+");
			searchQuery += `+AND+(${categoryFilter})`;
		}
	}

	// Build the query parameters
	const searchParams = new URLSearchParams();
	searchParams.set("search_query", searchQuery);
	searchParams.set("start", start);
	searchParams.set("max_results", max_results);

	// Add sort parameters if specified
	if (sortBy) {
		let sortOrder;
		let sortDirection;

		switch (sortBy) {
			case "date_new":
				sortOrder = "submittedDate";
				sortDirection = "descending";
				break;
			case "date_old":
				sortOrder = "submittedDate";
				sortDirection = "ascending";
				break;
			default:
				// ArXiv defaults to relevance sorting
				break;
		}

		if (sortOrder) {
			searchParams.set("sortBy", sortOrder);
			searchParams.set("sortOrder", sortDirection || "descending");
		}
	}

	console.log(`Searching arXiv with query: ${searchQuery}`);

	const fullUrl = `${url}?${searchParams.toString()}`;
	console.log(`Full URL: ${fullUrl}`);

	try {
		// Use the modified fetch with timeout instead of standard fetch
		console.log(`Attempting to fetch from arXiv with timeout: 30000ms`);
		const response = await fetchWithTimeout(fullUrl, {}, 30000);

		if (!response.ok) {
			return NextResponse.json(
				{ error: `API request failed with status ${response.status}` },
				{ status: response.status },
			);
		}

		const responseData = await response.text();
		const parser = new XMLParser();
		const jObj = parser.parse(responseData);

		// Handle case where no results are found
		if (!jObj.feed.entry) {
			return NextResponse.json({
				data: [],
				metadata: {
					title: jObj.feed.title,
					id: jObj.feed.id,
					updated: jObj.feed.updated,
					totalResults: 0,
					start: Number(start),
					itemsPerPage: Number(max_results),
				},
			});
		}

		// Convert entry to array if it's a single object
		const entries = Array.isArray(jObj.feed.entry)
			? jObj.feed.entry
			: [jObj.feed.entry];

		const data: FeedEntry[] = entries.map((entry) => {
			let normalizedAuthor = entry.author;

			if (!Array.isArray(normalizedAuthor)) {
				normalizedAuthor = [normalizedAuthor];
			}

			normalizedAuthor = normalizedAuthor.map((author) => {
				if (typeof author === "string") {
					return { name: author };
				}
				return author;
			});

			return {
				id: entry.id,
				updated: entry.updated,
				published: entry.published,
				title: entry.title,
				summary: entry.summary,
				author: normalizedAuthor,
			};
		});

		const metadata: SearchMetadata = {
			title: jObj.feed.title,
			id: jObj.feed.id,
			updated: jObj.feed.updated,
			totalResults: Number.parseInt(jObj.feed["opensearch:totalResults"]) || 0,
			start: Number.parseInt(jObj.feed["opensearch:startIndex"]) || 0,
			itemsPerPage: Number.parseInt(jObj.feed["opensearch:itemsPerPage"]) || 0,
		};

		// const indexResponse = await fetch("http://localhost:8000/papers/index", {
		// 	method: "POST",
		// 	headers: {
		// 		"Content-Type": "application/json",
		// 	},
		// 	body: JSON.stringify({ data }),
		// });

		// if (!indexResponse.ok) {
		// 	console.error(`Indexing failed with status ${indexResponse.status}`);
		// }

		// const ragResponse = await fetch("http://localhost:8000/papers/search", {
		// 	method: "POST",
		// 	headers: {
		// 		"Content-Type": "application/json",
		// 	},
		// 	body: JSON.stringify({ query: searchQuery }),
		// });

		// if (!ragResponse.ok) {
		// 	console.error(`RAG search failed with status ${ragResponse.status}`);
		// }
		// const ragData = await ragResponse.json();

		return NextResponse.json({
			data,
			metadata: {
				...metadata,
				totalResults: metadata.totalResults || 0,
			},
			// ragData,
		});
	} catch (error) {
		console.error("Error fetching from arXiv API:", error);

		// Check specifically for timeout errors
		if (
			error.name === "AbortError" ||
			error.code === "UND_ERR_CONNECT_TIMEOUT" ||
			error.message?.includes("timeout")
		) {
			return NextResponse.json(
				{
					data: [],
					metadata: {
						title: "Search Results (Error)",
						id: "",
						updated: new Date().toISOString(),
						totalResults: 0,
						start: 0,
						itemsPerPage: 10,
					},
					error:
						"ArXiv API request timed out. Please try again later or with a more specific query.",
				},
				{ status: 504 }, // Gateway Timeout
			);
		}

		// General error fallback
		return NextResponse.json(
			{
				data: [],
				metadata: {
					title: "",
					id: "",
					updated: "",
					totalResults: 0,
					start: 0,
					itemsPerPage: 10,
				},
				error: "Failed to fetch from arXiv API",
			},
			{ status: 500 },
		);
	}
}
