const { argv } = require('yargs');

const { fetchStoryAndUpdatePr } = require('../index');

const help = `

    Basic Usage:

    node -r @babel/register scripts/createTitle.js \\
        --prTitle 'ch' \\
        --branchName 'user/ch12345/name-of-a-ticket' \\
    ;
`;

async function createTitle(args) {
  const { prTitle, branchName } = args;
  if (prTitle === undefined || branchName === undefined) {
    throw new Error(help);
  }
  if (!process.env.CH_TOKEN) {
    throw new Error('CH_TOKEN env var is unset');
  }
  const pullRequest = {
    title: prTitle,
    head: { ref: branchName },
  };
  const params = {
    ghToken: 'aaaaaaaa',
    chToken: process.env.CH_TOKEN,
    addStoryType: true,
    useStoryNameTrigger: 'ch',
    pullRequest,
    repository: {},
    dryRun: true,
  };
  const newPrTitle = await fetchStoryAndUpdatePr(params);
  console.log(`Created Title: ${newPrTitle}`);
}

function exit(err) {
  console.error(err);
  process.exit(1);
}

async function main() {
  try {
    await createTitle(argv);
  } catch (err) {
    exit(err);
  }
}

if (require.main === module) {
  main();
}
