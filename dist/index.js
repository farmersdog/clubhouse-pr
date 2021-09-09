/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 855:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 505:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 572:
/***/ ((module) => {

module.exports = eval("require")("clubhouse-lib");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__nccwpck_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__nccwpck_require__.o(definition, key) && !__nccwpck_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__nccwpck_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__nccwpck_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
__nccwpck_require__.r(__webpack_exports__);
/* harmony export */ __nccwpck_require__.d(__webpack_exports__, {
/* harmony export */   "formatMatches": () => (/* binding */ formatMatches),
/* harmony export */   "getStoryIds": () => (/* binding */ getStoryIds),
/* harmony export */   "getShortcutStory": () => (/* binding */ getShortcutStory),
/* harmony export */   "getTitle": () => (/* binding */ getTitle),
/* harmony export */   "fetchStoryAndUpdatePr": () => (/* binding */ fetchStoryAndUpdatePr),
/* harmony export */   "run": () => (/* binding */ run)
/* harmony export */ });
const core = __nccwpck_require__(855);
const github = __nccwpck_require__(505);
const Clubhouse = __nccwpck_require__(572);

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
  const body = `Story Details: ${url} \n \n${originalBody}`;

  try {
    core.info(`Updating Title: ${title}`);
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

function getTitle(storyIds, story, prTitle, useStoryNameTrigger, addStoryType) {
  const formattedStoryIds = storyIds.map((id) => `[sc-${id}]`).join(' ');
  const basePrTitle = prTitle === useStoryNameTrigger ? story.name : prTitle;
  const typePrefix = addStoryType ? `(${story.story_type}) ` : '';
  const newTitle = `${typePrefix}${basePrTitle} ${formattedStoryIds}`;
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
    return core.setFailed(error.message);
  }
}

// Always true in the actions env
if (process.env.GITHUB_ACTIONS) {
  run();
}



})();

module.exports = __webpack_exports__;
/******/ })()
;