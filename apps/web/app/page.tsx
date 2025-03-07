"use client";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { ArrowRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

const exampleSearches = [
	{ emoji: "🏃", query: "Does exercise improve cognition?" },
	{ emoji: "💵", query: "Can cash transfers reduce poverty?" },
	{ emoji: "💊", query: "Are statins effective in the elderly?" },
	{ emoji: "🛏", query: "Can mindfulness help with sleep?" },
	{ emoji: "🍬", query: "Does aspartame cause cancer?" },
	{ emoji: "🦠", query: "Is gut microbiome linked to depression?" },
];

const searchSchema = z.string().min(1);

export default function Page() {
	const [query, setQuery] = useState("");
	const router = useRouter();

	const handleSubmit = (e: React.FormEvent) => {
		console.log("hit");
		e.preventDefault();
		const result = searchSchema.safeParse(query);
		if (!result.success) {
			return;
		}

		router.push(`/search?query=${query}`);
	};

	return (
		<main className="flex flex-col items-center px-4 py-12 md:py-20 max-w-7xl mx-auto">
			{/* Hero Section */}
			<div className="flex flex-col items-center text-center max-w-3xl mb-16">
				<h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight">
					Your Private AI-Powered Research Engine
				</h1>
				<p className="mt-4 text-lg max-w-2xl">
					Find & understand relevant papers, faster. Powered by AI to help you
					conduct research efficiently.
				</p>

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

				{/* Example Searches */}
				{/* <div className="mt-6">
					<div className="flex flex-wrap justify-center gap-2">
						{exampleSearches.map((search, index) => (
							<Button
								key={search.query}
								variant="secondary"
								className="text-muted-foreground text-sm rounded-full"
							>
								{search.emoji} {search.query}
							</Button>
						))}
					</div>
				</div> */}
			</div>

			{/* Trusted By Section */}
			<div className="w-full mb-16 text-center">
				<p className="text-foreground mb-6">
					Used by researchers at the world's top institutes
				</p>
				<div className="flex justify-center gap-8 opacity-70">
					{/* Placeholder for logos */}
					<div className="h-6 w-24 bg-muted rounded" />
					<div className="h-6 w-24 bg-muted rounded" />
					<div className="h-6 w-24 bg-muted rounded" />
					<div className="h-6 w-24 bg-muted rounded" />
				</div>
			</div>
		</main>
	);
}
