const core = require('@actions/core');
const github = require('@actions/github');
const Clubhouse = require('clubhouse-lib');

function formatMatches(matches) {
  const values = [];

  matches.forEach((match) => {
    const regex = /\D/g;
    const formattedMatch = match.replace(regex, '');
    values.push(formattedMatch);
  });

  return values;
}

function getStoryIds(pullRequest) {
  const branchName = pullRequest.head.ref;
  // Only when a Github user formats their branchName as: text/sc-123/something
  const branchStoryIds = branchName.match(/\/(sc-)(\d+)\//g);
  const prTitle = pullRequest.title;
  // Github user can enter SC story ID in either format: '[sc-123]' or 'sc-123':
  const prTitleStoryIds = prTitle.match(/(?<=sc-)\d+/g);
  // Github user can include more than one SC story ID
  let storyIds = '';

  core.info(`Branch Name: ${branchName}`);
  core.info(`PR Title: ${prTitle}`);

  if (branchStoryIds) {
    storyIds = formatMatches(branchStoryIds);

    core.info(`Found Shortcut ID(s) in Branch Name: ${storyIds.join(', ')}`);

    return storyIds;
  }

  if (prTitleStoryIds) {
    storyIds = prTitleStoryIds;

    core.info(`Found Shortcut ID(s) in PR Title: ${storyIds.join(', ')}`);

    return storyIds;
  }

  return core.setFailed(
    'Action failed to find a Shortcut ID in both the branch name and PR title.'
  );
}

async function getShortcutStory(client, storyIds) {
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

async function updatePullRequest(ghToken, pullRequest, repository, metadata) {
  const octokit = github.getOctokit(ghToken);
  const {
    name: repo,
    owner: { login },
  } = repository;
  const { title, url } = metadata;
  const originalBody = pullRequest.body;
  let body = `Story Details: ${url}`;

  if (originalBody) {
    if (originalBody.includes(body)) {
      body = originalBody;
    } else {
      body += `\n\n${originalBody}`;
    }
  }

  try {
    core.info(`Updating Title: ${title}`);
    return await octokit.rest.pulls.update({
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

function getTitle(storyIds, story, prTitle, useStoryNameTrigger, addStoryType) {
  const formattedStoryIds = storyIds.map((id) => `[sc-${id}]`).join(' ');
  const basePrTitle = prTitle === useStoryNameTrigger ? story.name : prTitle;
  const typePrefix = addStoryType ? `(${story.story_type}) ` : '';
  let newTitle = basePrTitle;

  if (basePrTitle.indexOf(typePrefix) < 0) {
    newTitle = `${typePrefix}${newTitle}`;
  }

  if (basePrTitle.indexOf(formattedStoryIds) < 0) {
    newTitle = `${newTitle} ${formattedStoryIds}`;
  }

  return newTitle;
}

async function fetchStoryAndUpdatePr(params) {
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
  const story = await getShortcutStory(client, storyIds);
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

async function run() {
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

    const octokit = github.getOctokit(ghToken);
    const { number: prNumber, repository } = github.context.payload;
    const { data: pullRequest } = await octokit.pulls.get({
      repo: repository.name,
      owner: repository.owner.login,
      pull_number: prNumber,
    });
    const params = {
      ghToken,
      chToken,
      addStoryType: core.getInput('addStoryType'),
      useStoryNameTrigger: core.getInput('useStoryNameTrigger'),
      pullRequest,
      repository,
      dryRun: false,
    };
    const prTitle = await fetchStoryAndUpdatePr(params);

    return core.setOutput('prTitle', prTitle);
  } catch (error) {
    return core.setFailed(error.message);
  }
}

// Always true in the actions env
if (process.env.GITHUB_ACTIONS) {
  run();
}

export {
  formatMatches,
  getStoryIds,
  getShortcutStory,
  getTitle,
  fetchStoryAndUpdatePr,
  run,
};
