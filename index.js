import * as core from '@actions/core';
import github from '@actions/github';
import Clubhouse from 'clubhouse-lib';

export function formatMatches(matches) {
  const values = [];

  matches.forEach((match) => {
    const regex = /\D/g;
    const formattedMatch = match.replace(regex, '');
    values.push(formattedMatch);
  });

  return values;
}

export function getStoryIds() {
  const {
    payload: { pull_request: pullRequest },
  } = github.context;
  const branchName = pullRequest.head.ref;
  const branchStoryIds = branchName.match(/(ch)(\d+)/g);
  const prTitle = pullRequest.title;
  // Github user can enter CH story ID in either format: '[ch123]' or 'ch123':
  const prTitleStoryIds =
    prTitle.match(/\[(ch)(\d+)\]/g) || prTitle.match(/(ch)(\d+)/g);
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
    storyIds = formatMatches(prTitleStoryIds);

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

export async function updatePullRequest(metadata) {
  const ghToken = core.getInput('ghToken');
  const octokit = github.getOctokit(ghToken);
  const {
    payload: { pull_request: pullRequest },
    repository,
    repository_owner: owner,
  } = github.context;
  const { title, url } = metadata;
  const originalBody = pullRequest.body;
  const body = `${url} \n \n ${originalBody}`;

  try {
    octokit.pulls.update({
      owner,
      repo: repository,
      pull_number: pullRequest.number,
      title,
      body,
    });
  } catch (error) {
    core.setFailed(error);
  }
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

    const client = Clubhouse.create(chToken);
    const storyIds = getStoryIds();
    const story = await getClubhouseStory(client, storyIds);
    const formattedStoryIds = storyIds.map((id) => `[ch${id}]`).join(' ');
    const storyNameAndId = `${story.name} ${formattedStoryIds}`;

    await updatePullRequest({
      title: storyNameAndId,
      url: story.app_url,
    });

    return core.setOutput('prTitle', storyNameAndId);
  } catch (error) {
    return core.setFailed(error.message);
  }
}

run();
