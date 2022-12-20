const core = require('@actions/core');
const github = require('@actions/github');
const { ShortcutClient } = require('@useshortcut/client');

function formatMatches(matches) {
  const values = [];

  matches.forEach((match) => {
    const regex = /\D/g;
    const formattedMatch = match.replace(regex, '');
    values.push(formattedMatch);
  });

  return values;
}

/**
 * Given a GitHub pull request, extract any referenced Shortcut story IDs
 * @param {object} pullRequest a pull request from a GitHub Actions context
 * @returns an array of Shortcut story Ids found in the branch name or PR title (empty if no IDs found)
 */
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

  return [];
}

async function updatePullRequest(ghToken, pullRequest, repository, metadata) {
  const octokit = github.getOctokit(ghToken);
  const {
    name: repo,
    owner: { login },
  } = repository;
  const { title, url } = metadata;
  const originalBody = pullRequest.body;
  const body = `Story Details: ${url} \n \n${originalBody}`;

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

/**
 * Update a PR to include Shortcut story details if a Shortcut story ID is referenced in the branch or PR
 * @param {object} params configuration options
 * @param {string} params.ghToken GitHub API token
 * @param {string} params.chToken Shortcut API token
 * @param {boolean} params.addStoryType should the story type by included in the PR?
 * @param {string} params.useStoryNameTrigger the PR title to replace (i.e. if "ch" replaces the PR title when the title is "ch")
 * @param {object} params.pullRequest the pull request defails from a GitHub Actions context
 * @param {object} params.repository the repository details from a GitHub Actions context
 * @param {boolean} params.dryRun should we actually update the PR?
 * @returns a new PR title if a story is found, otherwise the original PR title
 */
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
  const client = new ShortcutClient(chToken);
  const storyIds = getStoryIds(pullRequest);

  // If no stories found, use the existing title
  if (storyIds.length === 0) {
    return pullRequest.title;
  }

  // Even if there's more than one storyId, fetch only the first story's name
  const story = await client.getStory(storyIds[0]).then((res) => res.data);

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
    const prTitle = await fetchStoryAndUpdatePr(params);

    return core.setOutput('prTitle', prTitle);
  } catch (error) {
    return core.setFailed(error);
  }
}

// Always true in the actions env
if (process.env.GITHUB_ACTIONS) {
  run();
}

export { formatMatches, getStoryIds, getTitle, fetchStoryAndUpdatePr, run };
