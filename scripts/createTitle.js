const { argv } = require('yargs');

const { fetchStorysAndUpdatePr } = require('../index');

const help = `

    Basic Usage:

    node scripts/createTitle.js \\
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
    prependType: true,
    fetchStoryNameFlag: 'ch',
    pullRequest,
    repository: {},
    dryRun: true,
  };
  const newPrTitle = await fetchStorysAndUpdatePr(params);
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
