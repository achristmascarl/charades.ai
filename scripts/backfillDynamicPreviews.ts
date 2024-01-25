import dotenv from "dotenv";
dotenv.config();
import { parse } from "ts-command-line-args";
import {
  S3,
  S3ClientConfig,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { MongoClient } from "mongodb";
import sharp from "sharp";
import fs from "fs";

interface Args {
  dryRun?: boolean;
  overwrite?: boolean;
}

const args = parse<Args>({
  dryRun: {
    type: Boolean,
    optional: true,
  },
  overwrite: {
    type: Boolean,
    optional: true,
  },
});

const imageWidth = 256;
const imageHeight = 256;

(async () => {
  console.log("Backfilling dynamic previews...");
  let s3objects: string[] = [];
  const s3client = new S3({
    region: "us-east-2",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  } as S3ClientConfig);
  const command = new ListObjectsV2Command({
    Bucket: "charades.ai",
  });
  try {
    let isTruncated = true;
    while (isTruncated) {
      const { Contents, IsTruncated, NextContinuationToken } =
        await s3client.send(command);
      Contents?.forEach((c) => c.Key && s3objects.push(c.Key));
      isTruncated = IsTruncated || false;
      command.input.ContinuationToken = NextContinuationToken;
    }
  } catch (err: unknown) {
    console.log(err);
    throw new Error(err as string);
  }
  console.log(`Found ${s3objects.length} objects in S3 bucket`);
  const client = await MongoClient.connect(process.env.MONGO_URL ?? "");
  const database = client.db("production");
  const charades = database.collection("charades");
  const results = await charades.find();
  let charadeDocs: any[] = [];
  await results.forEach((results) => {
    charadeDocs.push(results);
  });
  console.log(`Found ${charadeDocs.length} charades in database`);
  let backfilledCount = 0;
  for (const doc of charadeDocs) {
    if (
      args.overwrite ||
      !s3objects.includes(`previews/${doc.charadeIndex}-preview.jpg`)
    ) {
      console.log(`Missing preview for ${doc.charadeIndex}. Generating...`);
      if (!args.dryRun) {
        const firstImage = await s3client.send(
          new GetObjectCommand({
            Bucket: "charades.ai",
            Key: `images/${doc._id.toString()}.jpg`,
          })
        );
        if (!firstImage.Body) {
          console.log(`No image found for ${doc.charadeIndex}`);
          continue;
        }
        const bytes = await firstImage.Body?.transformToByteArray();
        const mask = Buffer.from(
          `<svg><rect x="0" y="0" width="${imageWidth * 2}" height="${
            imageHeight * 2
          }" rx="20" ry="20" /></svg>`
        );
        const modifiedFirstImage = await sharp(Buffer.from(bytes))
          .resize(imageWidth * 2, imageHeight * 2, { fit: "cover" })
          .png()
          .composite([{ input: mask, blend: "dest-in" }])
          .toBuffer();
        await sharp("public/charades-dynamic-preview.jpg")
          .composite([{ input: modifiedFirstImage, left: 64, top: 60 }])
          .toFile(`tmp/${doc.charadeIndex}-preview.jpg`);
        const blob = fs.readFileSync(`tmp/${doc.charadeIndex}-preview.jpg`);
        await s3client.send(
          new PutObjectCommand({
            Bucket: "charades.ai",
            Key: `previews/${doc.charadeIndex}-preview.jpg`,
            Body: blob,
            ContentType: "image/jpeg",
          })
        );
        console.log(`Uploaded preview for ${doc.charadeIndex}`);
        backfilledCount++;
      }
    }
  }
  console.log(`Backfilled ${backfilledCount} previews. Finished!`);
  process.exit(0);
})();
