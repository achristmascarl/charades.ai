import { wordList } from "./utils";
import { MongoClient } from "mongodb";
import { test, expect, describe, beforeAll, afterAll } from "@jest/globals";
import { render, screen } from "@testing-library/react";

test("word list exists", () => {
  expect(wordList).toBeTruthy();
  expect(wordList.length).toBeGreaterThan(0);
});

test("word list is all 5-letter words", () => {
  wordList.forEach(word => {
    expect(word.length).toBe(5);
  });
});

describe("today's and next 6 rounds of charades valid", () => {
  let url;
  let client;
  let database;
  let charades;

  beforeAll(async () => {
    url = process.env.MONGO_URL;
    expect(url).toBeTruthy();
    client = await MongoClient.connect(url);
    expect(client).toBeTruthy();
    database = client.db("production");
    expect(database).toBeTruthy();
    charades = database.collection("charades");
    expect(database).toBeTruthy();
  });

  afterAll(async () => {
    await client.close();
  });

  const dateIdQueries = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(Date.now());
    date.setUTCHours(date.getUTCHours() - 4);
    date.setUTCHours(date.getUTCHours() + (i * 24));
    const utcString = date.toUTCString();
    const utcDateId = utcString.split(" ").slice(1, 4).join("-");
    dateIdQueries.push({ utcDateId: utcDateId });
  }
  dateIdQueries.forEach(async (dateIdQuery) =>
    test(`charades ${dateIdQuery.utcDateId} valid`, async () => {
      const charade = await charades.findOne(dateIdQuery);
      const charadeId = charade._id.toString();
      expect(charade).toBeTruthy();
      expect(charade.charadeIndex).toBeTruthy();
      expect(charade.charadeIndex.length).toBeGreaterThan(0);
      expect(charade.answer).toBeDefined();
      expect(charade.answer).not.toBeNull();
      expect(charade.answer).toHaveLength(5);
      // eslint-disable-next-line @next/next/no-img-element
      render(<img src={`https://s3.us-east-2.amazonaws.com/charades.ai/images/${charadeId}.jpg`} alt="ai-generated image"/>)
      const displayedImage = screen.getByAltText("ai-generated image");
      expect(displayedImage).toBeTruthy();
      expect(displayedImage.src).toContain(`${charadeId}.jpg`);
    })
  );
});
