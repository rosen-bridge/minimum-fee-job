# minfee-app

## 1.0.1

### Patch Changes

- Find RSN using it's token Id in redis instead of finding it by it's name

## 1.0.0

### Major Changes

- Shift selected server-side operations to the client with caching and robust error handling to improve performance, responsiveness, and stability

### Minor Changes

- Implement token map fetching from Redis and using the token map instance to retrieve token data

### Patch Changes

- Fix postcss config
- Resolve validation warning caused by Redis-based token map integration
- Update dependencies
  - @rosen-bridge/json-bigint@1.1.0
  - @rosen-bridge/minimum-fee@3.1.2
  - @rosen-bridge/tokens@5.0.0
