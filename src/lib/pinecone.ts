import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { downloadFromS3 } from "./s3-server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import {
  Document,
  RecursiveCharacterTextSplitter,
} from "@pinecone-database/doc-splitter";
import { getEmbeddings } from "./emdedings";
import md5 from "md5";
import { convertToAscii } from "./utils";
import { log } from "console";

let pinecone: Pinecone | null = null;

export const getPineconeClient = async () => {
  if (!pinecone) {
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
      environment: process.env.PINECONE_ENVIRONMENT!,
    });
  }
  return pinecone;
};

type PDFPages = {
  pageContent: string;
  metadata: {
    loc: { pageNumber: number };
  };
};

// let oldVectorsId: string[] = [];

export async function loadS3IntoPinecone(filekey: string) {
  // 1 obtain the pdf -> download from s3 and read the pdf
  console.log("downloading s3 into file system ");
  const file_name = await downloadFromS3(filekey);
  if (!file_name) {
    throw new Error("could not download from S3");
  }
  const loader = new PDFLoader(file_name);
  const pages = (await loader.load()) as PDFPages[];

  // 2. split and segment the pdf
  const documents = await Promise.all(pages.map(prepareDocument));

  // 3. vectorize and embed indiviusal documents
  const vectors = await Promise.all(
    documents.flat().splice(3).map(embedDocuments)
  );

  // 4. upload to pinecone
  const client = await getPineconeClient();
  const pineconeIndex = client.Index("chatpdf-1208");
  // try {
  //   if (oldVectorsId[0]) {
  //     await pineconeIndex.deleteMany(oldVectorsId);
  //   }
  // } catch (error) {
  //   console.log("deletion error ", error);
  //   throw error;
  // }

  console.log("Inserting vectors into pinecone");
  // oldVectorsId = vectors.map((item) => item.id);
  // const namespace = pineconeIndex.namespace(convertToAscii(filekey));
  // console.log("upsert starting", namespace);
  await pineconeIndex.upsert(vectors);

  console.log("vectors inserted into pinecode ", vectors);
}

async function embedDocuments(doc: Document) {
  try {
    const embeddings = await getEmbeddings(doc.pageContent);
    const hash = md5(doc.pageContent);
    return {
      id: hash,
      values: embeddings,
      metadata: {
        text: doc.metadata.text,
        pageNumber: doc.metadata.pageNumber,
      },
    } as PineconeRecord;
  } catch (error) {
    console.log("error emdedding document", error);
    throw error;
  }
}

export const truncateStringByBytes = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};

async function prepareDocument(page: PDFPages) {
  let { pageContent, metadata } = page;
  pageContent = pageContent.replace(/\n/g, ""); // regex to replace all new line character with empty string  ??????
  //split the docs
  const splitter = new RecursiveCharacterTextSplitter();
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: truncateStringByBytes(pageContent, 36000),
      },
    }),
  ]);
  return docs;
}
