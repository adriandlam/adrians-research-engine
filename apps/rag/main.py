import json
from typing import List, Dict, Any, Optional, Union
import os
import time

import pymupdf4llm

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from qdrant_client import QdrantClient
from qdrant_client.http.exceptions import UnexpectedResponse
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from fastembed import TextEmbedding
import requests
from pydantic import BaseModel
import uuid
import fitz

from fastembed.rerank.cross_encoder import TextCrossEncoder

client = QdrantClient(url="http://localhost:6333")
embedding_model = TextEmbedding("sentence-transformers/all-MiniLM-L6-v2")
print("The model sentence-transformers/all-MiniLM-L6-v2 is ready to use.")

reranker = TextCrossEncoder("jinaai/jina-reranker-v1-tiny-en")
print("The model jinaai/jina-reranker-v1-tiny-en is ready to use.")

EMBEDDING_SIZE = 384

app = FastAPI(
    title="ArXiv Paper Search API",
    description="API for semantic search of ArXiv papers using Qdrant and FastEmbed",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def chunk_text(text, chunk_size=1000, overlap=200):
    """Split text into overlapping chunks."""
    chunks = []
    for i in range(0, len(text), chunk_size - overlap):
        chunk = text[i:i + chunk_size]
        if len(chunk) < 200:
            continue
        chunks.append(chunk)
    return chunks


# API Endpoints
@app.get("/")
def root():
    return {
        "message": "ArXiv Paper Search API", 
        "status": "running", 
        "endpoints": [
            "/papers/index"
        ]
    }

class PaperData(BaseModel):
    id: str
    updated: str
    published: str
    title: str
    summary: str
    author: Union[Dict[str, str], List[Dict[str, Any]]]

class IndexRequest(BaseModel):
    data: List[PaperData]

class SearchRequest(BaseModel):
    query: str
    limit: int = 10

@app.post("/papers/index")
def index_papers_endpoint(request: IndexRequest):
    try:
        client.get_collection("arxiv_papers")
    except Exception:
        client.create_collection(
            collection_name="arxiv_papers",
            vectors_config=VectorParams(size=EMBEDDING_SIZE, distance=Distance.COSINE),
        )

    total_chunks = 0
    skipped_papers = 0
    processed_papers = 0

    start = time.time()
    for paper in request.data[:10]:
        # Check if this paper already exists in the database
        filter_condition = Filter(
            must=[
                FieldCondition(
                    key="metadata.url",
                    match=MatchValue(value=paper.id)
                )
            ]
        )

        # Use scroll with correct parameters
        existing_entries, _ = client.scroll(
            collection_name="arxiv_papers",
            scroll_filter=filter_condition,
            limit=1
        )

        if existing_entries:
            print(f"Paper {paper.id} already exists in the database. Skipping.")
            skipped_papers += 1
            continue
            
        # Process the paper
        pdf_url = paper.id.replace("abs", "pdf")
        try:
            # Fetch PDF
            response = requests.get(pdf_url)
            if response.status_code != 200:
                print(f"Failed to fetch {pdf_url}: {response.status_code}")
                continue
                
            # Parse PDF to markdown
            pdf_doc = fitz.open(stream=response.content, filetype="pdf")
            markdown_text = pymupdf4llm.to_markdown(pdf_doc)
            pdf_doc.close()

            chunks = chunk_text(markdown_text)
            
            # Create metadata
            metadata = {
                "title": paper.title,
                "summary": paper.summary,
                "published": paper.published,
                "updated": paper.updated,
                "url": paper.id
            }
            
            batch_size = 20
            for i in range(0, len(chunks), batch_size):
                batch_chunks = chunks[i:i+batch_size]
                
                # Generate embeddings for the batch
                batch_embeddings = list(embedding_model.embed(batch_chunks))
                
                points = []
                for j, embedding in enumerate(batch_embeddings):
                    chunk_id = f"{str(uuid.uuid4())}"
                    points.append(
                        PointStruct(
                            id=chunk_id,
                            vector=embedding.tolist(),
                            payload={
                                "metadata": metadata,
                                "chunk_index": i + j,
                                "total_chunks": len(chunks),
                                "document": batch_chunks[j]
                            }
                        )
                    )
                
                client.upsert(collection_name="arxiv_papers", points=points)
                total_chunks += len(batch_chunks)
                
            processed_papers += 1
            
        except Exception as e:
            print(f"Error processing paper {paper.id}: {str(e)}")
    
    end = time.time()
    
    return {
        "success": True, 
        "indexed_chunks": total_chunks,
        "processed_papers": processed_papers,
        "skipped_papers": skipped_papers,
        "time_ms": (end - start) * 1000
    }


@app.post("/papers/search")
def search_papers_endpoint(request: SearchRequest):
    start = time.time()
    try:
        # Convert query to embedding
        query_embedding = list(embedding_model.embed([request.query]))[0]
        
        # Search in Qdrant with increased limit for post-processing
        search_results = client.search(
            collection_name="arxiv_papers",
            query_vector=query_embedding.tolist(),
            limit=request.limit * 3  # Get more results for filtering
        )
        
        # Extract full payload information
        processed_results = []
        for result in search_results:
            processed_results.append({
                "document": result.payload.get("document", ""),
                "metadata": result.payload.get("metadata", {}),
                "chunk_index": result.payload.get("chunk_index", -1),
                "total_chunks": result.payload.get("total_chunks", 1),
                "score": result.score,
                "id": result.id
            })
        
        # Group by paper URL for chunk merging
        paper_chunks = {}
        for result in processed_results:
            url = result["metadata"].get("url", "unknown")
            if url not in paper_chunks:
                paper_chunks[url] = []
            paper_chunks[url].append(result)
        
        # Sort and merge adjacent chunks from the same paper
        merged_results = []
        for url, chunks in paper_chunks.items():
            # Sort by chunk index
            chunks.sort(key=lambda x: x["chunk_index"])
            
            # Merge adjacent chunks
            if not chunks:
                continue
                
            current = chunks[0]
            for i in range(1, len(chunks)):
                if chunks[i]["chunk_index"] == current["chunk_index"] + 1:
                    # Adjacent chunks - merge them
                    current["document"] += "\n\n" + chunks[i]["document"]
                    # Keep the better score
                    current["score"] = max(current["score"], chunks[i]["score"])
                else:
                    # Not adjacent - save current and start new
                    merged_results.append(current)
                    current = chunks[i]
            
            # Add the last chunk
            merged_results.append(current)
        
        # Deduplicate based on content
        deduplicated = []
        content_fingerprints = set()
        
        for result in merged_results:
            # Create a fingerprint from first 100 chars
            fingerprint = result["document"][:100].strip()
            if fingerprint not in content_fingerprints:
                content_fingerprints.add(fingerprint)
                deduplicated.append(result)
        
        # Extract documents for reranking
        docs = [result["document"] for result in deduplicated]
        
        retrieval_end = time.time()
        
        if docs:
            # Rerank the deduplicated and merged chunks
            reranker_scores = list(reranker.rerank(request.query, docs))
            
            # Normalize scores to 0-1 range
            min_score = min(reranker_scores) if reranker_scores else 0
            max_score = max(reranker_scores) if reranker_scores else 1
            score_range = max_score - min_score
            
            if score_range > 0:
                normalized_scores = [(score - min_score) / score_range for score in reranker_scores]
            else:
                normalized_scores = [1.0 for _ in reranker_scores]
            
            # Update results with normalized scores
            for i in range(len(deduplicated)):
                deduplicated[i]["reranker_score"] = reranker_scores[i]
                deduplicated[i]["normalized_score"] = normalized_scores[i]
            
            # Sort by normalized score
            deduplicated.sort(key=lambda x: x["normalized_score"], reverse=True)
            
            # Limit to requested number
            deduplicated = deduplicated[:request.limit]
        
        # Format results for LLM consumption
        final_results = []
        for item in deduplicated:
            # Create an LLM-friendly result format
            final_results.append({
                "content": item["document"],
                "confidence": round(item.get("normalized_score", 0.0), 4),
                "metadata": {
                    "title": item["metadata"].get("title", "Unknown Title"),
                    "summary": item["metadata"].get("summary", ""),
                    "published_date": item["metadata"].get("published", ""),
                    "updated_date": item["metadata"].get("updated", ""),
                    "source_url": item["metadata"].get("url", ""),
                    "chunk_index": item["chunk_index"],
                    "total_chunks": item["total_chunks"]
                }
            })
        
        end = time.time()
        
        # LLM-optimized response format
        response = {
            "query": request.query,
            "results_count": len(final_results),
            "results": final_results,
            "timing": {
                "retrieval_ms": round((retrieval_end - start) * 1000, 2),
                "reranking_ms": round((end - retrieval_end) * 1000, 2),
                "total_ms": round((end - start) * 1000, 2)
            },
            "context": "The following results are from a semantic search about the family of Schwarzschild solutions in physics. Each result contains content from academic papers with normalized confidence scores."
        }
        
        return response
    
    except Exception as e:
        print(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")

# For direct execution (uvicorn main:app --reload)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)