import dotenv from "dotenv";
dotenv.config();
import https from "https";
import fs from "fs";
import { answerList, sleep } from "../src/utils.js";
import { MongoClient, ObjectId } from "mongodb";
import { S3 } from "@aws-sdk/client-s3";
import { Configuration, OpenAIApi } from "openai";
import { parse } from "ts-command-line-args";
import sharp from "sharp";

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

    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

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
      const promptIndex = Math.floor(Math.random() * answerList.length);
      const prompt = answerList[promptIndex];
      console.log(prompt);
      let response;
      response = await openai.createImage({
        prompt: prompt,
        n: 5,
        size: `${imageWidth}x${imageHeight}`,
      });
      let uploadPromises = [];
      for (let j = 0; j < 5; j++) {
        uploadPromises.push(
          new Promise((resolve) => {
            try {
              const imageUrl = response.data.data[j].url;
              if (!imageUrl) throw new Error("no image url");
              console.log(imageUrl);
              const file = fs.createWriteStream(
                `tmp/${id}${j === 0 ? "" : `-${j}`}.jpg`
              );
              https.get(imageUrl, function (response) {
                response.pipe(file);
              });

              file.on("close", async () => {
                console.log(`File ${j + 1} written for prompt ${i}!`);
                const blob = fs.readFileSync(
                  `tmp/${id}${j === 0 ? "" : `-${j}`}.jpg`
                );
                file.close();
                console.log(blob);
                if (args.localPreview) resolve(true);
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
              throw new Error(JSON.stringify(err as any));
            }
          })
        );
      }
      await Promise.all(uploadPromises);
      const mask = Buffer.from(
        `<svg><rect x="0" y="0" width="${imageWidth}" height="${imageHeight}" rx="10" ry="10" /></svg>`
      );
      const modifiedFirstImage = await sharp(`tmp/${id}.jpg`)
        .resize(imageHeight, imageWidth, { fit: "cover" })
        .png()
        .composite([
          {
            input: mask,
            blend: "dest-in",
          },
        ])
        .toBuffer();
      await sharp("public/charades-dynamic-preview.jpg")
        .composite([{ input: modifiedFirstImage, left: 32, top: 30 }])
        .toFile(`tmp/${generationInfo[i].charadeIndex}-preview.jpg`);
      if (!args.localPreview) {
        const blob = fs.readFileSync(
          `tmp/${generationInfo[i].charadeIndex}-preview.jpg`
        );
        const params = {
          Bucket: "charades.ai",
          Key: `previews/${generationInfo[i].charadeIndex}-preview.jpg`,
          Body: blob,
        };
        await s3.putObject(params);
      }
      console.log(`preview image created for prompt ${i}!`);
      if (!args.localPreview) {
        console.log("creating db entry...");
        await charades.insertOne({
          id,
          isoDate: new Date(generationInfo[i].isoDateString),
          isoDateId: generationInfo[i].isoDateId,
          charadeIndex: generationInfo[i].charadeIndex,
          answer: prompt,
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
      } charade(s)`
    );
  } catch (err) {
    console.error(JSON.stringify(err as any));
    process.exit(1);
  }
  process.exit(0);
})();
