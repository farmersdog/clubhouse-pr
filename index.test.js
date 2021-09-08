import * as core from '@actions/core';
import github from '@actions/github';
import * as action from '.';

let inputs = {};

jest.mock('@actions/core');

jest.mock('@actions/github', () => ({
  getOctokit: jest.fn(),
}));

github.context = {
  payload: {
    pull_request: {
      title: 'Feature Name',
      head: { ref: 'username/ch1/feature-name' },
    },
  },
};

jest.spyOn(core, 'getInput').mockImplementation((name) => {
  return inputs[name];
});

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
    test('should use story name from clubhouse as title', async () => {
      const prTitle = action.getTitle(
        ['5678'],
        { name: 'A clubhouse story name', story_type: 'feature' },
        'ch',
        'ch',
        true
      );
      expect(prTitle).toEqual('(feature) A clubhouse story name [ch5678]');
    });

    test('should not use story name from clubhouse as title', async () => {
      const prTitle = action.getTitle(
        ['5678'],
        { name: 'A clubhouse story name', story_type: 'feature' },
        'A PR title that should not be replaced',
        'ch',
        true
      );
      expect(prTitle).toEqual(
        '(feature) A PR title that should not be replaced [ch5678]'
      );
    });

    test('should not add story type when option is false', async () => {
      const prTitle = action.getTitle(
        ['5678'],
        { name: 'A clubhouse story name', story_type: 'feature' },
        'A PR title that should not be replaced',
        'ch',
        false
      );
      expect(prTitle).toEqual(
        'A PR title that should not be replaced [ch5678]'
      );
    });
  });

  describe('getStoryIds', () => {
    test('should return storyIds from branchName', () => {
      const { pull_request: pullRequest } = github.context.payload;
      expect(action.getStoryIds(pullRequest)).toEqual(['1']);
    });

    test('should return [ch#] storyIds from PR title', () => {
      const pullRequest = {
        title: '[ch2]',
        head: { ref: 'i-named-this-in-a-diff-format' },
      };

      expect(action.getStoryIds(pullRequest)).toEqual(['2']);
    });

    test('should return ch# storyIds from PR title', () => {
      const pullRequest = {
        title: 'ch2',
        head: { ref: 'i-named-this-in-a-diff-format' },
      };

      expect(action.getStoryIds(pullRequest)).toEqual(['2']);
    });

    test('should exit if no ch id in PR title or branchName', () => {
      const pullRequest = {
        title: 'I have nothing related to ch ids in my title',
        head: { ref: 'i-dont-have-a-ch-id-in-here' },
      };

      action.getStoryIds(pullRequest);
      expect(core.setFailed).toHaveBeenCalledTimes(1);
    });
  });

  describe('getShortcutStory', () => {
    let chMock;
    let client;
    let stories;
    let storyIds;

    beforeAll(() => {
      storyIds = ['1', '2'];
      stories = [
        { name: '(feat) Story 1', id: '1' },
        { name: '(feat) Story 2', id: '2' },
      ];
      chMock = jest.createMockFromModule('clubhouse-lib').default;
      chMock = {
        create: jest.fn().mockImplementation(() => ({
          getStory: (id) =>
            new Promise((resolve, reject) => {
              process.nextTick(() =>
                stories[id]
                  ? resolve(stories[id])
                  : reject(new Error('Error fetching story!'))
              );
            }).catch(() => 'Error fetching story!'),
        })),
      };
      client = chMock.create('000');
    });

    test('should return a story object', async () => {
      const firstStoryId = storyIds[0];
      await expect(action.getShortcutStory(client, storyIds)).resolves.toEqual(
        stories[firstStoryId]
      );
    });

    test('should error out without any IDs', async () => {
      storyIds = [];
      await expect(action.getShortcutStory(client, storyIds)).resolves.toEqual(
        'Error fetching story!'
      );
    });
  });
});
