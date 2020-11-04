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

export function getStoryIds(pullRequest) {
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

export async function updatePullRequest(
  ghToken,
  pullRequest,
  repository,
  metadata
) {
  const octokit = github.getOctokit(ghToken);
  const {
    name: repo,
    owner: { login },
  } = repository;
  const { title, url } = metadata;
  const originalBody = pullRequest.body;
  const body = `Story Details: ${url} \n \n${originalBody}`;

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

export async function getTitle(
  storyIds,
  story,
  prTitle,
  useStoryNameTrigger,
  addStoryType
) {
  const formattedStoryIds = storyIds.map((id) => `[ch${id}]`).join(' ');
  const basePrTitle = prTitle === useStoryNameTrigger ? story.name : prTitle;
  const typePrefix = addStoryType ? `(${story.story_type}) ` : '';
  const newTitle = `${typePrefix}${basePrTitle} ${formattedStoryIds}`;
  return newTitle;
}

export async function fetchStoryAndUpdatePr(params) {
  const {
    ghToken,
    chToken,
    addStoryType,
    useStoryNameTrigger,
    pullRequest,
    repository,
    dryRun,
  } = params;
  const client = Clubhouse.create(chToken);
  const storyIds = getStoryIds(pullRequest);
  const story = await getClubhouseStory(client, storyIds);
  const newTitle = getTitle(
    storyIds,
    story,
    pullRequest.title,
    useStoryNameTrigger,
    addStoryType
  );

  if (!dryRun) {
    await updatePullRequest(ghToken, pullRequest, repository, {
      title: newTitle,
      url: story.app_url,
    });
  }

  return newTitle;
}

export async function run() {
  try {
    const ghToken = core.getInput('ghToken');
    const chToken = core.getInput('chToken');

    if (!ghToken) {
      return core.setFailed('Input ghToken is required.');
    }

    if (!chToken) {
      return core.setFailed('Input chToken is required.');
    }

    // Mask tokens:
    core.setSecret('ghToken');
    core.setSecret('chToken');

    const { pull_request: pullRequest, repository } = github.context.payload;
    const params = {
      ghToken,
      chToken,
      addStoryType: core.getInput('addStoryType'),
      useStoryNameTrigger: core.getInput('useStoryNameTrigger'),
      pullRequest,
      repository,
      dryRun: false,
    };
    const prTitle = fetchStoryAndUpdatePr(params);

    return core.setOutput('prTitle', prTitle);
  } catch (error) {
    return core.setFailed(error.message);
  }
}

// Always true in the actions env
if (process.env.GITHUB_ACTIONS) {
  run();
}
