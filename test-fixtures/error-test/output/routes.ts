import { NoDefault } from "../no-default.route";

export const keys = ['NoDefault'] as const;
export const routes = {
    NoDefault: {
      class: NoDefault,
      path: 'no-default.route',
    },
  };
