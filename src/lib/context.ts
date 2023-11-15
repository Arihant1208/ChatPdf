import { Pinecone } from "@pinecone-database/pinecone";
import { getEmbeddings } from "./emdedings";

export async function getMatchesFromEmbeddings(embeddings: number[]) {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
    environment: process.env.PINECONE_ENVIRONMENT!,
  });
  const index = await pinecone.Index("chatpdf-1208");

  try {
    const queryResult = await index.query({
      topK: 5,
      vector: embeddings,
      includeMetadata: true,
    });
    console.log(queryResult);
    return queryResult.matches || [];
  } catch (error) {
    console.log("error querying emdeddings ", error);
    throw error;
  }
}

export async function getContext(query: string) {
  const queryEmdeddings = await getEmbeddings(query);
  const matches = await getMatchesFromEmbeddings(queryEmdeddings);

  const qualifyingDocs = matches.filter(
    (match) => match.score && match.score > 0.5
  );

  type Metadata = {
    text: string;
    pageNumber: number;
  };
  let docs = qualifyingDocs.map((match) => (match.metadata as Metadata).text);
  console.log("CONTENT DOCS ", docs);

  return docs.join("\n").substring(0, 3000);
}
