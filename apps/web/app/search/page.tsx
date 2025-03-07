"use client";

import fetcher from "@/utils/fetcher";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@workspace/ui/components/pagination";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import { Separator } from "@workspace/ui/components/separator";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
	ArrowRight,
	Bookmark,
	ChevronDown,
	FilterX,
	Search,
	Share,
	SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { z } from "zod";

const searchSchema = z.string().min(1);

// ArXiv categories with descriptions
const categories = [
	{ id: "cs", name: "Computer Science" },
	{ id: "math", name: "Mathematics" },
	{ id: "physics", name: "Physics" },
	{ id: "q-bio", name: "Quantitative Biology" },
	{ id: "q-fin", name: "Quantitative Finance" },
	{ id: "stat", name: "Statistics" },
	{ id: "econ", name: "Economics" },
	{ id: "eess", name: "Electrical Engineering and Systems Science" },
];

export default function SearchPage() {
	const [query, setQuery] = useState("");
	const [showFilters, setShowFilters] = useState(true);
	const [filters, setFilters] = useState({
		dateRange: "all_time",
		sortBy: "relevance",
		categories: [],
	});
	const router = useRouter();
	const searchParams = useSearchParams();

	useEffect(() => {
		const queryParam = searchParams.get("query");
		if (queryParam) {
			setQuery(queryParam);
		}

		// Load filters from URL if present
		const dateRange = searchParams.get("date_range");
		const sortBy = searchParams.get("sort_by");
		const categoriesParam = searchParams.get("categories");

		if (dateRange || sortBy || categoriesParam) {
			setFilters({
				dateRange: dateRange || "all_time",
				sortBy: sortBy || "relevance",
				categories: categoriesParam ? categoriesParam.split(",") : [],
			});
		}
	}, [searchParams]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const result = searchSchema.safeParse(query);
		if (!result.success) {
			return;
		}
		applySearch();
	};

	const applySearch = (page = 1) => {
		if (!query.trim()) return;

		const params = new URLSearchParams();

		// Add main query
		params.set("query", query);

		// Add pagination
		if (page > 1) {
			const newStart = (page - 1) * maxResults;
			params.set("start", newStart.toString());
		}
		params.set("max_results", maxResults.toString());

		// Add filters
		if (filters.dateRange !== "all_time") {
			params.set("date_range", filters.dateRange);
		}

		if (filters.sortBy !== "relevance") {
			params.set("sort_by", filters.sortBy);
		}

		if (filters.categories.length > 0) {
			params.set("categories", filters.categories.join(","));
		}

		router.push(`/search?${params.toString()}`);
	};

	const clearFilters = () => {
		setFilters({
			dateRange: "all_time",
			sortBy: "relevance",
			categories: [],
		});

		// Apply the cleared filters immediately if we're already searching
		if (currentQuery) {
			const params = new URLSearchParams();
			params.set("query", currentQuery);
			params.set("max_results", maxResults.toString());
			router.push(`/search?${params.toString()}`);
		}
	};

	// Get query parameters
	const currentQuery = searchParams.get("query") || "";
	const currentStart = Number.parseInt(searchParams.get("start") || "0", 10);
	const maxResults = Number.parseInt(
		searchParams.get("max_results") || "10",
		10,
	);

	// Fetch search results with pagination
	const { data, error, isLoading } = useSWR(
		currentQuery ? `/api/search?${searchParams.toString()}` : null,
		fetcher,
	);

	// Format date to be more readable
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	// Extract arXiv ID from the full URL
	const getArxivId = (url: string) => {
		const matches = url.match(/\/abs\/([^\/]+)$/);
		return matches ? matches[1] : url;
	};

	// Normalize author data to always work with arrays
	const normalizeAuthors = (authorData: any) => {
		if (!authorData) return [];
		return Array.isArray(authorData) ? authorData : [authorData];
	};

	// Calculate pagination
	const totalResults = data?.metadata?.totalResults
		? Number(data.metadata.totalResults)
		: 0;
	const totalPages = Math.ceil(totalResults / maxResults);
	const currentPage = Math.floor(currentStart / maxResults) + 1;

	// Create pagination range with ellipsis
	const getPaginationRange = () => {
		if (totalPages <= 7) {
			// Show all pages if 7 or fewer
			return Array.from({ length: totalPages }, (_, i) => i + 1);
		}

		// Always show first, last, and pages around current
		if (currentPage <= 3) {
			// Near start: show 1,2,3,4,5,...,totalPages
			return [1, 2, 3, 4, 5, "ellipsis", totalPages];
		} else if (currentPage >= totalPages - 2) {
			// Near end: show 1,...,totalPages-4,totalPages-3,totalPages-2,totalPages-1,totalPages
			return [
				1,
				"ellipsis",
				totalPages - 4,
				totalPages - 3,
				totalPages - 2,
				totalPages - 1,
				totalPages,
			];
		} else {
			// Middle: show 1,...,currentPage-1,currentPage,currentPage+1,...,totalPages
			return [
				1,
				"ellipsis",
				currentPage - 1,
				currentPage,
				currentPage + 1,
				"ellipsis",
				totalPages,
			];
		}
	};

	// Navigate to a specific page
	const goToPage = (page: number) => {
		const newStart = (page - 1) * maxResults;
		const params = new URLSearchParams(searchParams);
		params.set("start", newStart.toString());
		router.push(`/search?${params.toString()}`);
	};

	// Toggle a category in filter
	const toggleCategory = (categoryId: string) => {
		setFilters((prev) => {
			const newCategories = prev.categories.includes(categoryId)
				? prev.categories.filter((c) => c !== categoryId)
				: [...prev.categories, categoryId];

			return {
				...prev,
				categories: newCategories,
			};
		});
	};

	// Check if any filters are applied
	const hasActiveFilters =
		filters.dateRange !== "all_time" ||
		filters.sortBy !== "relevance" ||
		filters.categories.length > 0;

	// Skeleton components for loading state
	const SkeletonResultCard = () => (
		<Card className="overflow-hidden">
			<CardHeader className="pb-2">
				<Skeleton className="h-6 w-4/5" />
			</CardHeader>
			<CardContent className="pb-2 text-sm space-y-4">
				<div className="flex gap-2">
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-4 w-40" />
				</div>
				<div className="flex flex-wrap gap-1">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-6 w-24 rounded-full" />
					))}
				</div>
				<div>
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-11/12 mt-1" />
				</div>
			</CardContent>
			<CardFooter className="pt-2 flex justify-between">
				<Skeleton className="h-4 w-24" />
				<div className="flex gap-2">
					<Skeleton className="h-8 w-8 rounded-full" />
					<Skeleton className="h-8 w-8 rounded-full" />
				</div>
			</CardFooter>
		</Card>
	);

	const SkeletonPagination = () => (
		<div className="my-8">
			<div className="flex justify-center gap-1">
				<Skeleton className="h-8 w-20" />
				{[1, 2, 3, 4, 5].map((i) => (
					<Skeleton key={i} className="h-8 w-8 rounded-md" />
				))}
				<Skeleton className="h-8 w-20" />
			</div>
			<div className="text-center mt-6">
				<Skeleton className="h-4 w-48 mx-auto" />
			</div>
		</div>
	);

	return (
		<main className="flex flex-col items-center px-4 max-w-6xl mx-auto">
			<div className="flex flex-col items-center text-center max-w-3xl mb-8 w-full">
				{/* Search Bar */}
				<form
					onSubmit={handleSubmit}
					className="flex items-center border rounded-full p-1 w-full max-w-2xl mt-8 shadow-sm pl-4"
				>
					<Search className="h-4 w-4 text-muted-foreground" />
					<Input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search articles, papers..."
						className="border-none shadow-none focus-visible:ring-0"
					/>
					<Button size="icon" className="rounded-full" type="submit">
						<ArrowRight className="h-4 w-4" />
					</Button>
				</form>
			</div>

			{/* Search Results */}
			<div className="w-full max-w-4xl">
				{currentQuery && (
					<div className="mb-4 flex justify-between items-center">
						<h2 className="text-xl font-medium">
							{isLoading ? (
								<Skeleton className="h-7 w-64" />
							) : error ? (
								"Error fetching results"
							) : (
								data &&
								`${data.metadata.totalResults} results for "${currentQuery}"`
							)}
						</h2>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowFilters(!showFilters)}
							className="md:hidden flex items-center gap-1"
						>
							<SlidersHorizontal className="h-4 w-4" />
							{showFilters ? "Hide Filters" : "Show Filters"}
						</Button>
					</div>
				)}

				{/* Error State */}
				{error && (
					<div className="rounded-md bg-red-50 p-4 my-4">
						<div className="flex">
							<div className="flex-shrink-0">
								<svg
									className="h-5 w-5 text-red-400"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fillRule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
										clipRule="evenodd"
									/>
								</svg>
							</div>
							<div className="ml-3">
								<h3 className="text-sm font-medium text-red-800">
									Error fetching search results
								</h3>
								<div className="mt-2 text-sm text-red-700">
									<p>Please try again later or modify your search query.</p>
									<p className="mt-1">
										If problems persist, the arXiv API may be temporarily
										unavailable.
									</p>
								</div>
							</div>
						</div>
					</div>
				)}

				{currentQuery && (
					<div className="flex flex-col md:flex-row gap-4">
						{/* Filters Section */}
						<div
							className={`${
								showFilters ? "block" : "hidden"
							} md:block w-full md:w-64 flex-shrink-0`}
						>
							<div className="bg-card border rounded-lg p-4 sticky top-4">
								<div className="flex justify-between items-center mb-4">
									<h3 className="font-medium text-lg">Filters</h3>
									{hasActiveFilters && (
										<Button
											variant="ghost"
											size="sm"
											onClick={clearFilters}
											className="h-8 text-xs"
										>
											<FilterX className="h-3 w-3 mr-1" />
											Clear
										</Button>
									)}
								</div>

								<Separator className="my-3" />

								{/* Date Range Filter */}
								{/* <div className="mb-4">
									<Label className="text-sm font-medium mb-2 block">
										Date Range
									</Label>
									<Select
										value={filters.dateRange}
										onValueChange={(value) =>
											setFilters({ ...filters, dateRange: value })
										}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select date range" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all_time">All Time</SelectItem>
											<SelectItem value="last_week">Last Week</SelectItem>
											<SelectItem value="last_month">Last Month</SelectItem>
											<SelectItem value="last_year">Last Year</SelectItem>
											<SelectItem value="last_5_years">Last 5 Years</SelectItem>
										</SelectContent>
									</Select>
								</div> */}

								{/* Sort By Filter */}
								<div className="mb-4">
									<Label className="text-sm font-medium mb-2 block">
										Sort By
									</Label>
									<Select
										value={filters.sortBy}
										onValueChange={(value) =>
											setFilters({ ...filters, sortBy: value })
										}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Sort by" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="relevance">Relevance</SelectItem>
											<SelectItem value="date_new">Newest First</SelectItem>
											<SelectItem value="date_old">Oldest First</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{/* Categories Filter */}
								{/* <div className="mb-4">
									<Collapsible defaultOpen>
										<CollapsibleTrigger className="flex w-full justify-between items-center text-sm font-medium mb-2">
											<span>Categories</span>
											<ChevronDown className="h-4 w-4" />
										</CollapsibleTrigger>
										<CollapsibleContent className="space-y-2 mt-1">
											{categories.map((category) => (
												<div
													key={category.id}
													className="flex items-center space-x-2"
												>
													<Checkbox
														id={`category-${category.id}`}
														checked={filters.categories.includes(category.id)}
														onCheckedChange={() => toggleCategory(category.id)}
													/>
													<Label
														htmlFor={`category-${category.id}`}
														className="text-sm font-normal cursor-pointer"
													>
														{category.name}
													</Label>
												</div>
											))}
										</CollapsibleContent>
									</Collapsible>
								</div> */}

								<Button onClick={() => applySearch()} className="w-full">
									Apply Filters
								</Button>
							</div>
						</div>

						{/* Results List */}
						<div className="flex-1">
							{isLoading ? (
								// Skeleton loading state for results
								<div className="flex flex-col gap-4 mb-8">
									{[...Array(5)].map((_, i) => (
										<SkeletonResultCard key={i} />
									))}
								</div>
							) : data?.data && data.data.length > 0 ? (
								<div className="flex flex-col gap-4 mb-8">
									{data.data.map((paper) => (
										<Card key={paper.id} className="overflow-hidden">
											<CardHeader className="pb-2">
												<CardTitle className="text-lg font-medium leading-tight">
													<a
														href={paper.id}
														target="_blank"
														rel="noopener noreferrer"
														className="hover:underline flex items-start"
													>
														<span className="mr-2">
															{paper.title.replace(/\\n\s+/g, " ")}
														</span>
													</a>
												</CardTitle>
											</CardHeader>
											<CardContent className="pb-2 text-sm">
												<div className="flex flex-wrap gap-x-2 gap-y-1 items-center mb-3 text-muted-foreground">
													<span>{formatDate(paper.published)}</span>
													<span className="hidden sm:inline">•</span>
													<span>arXiv: {getArxivId(paper.id)}</span>
												</div>
												<div className="mb-3">
													<div className="flex flex-wrap gap-1 mb-2">
														{normalizeAuthors(paper.author).map(
															(author, idx) => (
																<Badge
																	key={idx}
																	variant="outline"
																	className="bg-background"
																>
																	{author.name}
																</Badge>
															),
														)}
													</div>
												</div>
												<p className="text-muted-foreground line-clamp-2">
													{paper.summary.replace(/\\n/g, " ")}
												</p>
											</CardContent>
											<CardFooter className="pt-2 flex justify-between">
												<Link
													href={paper.id}
													target="_blank"
													rel="noopener noreferrer"
													className="text-primary text-sm hover:underline"
												>
													View on arXiv
												</Link>
												<div className="space-x-1">
													<Button size="icon" variant="ghost">
														<Bookmark className="size-4" />
													</Button>
													<Button size="icon" variant="ghost">
														<Share className="size-4" />
													</Button>
												</div>
											</CardFooter>
										</Card>
									))}
								</div>
							) : (
								// No results state
								data?.data?.length === 0 && (
									<div className="text-center py-12 border rounded-lg">
										<h3 className="text-lg font-medium">No results found</h3>
										<p className="text-muted-foreground mt-2">
											Try adjusting your search query or filters to find more
											results.
										</p>
									</div>
								)
							)}
						</div>
					</div>
				)}

				{/* Pagination - Skeleton or actual */}
				{isLoading && currentQuery ? (
					<SkeletonPagination />
				) : (
					data?.data?.length > 0 &&
					totalPages > 0 && (
						<div className="my-8">
							<Pagination>
								<PaginationContent>
									<PaginationItem>
										<PaginationPrevious
											onClick={() =>
												currentPage > 1 && goToPage(currentPage - 1)
											}
											className={
												currentPage <= 1
													? "pointer-events-none opacity-50"
													: "cursor-pointer"
											}
										/>
									</PaginationItem>

									{/* Dynamic page links */}
									{getPaginationRange().map((page, index) =>
										page === "ellipsis" ? (
											<PaginationItem key={`ellipsis-${index}`}>
												<PaginationEllipsis />
											</PaginationItem>
										) : (
											<PaginationItem key={`page-${page}`}>
												<PaginationLink
													isActive={currentPage === page}
													onClick={() => goToPage(page as number)}
													className="cursor-pointer"
												>
													{page}
												</PaginationLink>
											</PaginationItem>
										),
									)}

									<PaginationItem>
										<PaginationNext
											onClick={() =>
												currentPage < totalPages && goToPage(currentPage + 1)
											}
											className={
												currentPage >= totalPages
													? "pointer-events-none opacity-50"
													: "cursor-pointer"
											}
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>

							<div className="text-center text-sm text-muted-foreground mt-6">
								Showing {currentStart + 1} -{" "}
								{Math.min(currentStart + data.data.length, totalResults)} of{" "}
								{totalResults} results
							</div>
						</div>
					)
				)}
			</div>
		</main>
	);
}
