#!/usr/bin/node

import dotenv from "dotenv";
dotenv.config();

import { Configuration, OpenAIApi } from "openai";
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 1.5,
});
const openai = new OpenAIApi(configuration);

const response = await openai.createImage({
  prompt: "gonad",
  n: 4,
  size: "256x256",
});

console.log(response.data.data);
