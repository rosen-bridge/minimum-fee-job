import { defineProject, mergeConfig } from 'vitest/config';

// @ts-expect-error – allow importing shared config
import configShared from '../../vitest.shared.ts';

export default mergeConfig(configShared, defineProject({}));
