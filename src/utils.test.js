import { companies } from './utils';
import { MongoClient } from 'mongodb';

test('companies exist', () => {
  expect(companies).toBeTruthy();
  expect(companies.length).toBeGreaterThan(0);
});

test('companies basic data valid', () => {
  companies.forEach(company => {
    expect(company.name).toBeTruthy();
    expect(company.name.length).toBeGreaterThan(0);
    expect(company.websiteUrl).toBeTruthy();
    expect(company.websiteUrl.length).toBeGreaterThan(0);
    expect(company.iconUrl).toBeTruthy();
    expect(company.iconUrl.length).toBeGreaterThan(0);
    expect(company.foundingYear).toBeTruthy();
    expect(company.foundingYear).toBeGreaterThan(1800);
  });
});

describe("today's and next 6 foundles valid", () => {
  let url;
  let client;
  let database;
  let foundles;

  beforeAll(async () => {
    url = process.env.MONGO_URL;
    expect(url).toBeTruthy();
    client = await MongoClient.connect(url);
    expect(client).toBeTruthy();
    database = client.db("test");
    expect(database).toBeTruthy();
    foundles = database.collection("foundles");
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
    const utcDateId = utcString.split(' ').slice(1, 4).join('-');
    dateIdQueries.push({ utcDateId: utcDateId });
  }
  dateIdQueries.forEach(async (dateIdQuery) =>
    test(`foundle ${dateIdQuery.utcDateId} valid`, async () => {
      const foundle = await foundles.findOne(dateIdQuery);
      expect(foundle).toBeTruthy();
      expect(foundle.foundleId).toBeTruthy();
      expect(foundle.foundleId.length).toBeGreaterThan(0);
      expect(foundle.answerIndex).toBeDefined();
      expect(foundle.answerIndex).not.toBeNull();
      expect(foundle.answerIndex).toBeGreaterThanOrEqual(0);
      expect(foundle.slideIndex).toBeDefined();
      expect(foundle.slideIndex).not.toBeNull();
      expect(foundle.slideIndex).toBeGreaterThanOrEqual(0);
      expect(companies.length).toBeGreaterThan(foundle.answerIndex);
      expect(companies[foundle.answerIndex].slideUrls.length).toBeGreaterThan(foundle.slideIndex);
      expect(companies[foundle.answerIndex].slideUrls[foundle.slideIndex].length).toBeGreaterThan(0);
      expect(companies[foundle.answerIndex].facts.length).toBeGreaterThan(0);
      expect(companies[foundle.answerIndex].facts[0].length).toBeGreaterThan(0);
    }
    ));
});
