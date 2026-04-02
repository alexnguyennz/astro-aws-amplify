/**
 * @type {import("astro").MiddlewareResponseHandler}
 */
export function onRequest({ locals, request }, next) {
  // intercept data from a request
  // optionally, modify the properties in `locals`
  locals.title = "Title set by middleware";

  // return a Response or the result of calling `next()`
  return next();
}
