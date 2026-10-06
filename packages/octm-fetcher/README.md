# @rosen-bridge/octm-fetcher

## Table of contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Usage](#usage)

## Introduction

A small toolkit for fetching Rosen Token Map (OCTM) boxes from the Ergo node and turning them into a token map.

It exposes:

- a shared Ergo node client (`initNodeClient` / `getNodeClient`)
- `getAddressUnspentBoxes(address)` to fetch all unspent boxes for an address (paginated)
- `getOctmBoxes(address, octmNft)` to filter boxes that hold the OCTM NFT
- `boxesToTokenMap(boxes)` to parse the OCTM boxes into a Rosen token map

## Installation

npm:

```sh
npm i @rosen-bridge/octm-fetcher
```

yarn:

```sh
yarn add @rosen-bridge/octm-fetcher
```

## Usage

```typescript
import {
  initNodeClient,
  getOctmBoxes,
  boxesToTokenMap,
} from '@rosen-bridge/octm-fetcher';

const OCTM_ADDRESS = '9ht4xYLN1URUZoKCr3UnZ9cqkopkdSVdysk44XXnZhmtDABPYoh';
const OCTM_NFT =
  'abca6f36234820fc95b244a72c7287ebbfc681c5925b2dd149646247ec1f37c4';

initNodeClient('https://node.ergopool.io');

const boxes = await getOctmBoxes(OCTM_ADDRESS, OCTM_NFT);
const tokenMap = await boxesToTokenMap(boxes);
```
