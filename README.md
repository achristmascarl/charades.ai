# 🎭 charades.ai

charades with ai: guess the prompt for the ai-generated image.

## getting start with railway cli

to access environment variables for mongo (and perhaps other env variables added there in the future) in dev, you'll need to join the railway project

1. run `npm i -g @railway/cli` to install railway cli
2. make your account has been added to the railway project
3. run `railway login` to authenticate
4. run `railway link` to pull up a list of projects, link to the `charades.ai` project

## getting started with dev

1. make sure you're set up with railway cli
2. run `yarn` to install dependencies
3. run `yarn dev` to compile and launch in dev mode
4. open http://localhost:3000 to access app in dev

## running tests (jest)

1. make sure you're set up with railway cli
2. run `yarn` to install dependencies
3. run `yarn test` to run jest tests
4. run `yarn test:coverage` to see code coverage
5. make sure tests are passing before a pull request as there's a github action that runs tests on PRs

## generating rounds of charades

1. make sure you're set up with railway cli
2. run `yarn` to install dependencies
3. run `yarn generate` to run a script that generates 5 rounds of charades at a time
4. run `yarn test` to make sure the next several rounds are valid

## testing github actions locally

uses [act](https://github.com/nektos/act) to test github actions workflows locally. this needs to be installed separately.

## details

The following were used to build the app, check out the docs:

- React (https://reactjs.org/docs/getting-started.html)
- Next.js (https://nextjs.org/docs)
- Tailwind (https://tailwindcss.com/docs/installation)
- DaisyUI (https://daisyui.com/)
- Jest (https://jestjs.io/)
- Railway (https://railway.app/)
