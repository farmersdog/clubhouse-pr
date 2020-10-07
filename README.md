# ClubHouse Pull Request Github Action

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
![Test](https://github.com/farmersdog/clubhouse-pr/workflows/Test/badge.svg)

Automatically update your Github Pull Request with a Clubhouse title in the format: `(feat) Some Feature [ch123]`.

## Inputs

### `ghToken`

**Required** GITHUB_TOKEN

### `chToken`

**Required** Clubhouse API Token

## Outputs

### `prTitle`

The title of the pull request

## Development

Run `yarn tdd` to watch Jest tests as you make your changes.

Run `yarn lint:watch` to watch for ESLint errors/warnings.

## Example usage

Note: This is for use when _opening_/synchronizing a pull request.

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
