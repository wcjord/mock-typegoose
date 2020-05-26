// import type {
//   prop,
//   arrayProp,
//   mapProp,
//   modelOptions,
// } from "@typegoose/typegoose";

// export var prop: typeof prop = (...args) => {
//   return (target: any, key: string) => {};
// };

// export var arrayProp: typeof arrayProp = (...args) => {
//   return (target: any, key: string) => {};
// };

// export var mapProp: typeof mapProp = (...args) => {
//   return (target: any, key: string) => {};
// };

// export var modelOptions: typeof modelOptions = (...args) => {
//   return (target: any) => {};
// };

export var prop = (...args) => {
  return (target: any, key: string) => {};
};

export var arrayProp = (...args) => {
  return (target: any, key: string) => {};
};

export var mapProp = (...args) => {
  return (target: any, key: string) => {};
};

export var modelOptions = (...args) => {
  return (target: any) => {};
};

export const Severity: any = {
  ALLOW: 0,
  WARN: 1,
  ERROR: 2,
};
