# 🧐 foundle

wordle for founders: guess the startup whose pitch deck the slide is from

## getting start with railway cli

to have access to other services when building and testing, you'll need to
join the railway project

1. run `npm i -g @railway/cli` to install railway cli
2. make you're added to the railway project
3. run `railway login` to authenticate
4. run `railway link` to pull up a list of projects, link to the `charades.ai` project

## getting started with dev

1. make sure you're set up with railway cli
2. run `yarn` to install dependencies
3. run `railway run yarn dev` to compile and launch in dev mode
4. open http://localhost:3000 to access app in dev

## running tests (jest)

1. make sure you're set up with railway cli
2. run `yarn` to install dependencies
3. run `railway run yarn test` to run jest tests
4. run `railway run yarn test:coverage` to see code coverage
5. make sure tests are passing before a pull request as there's a github action that runs tests on PRs

## details

The following tech was used to build the app, please check out the docs:

- React (https://reactjs.org/docs/getting-started.html)
- Next.js (https://nextjs.org/docs)
- Tailwind (https://tailwindcss.com/docs/installation)
- DaisyUI (https://daisyui.com/)
- Jest (https://jestjs.io/)
- Railway (https://railway.app/)
