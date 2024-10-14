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

Running example [in this repo](.github/workflows/draft-release.yaml) and it references [re-usable workflow](https://github.com/tomasbjerre/.github/blob/master/.github/workflows/draft-release.yaml).

## Triggering release

You may want to trigger a workflow that actually packages the project and deploys a release. Perhaps something like this:

```yaml
name: Release
on:
  release:
    types: [published]
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - name: Determine new version
        id: new_version
        run: |
          NEW_VERSION=$(echo "${GITHUB_REF}" | cut -d "/" -f3)
          echo "new_version=${NEW_VERSION}" >> $GITHUB_OUTPUT
      - name: Publish
        run: echo Whatever command to set version to ${{ steps.new_version.outputs.new_version }} and release it
```
