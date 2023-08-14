#!/usr/bin/node

import dotenv from "dotenv";
dotenv.config();

import https from "https";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { wordList } from "../src/utils.js";
import { MongoClient } from "mongodb";
// import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// const REGION = "us-east-2";
// const s3Client = new S3Client({ region: REGION });

import { Configuration, OpenAIApi } from "openai";
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const client = await MongoClient.connect(process.env.MONGO_URL);
const database = client.db("production");
const charades = database.collection("charades");
const results = await charades.find().sort({"isoDate": -1}).limit(3);
let recentCharades = [];  
await results.forEach((result) => {
  console.log(result.isoDateId);
  recentCharades.push({
    isoDateId: result.isoDateId,
    index: result.charadeIndex
  });
});
console.log(recentCharades);
let generationInfo = [];
for (let i = 1; i < 8; i++) {
  const lastDate = new Date(recentCharades[0].isoDateId);
  console.log(lastDate);
  lastDate.setUTCHours(lastDate.getUTCHours() + (i * 24));
  const isoDateString = lastDate.toISOString();
  console.log(isoDateString);
  const isoDateId = isoDateString.split("T")[0];
  console.log(isoDateId);
  generationInfo.push({
    isoDateString: isoDateString,
    isoDateId: isoDateId,
    charadeIndex: (parseInt(recentCharades[0].index) + i).toString(),
  });
}
console.log(generationInfo);

process.chdir("/tmp");
// for (let generation in generationInfo) {
const id = uuidv4();
const promptIndex = Math.floor(Math.random() * wordList.length);
const prompt = wordList[promptIndex];
console.log(prompt);
const response = await openai.createImage({
  prompt: prompt,
  n: 1,
  size: "256x256",
});
const imageUrl = response.data.data[0].url;
console.log(imageUrl);
const file = fs.createWriteStream(`${id}.jpg`);
https.get(imageUrl, function(response) {
  response.pipe(file);

  file.on("finish", () => {
    file.close();
    console.log("file closed");
  });
});

// }