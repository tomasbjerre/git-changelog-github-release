# Git Changelog Github Release Action

This is a
[GitHub action](https://docs.github.com/en/actions/creating-actions/about-custom-actions)
that can draft release in GitHub generated from template using
[git-changelog-lib](https://github.com/tomasbjerre/git-changelog-lib).

- You can have it running on your **default branch**, not depending on
  pull-requests.
- Uses **conventional commits** to keep a **draft release** updated and ready to
  be published.
  - It will parse any commit in branch and construct the **draft description**
    from that.
  - It will **adjust the draft version** based on conventional commits.

## Usage

- Create a file, perhaps `.github/workflows/draft-release.yaml`, with content:

```yaml
name: Git Changelog Github Release

on: [workflow_dispatch, workflow_call, push]

jobs:
  build:
    runs-on: 'ubuntu-latest'
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-tags: 'true'
          fetch-depth: '0'
      - name: Setup java
        uses: actions/setup-java@v2
        with:
          distribution: 'zulu'
          java-version: 17
      - uses: tomasbjerre/git-changelog-github-release@main
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} # Needs write permission in Github menu '/settings/actions'
```
