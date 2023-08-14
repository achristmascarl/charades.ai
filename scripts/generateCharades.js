#!/usr/bin/node

import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import { parse } from "csv-parse";
import { Document } from "langchain/document";
import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

let mapDocs = [];

const mapsFile = fs.createReadStream("scripts/map_picker.csv")
  .pipe(parse({ columns: true }))
  .on("data", (row) => {
    const doc = new Document({
      pageContent: `${row["Name"]}: ${row["Category"]}: ${row["Description"]}`,
      metadata: {
        link: row["Image"]
      }
    })
    mapDocs.push(doc);
  });

mapsFile.on("end", async () => {
  const vectorStore = await HNSWLib.fromDocuments(
    mapDocs,
    new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    }, {
      maxRetries: 2
    })
  );
  await vectorStore.save("./embeddings/maps");
  console.log("new maps vectorstore saved!");
});

let typeDocs = [];

const typesFile = fs.createReadStream("scripts/event_type.csv")
  .pipe(parse({ columns: true }))
  .on("data", (row) => {
    const doc = new Document({
      pageContent: `${row["Type"]}: ${row["Description"]}`,
      metadata: {
        type: row["Type"],
        id: row["ID"],
      }
    })
    typeDocs.push(doc);
  });

typesFile.on("end", async () => {
  const vectorStore = await HNSWLib.fromDocuments(
    typeDocs,
    new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    }, {
      maxRetries: 2
    })
  );
  await vectorStore.save("./embeddings/types");
  console.log("new event types vectorstore saved!");
});

let modeDocs = [];

const modesFile = fs.createReadStream("scripts/mode_picker.csv")
  .pipe(parse({ columns: true }))
  .on("data", (row) => {
    const doc = new Document({
      pageContent: `${row["Description"]}`,
      metadata: {
        mode: row["Mode"],
      }
    })
    modeDocs.push(doc);
  });

modesFile.on("end", async () => {
  const vectorStore = await HNSWLib.fromDocuments(
    modeDocs,
    new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    }, {
      maxRetries: 2
    })
  );
  await vectorStore.save("./embeddings/modes");
  console.log("new event modes vectorstore saved!");
});
