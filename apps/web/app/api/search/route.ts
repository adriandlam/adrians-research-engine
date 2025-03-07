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

export async function GET(request: NextRequest) {
	const url = "https://export.arxiv.org/api/query";

	// Basic parameters
	const query = request.nextUrl.searchParams.get("query") || "";
	const start = request.nextUrl.searchParams.get("start") || "0";
	const max_results = request.nextUrl.searchParams.get("max_results") || "20";

	// Filter parameters
	// const dateRange = request.nextUrl.searchParams.get("date_range");
	const sortBy = request.nextUrl.searchParams.get("sort_by");
	const categories = request.nextUrl.searchParams.get("categories");

	// Build the search query with filters
	let searchQuery = `all:${query}`;

	// Add date range filter if specified
	// if (dateRange && dateRange !== "all_time") {
	// 	const now = new Date();
	// 	const startDate = new Date();

	// 	switch (dateRange) {
	// 		case "last_week":
	// 			startDate.setDate(now.getDate() - 7);
	// 			break;
	// 		case "last_month":
	// 			startDate.setMonth(now.getMonth() - 1);
	// 			break;
	// 		case "last_year":
	// 			startDate.setFullYear(now.getFullYear() - 1);
	// 			break;
	// 		case "last_5_years":
	// 			startDate.setFullYear(now.getFullYear() - 5);
	// 			break;
	// 	}

	// 	// Format date as YYYYMMDD0000 (midnight GMT)
	// 	const formatDateForArxiv = (date: Date) => {
	// 		return date.toISOString().slice(0, 10).replace(/-/g, "") + "0000";
	// 	};

	// 	const formattedStartDate = formatDateForArxiv(startDate);
	// 	const formattedEndDate = formatDateForArxiv(new Date()); // Current date

	// 	searchQuery += `+AND+submittedDate:[${formattedStartDate}+TO+${formattedEndDate}]`;
	// }

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
		let sortOrder, sortDirection;

		switch (sortBy) {
			case "date_new":
				sortOrder = "submittedDate";
				sortDirection = "descending";
				break;
			case "date_old":
				sortOrder = "submittedDate";
				sortDirection = "ascending";
				break;
			case "relevance":
			default:
				// ArXiv defaults to relevance sorting
				break;
		}

		if (sortOrder) {
			searchParams.set("sortBy", sortOrder);
			searchParams.set("sortOrder", sortDirection);
		}
	}

	console.log(`Searching arXiv with query: ${searchQuery}`);

	const fullUrl = `${url}?${searchParams.toString()}`;
	console.log(`Full URL: ${fullUrl}`);

	try {
		const response = await fetch(fullUrl);

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

		const data: FeedEntry[] = entries.map((entry) => ({
			id: entry.id,
			updated: entry.updated,
			published: entry.published,
			title: entry.title,
			summary: entry.summary,
			author: entry.author,
		}));

		const metadata: SearchMetadata = {
			title: jObj.feed.title,
			id: jObj.feed.id,
			updated: jObj.feed.updated,
			totalResults: Number.parseInt(jObj.feed["opensearch:totalResults"]),
			start: Number.parseInt(jObj.feed["opensearch:startIndex"]),
			itemsPerPage: Number.parseInt(jObj.feed["opensearch:itemsPerPage"]),
		};

		return NextResponse.json({
			data,
			metadata,
		});
	} catch (error) {
		console.error("Error fetching from arXiv API:", error);
		return NextResponse.json(
			{ error: "Failed to fetch from arXiv API" },
			{ status: 500 },
		);
	}
}
