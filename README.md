# sync-branches-pr

GitHub Action to sync branchs with one source branch. First a new branch is created from source then PR is created between new branch and target branch.
New branch is created so that you can fix conflicts if any cause source branch might be protected in some case.
To work properly delete created branches after merging them.

## Inputs

### `GITHUB_TOKEN`

**Required** The token to be used for creating the pull request. Can be set to the one given for the workflow or another user.

### `SOURCE_BRANCH`

**Required** The branch you want to make the pull request from.

### `TARGET_BRANCH_STARTS_WITH`

**Required** The branchs you want to make the pull request to.

## Outputs

### `PULL_REQUEST_URL`

Set to the URL of either the pull request that was opened by this action or the one that was found to already be open between the two branches.

### `PULL_REQUEST_NUMBER`

Pull request number from generated pull request or the currently open one

### Example

```yml
name: Sync
on:
  push:
    branches:
      - master

jobs:
  sync-branches:
    runs-on: ubuntu-20.04
    name: Syncing branches
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Set up Node
        uses: actions/setup-node@v1
        with:
          node-version: 12
      - name: Sync Branches PR
        uses: monoku/sync-branches-pr@0.0.1
        with:
          GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
          SOURCE_BRANCH: "master"
          TARGET_BRANCH_STARTS_WITH: "feature/"
```

Modified version of action [Create Sync PR](https://github.com/sudoStatus200/create-sync-pr) with support of multiple target branches matching with a given pattern.
