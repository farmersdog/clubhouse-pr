# ClubHouse Pull Request Github Action

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
![Test](https://github.com/farmersdog/clubhouse-pr/workflows/Test/badge.svg)

Automatically update your Github Pull Request with data from your clubhouse story in the format: `(feat) Some Feature [ch123]`. Also adds the clubhouse story's URL to the beginning of the body of your PR.

This action is configured to extract the clubhouse story id form either the branch or title. It works best if you use the builtin [git helpers](https://help.clubhouse.io/hc/en-us/articles/207540323-Using-Branches-and-Pull-Requests-with-the-Clubhouse-VCS-Integrations) to generate your branch names.

## Inputs

### `ghToken`

**Required** GITHUB_TOKEN

### `chToken`

**Required** Clubhouse API Token

### `addStoryType`

**Optional** Boolean to enable or disable prepending the story type to the PR title

**Default** `true`

### `addStoryIds`

**Optional** Boolean to enable or disable appending the story ids to the PR title

**Default** `true`

### `useStoryNameTrigger`

**Optional** When a PR is opened with this string as the title, fetch the story name from clubhouse

**Default** `ch`

## Outputs

### `prTitle`

The title of the pull request

## Development

Run `yarn tdd` to watch Jest tests as you make your changes.

Run `yarn lint:watch` to watch for ESLint errors/warnings.

**Note**: Always run `yarn build` before pushing any changes.

## Example usage

Note: This is for use when _opening_ a pull request.

```
on:
  pull_request:
    types: [opened]
```

```
uses: actions/clubhouse-pr@v2
with:
  ghToken: ${{ secrets.GITHUB_TOKEN }}
  chToken: ${{ secrets.CLUBHOUSE_API_TOKEN }}
```

## Example Transformations

The below assumes we are working on a clubhouse story with the following parameters

Name: `A cool new feature`

Story Type: `feature`

Story ID: `56789`

### Using the clubhouse story name for a PR title

#### A PR Opened As...

**Title**

```
ch
```

**Body**

```
- We did a thing
- Another thing
- Yay feature
```

#### Is updated to...

**Title**

```
(feature) A cool new feature [ch56789]
```

**Body**

```
Story details: https://app.clubhouse.io/farmersdog/story/56789

- We did a thing
- Another thing
- Yay feature
```

### Using a custom PR title (aka don't use the story name)

#### A PR Opened As...

**Title**

```
We ended up not needing the cool new feature, tweaked a thing instead
```

**Body**

```
- This was an easy one, not much to say
```

#### Is updated to...

**Title**

```
(feature) We ended up not needing this, tweaked a thing instead [ch56789]
```

**Body**

```
Story details: https://app.clubhouse.io/farmersdog/story/56789

- This was an easy one, not much to say
```
