#!/usr/bin/node

import dotenv from "dotenv";
dotenv.config();

import https from "https";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { answerList } from "../src/utils.js";
import { MongoClient } from "mongodb";
import { S3 } from "@aws-sdk/client-s3";
const s3 = new S3({region: "us-east-2"});

import { Configuration, OpenAIApi } from "openai";
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 1.5,
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
for (let i = 1; i < 6; i++) {
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

console.log(process.cwd());
for (let i = 0; i < generationInfo.length ; i++) {
  const id = uuidv4();
  console.log(id);
  const promptIndex = Math.floor(Math.random() * answerList.length);
  const prompt = answerList[promptIndex];
  console.log(prompt);
  let response;
  try {
    response = await openai.createImage({
      prompt: prompt,
      n: 5,
      size: "256x256",
    });
  } catch (err) {
    console.log(err);
    throw new Error(err);
  }
  let uploadPromises = [];
  try {
    for (let j = 0; j < 5; j++) {
      uploadPromises.push(new Promise((resolve) => {
        try {
          const imageUrl = response.data.data[j].url;
          console.log(imageUrl);
          const file =
            fs.createWriteStream(`tmp/${id}${j === 0 ? "" : `-${j}`}.jpg`);
          https.get(imageUrl, function(response) {
            response.pipe(file);
          });
        
          file.on("close", async () => {
            console.log(`File ${j + 1} written for prompt ${i}!`);
            const blob =
              fs.readFileSync(`tmp/${id}${j === 0 ? "" : `-${j}`}.jpg`);
            file.close();
            console.log(blob);
            const params = {
              Bucket: "charades.ai",
              Key: `images/${id}${j === 0 ? "" : `-${j}`}.jpg`,
              Body: blob,
            };
            
            let s3response = await s3.putObject(params);
            resolve(s3response);
          });
        } catch (err) {
          console.log(err);
          throw new Error(err);
        }
      }));
    }
  } catch (err) {
    console.log(err);
    throw new Error(err);
  }
  await Promise.all(uploadPromises).then(async () => {
    await charades.insertOne({
      _id: id,
      isoDate: new Date(generationInfo[i].isoDateString),
      isoDateId: generationInfo[i].isoDateId,
      charadeIndex: generationInfo[i].charadeIndex,
      answer: prompt,
    });
    console.log(`db entry created for prompt ${i}!`);
  });
}
console.log(`finished generating ${generationInfo.length} charades`);
process.exit(0);
