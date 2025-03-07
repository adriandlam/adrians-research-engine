module.exports = {

"[project]/apps/web/.next-internal/server/app/api/search/route/actions.js [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, d: __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
}}),
"[externals]/next/dist/compiled/next-server/app-route.runtime.dev.js [external] (next/dist/compiled/next-server/app-route.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, d: __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)": (function(__turbopack_context__) {

var { g: global, d: __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/next-server/app-page.runtime.dev.js [external] (next/dist/compiled/next-server/app-page.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, d: __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, d: __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, d: __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, d: __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}}),
"[project]/apps/web/app/api/search/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, d: __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "GET": (()=>GET)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$fast$2d$xml$2d$parser$40$5$2e$0$2e$8$2f$node_modules$2f$fast$2d$xml$2d$parser$2f$src$2f$fxp$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/fast-xml-parser@5.0.8/node_modules/fast-xml-parser/src/fxp.js [app-route] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$fast$2d$xml$2d$parser$40$5$2e$0$2e$8$2f$node_modules$2f$fast$2d$xml$2d$parser$2f$src$2f$xmlparser$2f$XMLParser$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__XMLParser$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/fast-xml-parser@5.0.8/node_modules/fast-xml-parser/src/xmlparser/XMLParser.js [app-route] (ecmascript) <export default as XMLParser>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.2.0_react-dom@19.0.0_react@19.0.0__react@19.0.0/node_modules/next/server.js [app-route] (ecmascript)");
;
;
async function GET(request) {
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
            const categoryFilter = categoryList.map((cat)=>`cat:${cat}`).join("+OR+");
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
        switch(sortBy){
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
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: `API request failed with status ${response.status}`
            }, {
                status: response.status
            });
        }
        const responseData = await response.text();
        const parser = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$fast$2d$xml$2d$parser$40$5$2e$0$2e$8$2f$node_modules$2f$fast$2d$xml$2d$parser$2f$src$2f$xmlparser$2f$XMLParser$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__XMLParser$3e$__["XMLParser"]();
        const jObj = parser.parse(responseData);
        // Handle case where no results are found
        if (!jObj.feed.entry) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                data: [],
                metadata: {
                    title: jObj.feed.title,
                    id: jObj.feed.id,
                    updated: jObj.feed.updated,
                    totalResults: 0,
                    start: Number(start),
                    itemsPerPage: Number(max_results)
                }
            });
        }
        // Convert entry to array if it's a single object
        const entries = Array.isArray(jObj.feed.entry) ? jObj.feed.entry : [
            jObj.feed.entry
        ];
        const data = entries.map((entry)=>({
                id: entry.id,
                updated: entry.updated,
                published: entry.published,
                title: entry.title,
                summary: entry.summary,
                author: entry.author
            }));
        const metadata = {
            title: jObj.feed.title,
            id: jObj.feed.id,
            updated: jObj.feed.updated,
            totalResults: Number.parseInt(jObj.feed["opensearch:totalResults"]),
            start: Number.parseInt(jObj.feed["opensearch:startIndex"]),
            itemsPerPage: Number.parseInt(jObj.feed["opensearch:itemsPerPage"])
        };
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            data,
            metadata
        });
    } catch (error) {
        console.error("Error fetching from arXiv API:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Failed to fetch from arXiv API"
        }, {
            status: 500
        });
    }
}
}}),

};

//# sourceMappingURL=%5Broot%20of%20the%20server%5D__61f64a23._.js.map