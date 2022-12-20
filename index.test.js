import * as core from '@actions/core';
import github from '@actions/github';
import * as action from '.';

let inputs = {};

const stories = {
  1: { name: '(feat) Story 1', id: '1', story_type: 'bug' },
  2: { name: '(feat) Story 2', id: '2', story_type: 'chore' },
};

jest.mock('@useshortcut/client', () => {
  class ShortcutClient {
    /* eslint-disable class-methods-use-this */
    async getStory(id) {
      return new Promise((resolve) => {
        process.nextTick(() => resolve({ data: stories[id] }));
      }).catch(() => 'Error fetching story!');
    }
  }
  return { ShortcutClient };
});

jest.mock('@actions/core');

jest.mock('@actions/github', () => ({
  getOctokit: jest.fn(),
}));

github.context = {
  payload: {
    pull_request: {
      title: 'Feature Name',
      head: { ref: 'username/sc-1/feature-name' },
    },
  },
};

jest.spyOn(core, 'getInput').mockImplementation((name) => inputs[name]);

jest.spyOn(core, 'info').mockImplementation(jest.fn());
jest.spyOn(core, 'setFailed').mockImplementation(jest.fn());
jest.spyOn(core, 'setSecret').mockImplementation(jest.fn());

describe('Update Pull Request', () => {
  describe('run()', () => {
    beforeEach(() => {
      inputs = {};
    });

    test('should exit if no ghToken input', async () => {
      await action.run();
      expect(core.setFailed).toHaveBeenCalledTimes(1);
    });

    test('should exit if no chToken input', async () => {
      inputs.ghToken = '123';
      await action.run();
      expect(core.setFailed).toHaveBeenCalledTimes(1);
    });
  });

  describe('Creating the PR Title', () => {
    test('should use story name from shortcut as title', async () => {
      const prTitle = action.getTitle(
        ['5678'],
        { name: 'A shortcut story name', story_type: 'feature' },
        'sc-',
        'sc-',
        true
      );
      expect(prTitle).toEqual('(feature) A shortcut story name [sc-5678]');
    });

    test('should not use story name from shortcut as title', async () => {
      const prTitle = action.getTitle(
        ['5678'],
        { name: 'A shortcut story name', story_type: 'feature' },
        'A PR title that should not be replaced',
        'sc-',
        true
      );
      expect(prTitle).toEqual(
        '(feature) A PR title that should not be replaced [sc-5678]'
      );
    });

    test('should not add story type when option is false', async () => {
      const prTitle = action.getTitle(
        ['5678'],
        { name: 'A shortcut story name', story_type: 'feature' },
        'A PR title that should not be replaced',
        'sc-',
        false
      );
      expect(prTitle).toEqual(
        'A PR title that should not be replaced [sc-5678]'
      );
    });

    test('should not duplicate story number if already present', async () => {
      const prTitle = action.getTitle(
        ['5678'],
        { name: 'A shortcut story name [sc-5678]', story_type: 'feature' },
        'sc-',
        'sc-',
        true
      );
      expect(prTitle).toEqual('(feature) A shortcut story name [sc-5678]');
    });

    test('should not duplicate story type if already present', async () => {
      const prTitle = action.getTitle(
        ['5678'],
        { name: '(feature) A shortcut story name', story_type: 'feature' },
        'sc-',
        'sc-',
        true
      );
      expect(prTitle).toEqual('(feature) A shortcut story name [sc-5678]');
    });
  });

  describe('getStoryIds', () => {
    test('should return storyIds from branchName', () => {
      const { pull_request: pullRequest } = github.context.payload;
      expect(action.getStoryIds(pullRequest)).toEqual(['1']);
    });

    test('should return [sc-#] storyIds from PR title', () => {
      const pullRequest = {
        title: '[sc-2]',
        head: { ref: 'i-named-this-in-a-diff-format' },
      };

      expect(action.getStoryIds(pullRequest)).toEqual(['2']);
    });

    test('should return sc-# storyIds from PR title', () => {
      const pullRequest = {
        title: 'sc-2',
        head: { ref: 'i-named-this-in-a-diff-format' },
      };

      expect(action.getStoryIds(pullRequest)).toEqual(['2']);
    });

    test('should return an empty array if no sc- id in PR title or branchName', () => {
      const pullRequest = {
        title: 'I have nothing related to sc- ids in my title',
        head: { ref: 'i-dont-have-a-sc-id-in-here' },
      };

      const result = action.getStoryIds(pullRequest);
      expect(result).toEqual([]);
    });
  });

  describe('fetchStoryAndUpdatePr', () => {
    let params;

    beforeAll(() => {
      params = {
        ghToken: 'fake',
        chToken: 'fake',
        addStoryType: true,
        useStoryNameTrigger: true,
        pullRequest: {
          head: {
            ref: 'username/sc-2/feature-name',
          },
          title: 'Original Title',
        },
        repository: {
          name: 'api',
          owner: {
            login: 'username',
          },
        },
        dryRun: false,
      };
    });

    test('should return the story title and update the PR if a story is found', async () => {
      await expect(action.fetchStoryAndUpdatePr(params)).resolves.toEqual(
        '(chore) Original Title [sc-2]'
      );
    });

    test('should return the original title and not update the PR if a story is not found', async () => {
      params.pullRequest.head.ref = 'username/feature-name';
      await expect(action.fetchStoryAndUpdatePr(params)).resolves.toEqual(
        'Original Title'
      );
    });
  });
});
