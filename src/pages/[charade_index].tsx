import dotenv from "dotenv";
dotenv.config();
import { GetStaticProps, GetStaticPaths } from "next";
import Head from "next/head";
import { MongoClient } from "mongodb";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function CharadeIndex({ index }: { index: string }) {
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      router.replace("/");
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Head>
        <link
          rel="icon"
          href={
            "data:image/svg+xml," +
            "<svg xmlns=%22http://www.w3.org/2000/svg%22" +
            " viewBox=%220 0 100 100%22>" +
            "<text y=%22.9em%22 font-size=%2290%22>🎭</text>" +
            "</svg>"
          }
        />
        <title>charades.ai</title>
        <meta name="og:title" content="charades.ai" />
        <meta
          name="description"
          content="play charades with ai! powered by openai's dall·e."
        />
        <meta
          property="og:image"
          content={
            "https://s3.us-east-2.amazonaws.com/" +
            `charades.ai/previews/${index}-preview.jpg`
          }
        />
      </Head>
      <div className="flex flex-col align-middle justify-center h-screen">
        <p className="text-center">Redirecting to today&apos;s round...</p>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  let url = process.env.MONGO_URL;
  if (!url) {
    throw new Error(
      "MONGO_URL env variable undefined; did you prepend `railway run`?",
    );
  }
  const client = await MongoClient.connect(url);
  const database = client.db("production");
  const charades = database.collection("charades");

  // get charade for today
  const date = new Date(Date.now());
  date.setUTCHours(date.getUTCHours() - 4);
  const isoString = date.toISOString();
  const isoDateId = isoString.split("T")[0];
  console.log(isoDateId);
  const query = { isoDateId: isoDateId };
  console.log(query);
  const charade = await charades.findOne(query);
  console.log(charade);
  await client.close();
  const mostRecentIndex = parseInt(charade?.charadeIndex ?? "0");
  const paths = [];
  for (let i = 0; i <= mostRecentIndex; i++) {
    paths.push({ params: { charade_index: i.toString() } });
  }
  console.log(paths);
  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (!(params?.charade_index as string).length) {
    return { redirect: { destination: "/", permanent: false } };
  }
  return {
    props: {
      index: params?.charade_index as string,
    },
  };
};
