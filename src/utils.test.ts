import { MongoClient, Db, Collection } from "mongodb";
import { ListObjectsV2Command, S3, S3ClientConfig } from "@aws-sdk/client-s3";
import { test, expect, describe, beforeAll, afterAll } from "@jest/globals";
import Charade from "./models/Charade";
import dotenv from "dotenv";
dotenv.config();

describe("today's and next 6 rounds of charades valid", () => {
  let client: MongoClient;
  let database: Db;
  let charades: Collection;
  let s3client;
  let s3objects: string[] = [];

  beforeAll(async () => {
    if (process.env.MONGO_URL === undefined)
      throw new Error("MONGO_URL not defined");
    expect(process.env.MONGO_URL).toBeTruthy();
    client = new MongoClient(process.env.MONGO_URL);
    await client.connect();
    expect(client).toBeTruthy();
    expect(client).not.toBeNull();
    expect(client).not.toBeUndefined();
    database = client.db("production");
    expect(database).toBeTruthy();
    expect(database).not.toBeNull();
    expect(database).not.toBeUndefined();
    charades = database.collection("charades");
    expect(charades).toBeTruthy();
    expect(charades).not.toBeNull();
    expect(charades).not.toBeUndefined();
    s3client = new S3({
      region: "us-east-2",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    } as S3ClientConfig);
    expect(s3client).toBeTruthy();
    expect(s3client).not.toBeNull();
    expect(s3client).not.toBeUndefined();
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
    expect(s3objects).toBeTruthy();
    expect(s3objects.length).toBeGreaterThan(0);
  });

  afterAll(async () => {
    await client.close();
  });

  const dateIdQueries = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(Date.now());
    date.setUTCHours(date.getUTCHours() - 4);
    date.setUTCHours(date.getUTCHours() + i * 24);
    const isoString = date.toISOString();
    const isoDateId = isoString.split("T")[0];
    dateIdQueries.push({ isoDateId: isoDateId });
  }
  dateIdQueries.forEach(async (dateIdQuery) =>
    test(`charades ${dateIdQuery.isoDateId} valid`, async () => {
      const document = await charades.findOne(dateIdQuery);
      const charade = new Charade(
        document?.charadeIndex,
        document?.answer,
        document?.isoDate,
        document?.isoDateId,
        document?.promptEmbeddings,
      );
      const charadeId = document?._id.toString();
      expect(charadeId).toBeTruthy();
      expect(charadeId?.length).toBeGreaterThan(0);
      expect(charade).toBeTruthy();
      expect(charade.charadeIndex).toBeTruthy();
      expect(charade.charadeIndex.length).toBeGreaterThan(0);
      expect(parseInt(charade.charadeIndex)).toBeGreaterThan(0);
      expect(charade.answer).toBeDefined();
      expect(charade.answer).not.toBeNull();
      expect(charade.answer.length).toBeGreaterThan(0);
      expect(charade.promptEmbeddings).toBeDefined();
      expect(charade.promptEmbeddings).not.toBeNull();
      expect(charade.promptEmbeddings.length).toBe(384);
      expect(s3objects).toContain(`images/${charadeId}.jpg`);
      expect(s3objects).toContain(
        `previews/${charade.charadeIndex}-preview.jpg`,
      );
      for (let i = 1; i < 5; i++) {
        expect(s3objects).toContain(`images/${charadeId}-${i}.jpg`);
      }
    }),
  );
});
