---
title: Limitations
description: Limitations
---

## Static or prerendered pages

Static or prerendered pages (that are defined with `export const prerender = true` or default for hybrid) will need a rewrite rule.

For example, if you have a static `/about` page, create a rewrite of:

```
/about/ /about/index.html 200 (Rewrite)
```

If you don't use [trailing slashes](https://docs.astro.build/en/reference/configuration-reference/#trailingslash), you will need to also add:

```
/about /about/index.html 200 (Rewrite)
```

For static dynamic routes, like a route of `/blog/[slug].astro`, create a rewrite of:

```
/blog/<slug>/ /blog/<slug>/index.html 200 (Rewrite)
```


### Base path rewrites

```
/base/about/ /base/about/index.html 200 (Rewrite)
```

## 404 Pages
Custom 404 pages (like `404.astro`) need to be server-side rendered (not prerendered) to work. This is a [limitation with Amplify](https://docs.aws.amazon.com/amplify/latest/userguide/ssr-deployment-specification.html#catchall-fallback-routing).

## Static files without extensions
Due to [limitations with Amplify routing](https://docs.aws.amazon.com/amplify/latest/userguide/ssr-deployment-specification.html#catchall-fallback-routing), to serve `public` files without extensions, place them in a folder called `assets` (`/public/assets/`) and reference them with `/assets/filename`:

```sh title="/public/assets/"
somefile
```

Any other static files with extensions will work as usual.
