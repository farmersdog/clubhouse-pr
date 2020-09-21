# ClubHouse Pull Request Github Action

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

Automatically update your Github Pull Request with a Clubhouse title in the format: `(feat) Some Feature [ch123]`.

## Inputs

### `ghToken`

**Required** GITHUB_TOKEN

### `chToken`

**Required** Clubhouse API Token

## Outputs

### `prTitle`

The title of the pull request

## Example usage

Note: This is for use when _opening_ a pull request.

```
on:
  pull_request:
    types: [opened, synchronize]
```

```
uses: actions/clubhouse-pr@v1
with:
  ghToken: ${{ secrets.GITHUB_TOKEN }}
  chToken: ${{ secrets.CLUBHOUSE_API_TOKEN }}
```
