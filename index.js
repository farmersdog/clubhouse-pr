const core = require('@actions/core');
const github = require('@actions/github');
const Clubhouse = require('clubhouse-lib');

export function formatMatches(matches) {
  const values = [];

  matches.forEach((match) => {
    const regex = /\D/g;
    const formattedMatch = match.replace(regex, '');
    values.push(formattedMatch);
  });

  return values;
}

export function getStoryIds(githubCtx) {
  const { pull_request: pullRequest } = githubCtx.payload;
  const branchName = pullRequest.head.ref;
  // Only when a Github user formats their branchName as: text/ch123/something
  const branchStoryIds = branchName.match(/\/(ch)(\d+)\//g);
  const prTitle = pullRequest.title;
  // Github user can enter CH story ID in either format: '[ch123]' or 'ch123':
  const prTitleStoryIds = prTitle.match(/(?<=ch)\d+/g);
  // Github user can include more than one CH story ID
  let storyIds = '';

  core.info(`Branch Name: ${branchName}`);
  core.info(`PR Title: ${prTitle}`);

  if (branchStoryIds) {
    storyIds = formatMatches(branchStoryIds);

    core.info(`Found Clubhouse ID(s) in Branch Name: ${storyIds.join(', ')}`);

    return storyIds;
  }

  if (prTitleStoryIds) {
    storyIds = prTitleStoryIds;

    core.info(`Found Clubhouse ID(s) in PR Title: ${storyIds.join(', ')}`);

    return storyIds;
  }

  return core.setFailed(
    'Action failed to find a Clubhouse ID in both the branch name and PR title.'
  );
}

export async function getClubhouseStory(client, storyIds) {
  // Even if there's more than one storyId, fetch only first story name:
  try {
    return client
      .getStory(storyIds[0])
      .then((res) => res)
      .catch((err) => err.response);
  } catch (error) {
    return core.setFailed(error);
  }
}

export async function updatePullRequest(githubCtx, metadata) {
  const ghToken = core.getInput('ghToken');
  const octokit = github.getOctokit(ghToken);
  const {
    pull_request: pullRequest,
    repository: {
      name: repo,
      owner: { login },
    },
  } = githubCtx.payload;
  const { title, url } = metadata;
  const originalBody = pullRequest.body;
  const body = `${url} \n \n${originalBody}`;

  try {
    return await octokit.pulls.update({
      repo,
      owner: login,
      pull_number: pullRequest.number,
      title,
      body,
    });
  } catch (error) {
    return core.setFailed(error);
  }
}

export async function createPrTitle(storyName, formattedStoryIds) {
  return `${storyName} ${formattedStoryIds}`;
}

export async function run() {
  try {
    const ghToken = core.getInput('ghToken');
    const chToken = core.getInput('chToken');
    const prependType = core.getInput('prependType');
    const fetchStoryNameFlag = core.getInput('fetchStoryNameFlag');

    if (!ghToken) {
      return core.setFailed('Input ghToken is required.');
    }

    if (!chToken) {
      return core.setFailed('Input chToken is required.');
    }

    // Mask tokens:
    core.setSecret('ghToken');
    core.setSecret('chToken');

    const client = Clubhouse.create(chToken);
    const storyIds = getStoryIds(github.context);
    const story = await getClubhouseStory(client, storyIds);
    const formattedStoryIds = storyIds.map((id) => `[ch${id}]`).join(' ');
    const prTitle = createPrTitle(story.name, formattedStoryIds);

    await updatePullRequest(github.context, {
      title: prTitle,
      url: story.app_url,
    });

    return core.setOutput('prTitle', prTitle);
  } catch (error) {
    return core.setFailed(error.message);
  }
}

run();
