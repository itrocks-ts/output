[![npm version](https://img.shields.io/npm/v/@itrocks/output?logo=npm)](https://www.npmjs.org/package/@itrocks/output)
[![npm downloads](https://img.shields.io/npm/dm/@itrocks/output)](https://www.npmjs.org/package/@itrocks/output)
[![GitHub](https://img.shields.io/github/last-commit/itrocks-ts/output?color=2dba4e&label=commit&logo=github)](https://github.com/itrocks-ts/output)
[![issues](https://img.shields.io/github/issues/itrocks-ts/output)](https://github.com/itrocks-ts/output/issues)
[![discord](https://img.shields.io/discord/1314141024020467782?color=7289da&label=discord&logo=discord&logoColor=white)](https://25.re/ditr)

# output

Generic action-based object output in HTML and JSON.

*This documentation was written by an artificial intelligence and may contain errors or approximations.
It has not yet been fully reviewed by a human. If anything seems unclear or incomplete,
please feel free to contact the author of this package.*

## Installation

```bash
npm i @itrocks/output
```

In most projects you will also install the surrounding framework pieces,
for example `@itrocks/framework` and `@itrocks/action-pack`, which take
care of wiring routes, storage, and HTTP handling.

## Usage

`@itrocks/output` provides a single action class, `Output<T>`, that is
responsible for **rendering the detailed view of one business object**
in HTML or JSON.

You typically do not instantiate `Output` manually. Instead, it is
registered as an action in your routes configuration and invoked by the
framework when a request targets the `/output` route.

The class:

- extends `Action<T>` from `@itrocks/action`,
- is decorated with `@Route('/output')`,
- declares a `@Need('object', 'new')` requirement: it expects the
  current object (or its type) to be available in the request.

### Minimal example: wire the generic output view

```ts
// package.json
// {
//   "dependencies": {
//     "@itrocks/action-pack": "latest",
//     "@itrocks/framework":  "latest",
//     "@itrocks/output":     "latest"
//   }
// }

// main.ts
import { run }                  from '@itrocks/framework'
import { loadRoutes, routes }   from '@itrocks/route'

import config                   from './config.yaml' assert { type: 'yaml' }

await loadRoutes(routes, config)
await run()
```

```yaml
# config.yaml
routes:
  /output: '@itrocks/output'
```

With this configuration in place, the framework exposes:

- `GET /output` for an HTML representation of the current object
  (through `Output.html()`), and
- `GET /output.json` or an equivalent JSON route for its JSON
  representation (through `Output.json()`).

Exactly how the current object is resolved depends on your application
and the `@itrocks/action` / `@itrocks/storage` integration
(`Request.getObject()`, `Request.getObjects()`, etc.).

### Complete example: object details page

In a CRUD‑style module, `@itrocks/output` is often combined with list
and edit actions to display the details of a single object.

```ts
// domain/user.ts
export class User {
  id    = 0
  name  = ''
  email = ''
}

// actions/user/list-users.ts
import { Action }       from '@itrocks/action'
import { Route }        from '@itrocks/route'
import type { Request } from '@itrocks/action-request'

import { User }         from '../domain/user.js'

@Route('/users')
export class ListUsers extends Action<User> {
  async html(request: Request<User>) {
    const users = await request.getObjects()
    // return an HtmlResponse listing all users with links to /output
  }
}

// actions/user/output-user.ts (uses the generic Output action)
import { Output }       from '@itrocks/output'
import { Route }        from '@itrocks/route'

import { User }         from '../domain/user.js'

@Route('/users/output')
export class OutputUser extends Output<User> {}
```

```yaml
# config.yaml (excerpt)
routes:
  /users:         './actions/user/list-users.js'
  /users/output:  './actions/user/output-user.js'
```

```ts
// Now:
// - GET /users          -> list of users
// - GET /users/output   -> HTML details for one user
// - GET /users/output…  -> optional JSON representation, depending on
//                          how your routes are exposed
```

In this pattern, `OutputUser` does not re‑implement any logic:

- the HTML view is provided by `@itrocks/output` via its embedded
  template (`output.html`),
- the JSON representation is built by `Output.json()` depending on how
  many objects are currently selected.

## API

### `class Output<T extends object = object> extends Action<T>`

Generic action used to **display one or more objects**.

The actual object(s) to render are obtained from the request, typically
through `Request.getObject()` / `Request.getObjects()` and your
configured data source.

The class is decorated with:

- `@Need('object', 'new')` – declares that the action needs an object
  (or, in some contexts, its type) to operate.
- `@Route('/output')` – default route registered by the
  `config.yaml` provided in this package.

You normally extend `Output<T>` rather than calling its methods
directly. The methods are invoked by the framework when building an
HTTP response.

#### `html(request: Request<T>): Promise<HtmlResponse>`

Renders a single object in HTML using the built‑in `output.html`
template.

**Resolution of the object**

Internally, this method calls `request.getObject()` (satisfying the
`@Need('object')` constraint). The surrounding framework is responsible
for mapping the incoming URL and parameters to the corresponding domain
object.

**Actions toolbar**

`Output.html()` also looks up all actions available for the current
object and adds them to the view, so that the user can navigate (edit,
delete, etc.) from the details page. This is done via
`getActions(object, 'output')` from `@itrocks/action`.

**Return value**

- `Promise<HtmlResponse>` – an HTML response that your HTTP layer can
  send directly to the client.

#### `json(request: Request<T>): Promise<JsonResponse>`

Builds a JSON representation of the current selection of objects.

Depending on how many objects are available in the request, it behaves
as follows:

1. If exactly **one object** is selected, `json()` returns that single
   object as JSON.
2. If **multiple objects** are selected, `json()` returns an array of
   those objects.
3. If **no object** is explicitly selected, `json()` falls back to a
   search in the configured data source (`dataSource().search()`), based
   on the request type, and returns the result as JSON.

This makes `Output.json()` suitable both for detailed views and for
simple API‑style endpoints.

**Return value**

- `Promise<JsonResponse>` – a JSON response wrapping one object, a
  collection, or the search result.

## Typical use cases

- **Object details page** – display the full details of an entity
  selected from a list (for example, clicking on a user in `/users`
  leads to `/users/output`).
- **Generic "show" action in a CRUD module** – reuse the same
  `Output<T>` logic for multiple entity types by extending the class in
  each action pack.
- **Read‑only JSON endpoint** – expose structured JSON data for one or
  multiple objects without writing custom serialization logic.
- **Fallback listing in JSON** – when no object is selected,
  `Output.json()` can return the result of a search, providing a quick
  API listing endpoint.
- **Toolbars for object actions** – use the built‑in action lookup to
  present the user with a context‑aware toolbar (edit, delete, custom
  actions) on the object details page.
