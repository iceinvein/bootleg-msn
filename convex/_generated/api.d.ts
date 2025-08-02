/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as authVerification from "../authVerification.js";
import type * as contacts from "../contacts.js";
import type * as deployment from "../deployment.js";
import type * as emailVerification from "../emailVerification.js";
import type * as files from "../files.js";
import type * as groups from "../groups.js";
import type * as http from "../http.js";
import type * as messages from "../messages.js";
import type * as router from "../router.js";
import type * as userStatus from "../userStatus.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  authVerification: typeof authVerification;
  contacts: typeof contacts;
  deployment: typeof deployment;
  emailVerification: typeof emailVerification;
  files: typeof files;
  groups: typeof groups;
  http: typeof http;
  messages: typeof messages;
  router: typeof router;
  userStatus: typeof userStatus;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
