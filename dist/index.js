"use strict";
// import type {
//   prop,
//   arrayProp,
//   mapProp,
//   modelOptions,
// } from "@typegoose/typegoose";
Object.defineProperty(exports, "__esModule", { value: true });
// export var prop: typeof prop = (...args) => {
//   return (target: any, key: string) => {};
// };
// export var pangeaArrayProp: typeof arrayProp = (...args) => {
//   return (target: any, key: string) => {};
// };
// export var pangeaMapProp: typeof mapProp = (...args) => {
//   return (target: any, key: string) => {};
// };
// export var pangeaModelOptions: typeof modelOptions = (...args) => {
//   return (target: any) => {};
// };
exports.prop = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return function (target, key) { };
};
exports.arrayProp = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return function (target, key) { };
};
exports.mapProp = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return function (target, key) { };
};
exports.modelOptions = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return function (target) { };
};
exports.PangeaSeverity = {
    ALLOW: 0,
    WARN: 1,
    ERROR: 2,
};
