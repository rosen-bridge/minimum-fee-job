# @rosen-bridge/github-client

## Table of contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Usage](#usage)

## Introduction

A client for fetching token maps from GitHub Releases.
It caches releases locally, discovers available networks and versions from asset names, and downloads the token map for a given network and version.

## Installation

npm:

```sh
npm i @rosen-bridge/github-client
```

## Usage

```typescript
import { GithubReleaseClient } from '@rosen-bridge/github-client';

const client = new GithubReleaseClient({
  githubRepo: 'rosen-bridge/tokens',
  githubApiUrl: 'https://api.github.com',
  githubToken: process.env.GITHUB_TOKEN, // optional
});

await client.loadReleases([]);

const networks = client.getNetworks();
const versions = client.getVersions('pandora');
const tokens = await client.getTokenMap('pandora', 'latest');
```
