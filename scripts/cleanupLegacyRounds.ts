import { MongoClient } from "mongodb";
import { parse } from "ts-command-line-args";

interface Args {
  liveRun?: boolean;
  from?: number;
}

const args = parse<Args>({
  liveRun: {
    type: Boolean,
    optional: true,
  },
  from: {
    type: Number,
    optional: true,
  },
});

(async () => {
  console.log("Cleaning up legacy rounds...");
  let url = process.env.MONGO_URL;
  if (!url) {
    throw new Error(
      "MONGO_URL env variable undefined; did you prepend `railway run`?",
    );
  }
  const client = await MongoClient.connect(url);
  const database = client.db("production");
  const charades = database.collection("charades");

  // get charade for tmrw
  const date = new Date(Date.now());
  date.setUTCHours(date.getUTCHours() + 20);
  const isoString = date.toISOString();
  const isoDateId = isoString.split("T")[0];
  console.log(isoDateId);
  const query = { isoDateId: isoDateId };
  console.log(query);
  const todaysCharade = await charades.findOne(query);
  console.log("today's charade:", todaysCharade);
  if (!todaysCharade?.charadeIndex) {
    console.error("no charade for today");
    await client.close();
    process.exit(1);
  }
  const startIndex = parseInt(todaysCharade.charadeIndex);
  console.log("start index:", startIndex);

  // get most recent charade
  const results = await charades
    .find()
    .sort({ isoDate: -1 })
    .limit(1)
    .toArray();
  let index;
  results.forEach((result) => {
    console.log(result.charadeIndex);
    index = result.charadeIndex;
  });
  console.log(index);
  if (!index) {
    console.error("no charades found");
    await client.close();
    process.exit(1);
  }
  const mostRecentIndex = parseInt(index);
  console.log("most recent index:", mostRecentIndex);

  // delete legacy rounds
  const allResults = await charades.find().toArray();
  for (const result of allResults) {
    const i = parseInt(result.charadeIndex);
    if (i >= startIndex && (args.from ? i >= args.from : true)) {
      console.log("deleting round", i);
      if (args.liveRun) {
        const deleteResult = await charades.deleteOne({
          charadeIndex: result.charadeIndex,
        });
        console.log("deleted:", deleteResult);
      }
    }
  }
  process.exit(0);
})();
