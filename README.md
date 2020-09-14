# ClubHouse Pull Request Github Action

Insert description here, Rae.

## Inputs

### `ghToken`

**Required** GITHUB_TOKEN

## Outputs

### `pr-title`

The title of the pull request

## Example usage

Note: This is for use when *opening* or *synchronizing* a pull request.

```
on:
  pull_request:
    types: [opened, synchronize]
```

```
uses: actions/clubhouse-pr@v1
with:
  ghToken: ${{ secrets.GITHUB_TOKEN }}
```
