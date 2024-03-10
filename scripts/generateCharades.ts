import dotenv from "dotenv";
dotenv.config();
import https from "https";
import fs from "fs";
import { sleep } from "../src/utils.js";
import { MongoClient, ObjectId } from "mongodb";
import { S3 } from "@aws-sdk/client-s3";
import OpenAI from "openai";
import { parse } from "ts-command-line-args";
import sharp from "sharp";
import { pipeline } from "@xenova/transformers";

interface Args {
  localPreview?: boolean;
  justOne?: boolean;
}

const args = parse<Args>({
  localPreview: {
    type: Boolean,
    optional: true,
  },
  justOne: {
    type: Boolean,
    optional: true,
  },
});

const imageWidth = 256;
const imageHeight = 256;

(async () => {
  console.log("Generating new rounds of charades...");
  try {
    const s3 = new S3({
      region: "us-east-2",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
      },
    });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const client = await MongoClient.connect(process.env.MONGO_URL ?? "");
    const database = client.db("production");
    const charades = database.collection("charades");
    const results = await charades.find().sort({ isoDate: -1 }).limit(3);
    let recentCharades: { isoDateId: any; index: any }[] = [];
    await results.forEach((result) => {
      console.log(result.isoDateId);
      recentCharades.push({
        isoDateId: result.isoDateId,
        index: result.charadeIndex,
      });
    });
    console.log(recentCharades);
    let generationInfo = [];
    for (let i = 1; i < 6; i++) {
      const lastDate = new Date(recentCharades[0].isoDateId);
      console.log(lastDate);
      lastDate.setUTCHours(lastDate.getUTCHours() + i * 24);
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
    for (let i = 0; i < generationInfo.length; i++) {
      const objectId = new ObjectId();
      const id = objectId.toString();
      console.log(objectId);
      console.log(id);
      const result = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a fun game designer coming up with prompts " +
              "for a game of charades. The prompts should be 3 to 5 " +
              "words long and describe an interesting visual scene " +
              "for someone to act out. The prompts should be coherent " +
              "and easily understandable for players. " +
              "Only answer with the " +
              "prompts and nothing else. Do not include quotes, " +
              "punctuation, or special characters.",
          },
          {
            role: "user",
            content: "Please give me a prompt for a round of charades",
          },
        ],
        temperature: 1.9,
      });
      const prompt = result.choices[0].message.content;
      if (!prompt?.length)
        throw new Error("prompt was not successfully generated");
      console.log(prompt);
      const pipe = await pipeline("embeddings");
      const embeddings = await pipe(prompt, {
        pooling: "mean",
        normalize: true,
      });
      const promptEmbeddings: number[] = Array.from(embeddings.flatten().data);
      console.log("prompt embeddings:");
      console.log(promptEmbeddings);
      const response = await openai.images.generate({
        prompt: prompt,
        n: 5,
        size: `${imageWidth}x${imageHeight}`,
      });
      let uploadPromises = [];
      for (let j = 0; j < 5; j++) {
        uploadPromises.push(
          new Promise((resolve) => {
            try {
              const imageUrl = response.data[j].url;
              if (!imageUrl) throw new Error("no image url");
              console.log(imageUrl);
              const file = fs.createWriteStream(
                `tmp/${id}${j === 0 ? "" : `-${j}`}.jpg`,
              );
              https.get(imageUrl, function (response) {
                response.pipe(file);
              });

              file.on("close", async () => {
                console.log(`File ${j + 1} written for prompt ${i}!`);
                const blob = fs.readFileSync(
                  `tmp/${id}${j === 0 ? "" : `-${j}`}.jpg`,
                );
                file.close();
                console.log(blob);
                if (args.localPreview) resolve(true);
                const params = {
                  Bucket: "charades.ai",
                  Key: `images/${id}${j === 0 ? "" : `-${j}`}.jpg`,
                  Body: blob,
                  ContentType: "image/jpeg",
                };
                let s3response = await s3.putObject(params);
                resolve(s3response);
              });
            } catch (err) {
              console.log(err);
              throw new Error(JSON.stringify(err as any));
            }
          }),
        );
      }
      await Promise.all(uploadPromises);
      const mask = Buffer.from(
        `<svg><rect x="0" y="0" width="${imageWidth * 2}" height="${
          imageHeight * 2
        }" rx="20" ry="20" /></svg>`,
      );
      const modifiedFirstImage = await sharp(`tmp/${id}.jpg`)
        .resize(imageHeight * 2, imageWidth * 2, { fit: "cover" })
        .png()
        .composite([
          {
            input: mask,
            blend: "dest-in",
          },
        ])
        .toBuffer();
      await sharp("public/charades-dynamic-preview.jpg")
        .composite([{ input: modifiedFirstImage, left: 64, top: 60 }])
        .toFile(`tmp/${generationInfo[i].charadeIndex}-preview.jpg`);
      if (!args.localPreview) {
        const blob = fs.readFileSync(
          `tmp/${generationInfo[i].charadeIndex}-preview.jpg`,
        );
        const params = {
          Bucket: "charades.ai",
          Key: `previews/${generationInfo[i].charadeIndex}-preview.jpg`,
          Body: blob,
          ContentType: "image/jpeg",
        };
        await s3.putObject(params);
      }
      console.log(`preview image created for prompt ${i}!`);
      if (!args.localPreview) {
        console.log("creating db entry...");
        await charades.insertOne({
          _id: objectId,
          isoDate: new Date(generationInfo[i].isoDateString),
          isoDateId: generationInfo[i].isoDateId,
          charadeIndex: generationInfo[i].charadeIndex,
          answer: prompt,
          promptEmbeddings,
        });
        console.log(`db entry created for prompt ${i}!`);
      }
      if (args.justOne) break;
      // avoid rate limiting by openai
      await sleep(60000);
    }
    console.log(
      `finished generating ${
        args.justOne ? "1" : generationInfo.length
      } charade(s)`,
    );
  } catch (err) {
    console.error(JSON.stringify(err as any));
    process.exit(1);
  }
  process.exit(0);
})();
