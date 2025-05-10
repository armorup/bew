# Project Context
Learning Elysia and Svelte by following the Elysia tutorial for creating a note app from https://elysiajs.com/tutorial.html.
<!-- Multiplayer story game with realtime voting. Svelte 5 frontend, Elysia backend. 

## Key Requirements
1. Real-time sync for player votes/story progression
2. Branching narrative structure with persistent state
3. Round-based flow with timed voting phases
4. Clean Svelte 5 components using Runes
5. Optimized Hono endpoints for game actions
6. WebSocket implementation for live updates -->

<SYSTEM>This is the abridged developer documentation for Svelte and SvelteKit.</SYSTEM>

# Svelte documentation

## Svelte

You **MUST** use the Svelte 5 API unless explicitly tasked to write Svelte 4 syntax. If you don't know about the API yet, below is the most important information about it. Other syntax not explicitly listed like `{#if ...}` blocks stay the same, so you can reuse your Svelte 4 knowledge for these.

- to mark something a state you use the `$state` rune, e.g. instead of `let count = 0` you do `let count = $state(0)`
- to mark something as a derivation you use the `$derived` rune, e.g. instead of `$: double = count * 2` you do `const double = $derived(count * 2)`
- to create a side effect you use the `$effect` rune, e.g. instead of `$: console.log(double)`you do`$effect(() => console.log(double))`
- to create component props you use the `$props` rune, e.g. instead of `export let foo = true; export let bar;` you do `let { foo = true, bar } = $props();`
- when listening to dom events do not use colons as part of the event name anymore, e.g. instead of `<button on:click={...} />` you do `<button onclick={...} />`

### What are runes?

- Runes are built-in Svelte keywords (prefixed with `$`) that control the compiler. For example, you write `let message = $state('hello');` in a `.svelte` file.
- Do **NOT** treat runes like regular functions or import them; instead, use them as language keywords.  
  _In Svelte 4, this syntax did not exist—you relied on reactive declarations and stores; now runes are an integral part of the language._

### $state

- `$state` creates reactive variables that update the UI automatically. For example:
  ```svelte
  <script>
    let count = $state(0);
  </script>
  <button onclick={() => count++}>Clicked: {count}</button>
  ```
- Do **NOT** complicate state management by wrapping it in custom objects; instead, update reactive variables directly.  
  _In Svelte 4, you created state with let, e.g. `let count = 0;`, now use the $state rune, e.g. `let count = $state(0);`._
- Arrays and objects become deeply reactive proxies. For example:
  ```js
  let todos = $state([{ done: false, text: 'add more todos' }]);
  todos[0].done = !todos[0].done;
  ```
- Do **NOT** destructure reactive proxies (e.g., `let { done } = todos[0];`), as this breaks reactivity; instead, access properties directly.
- Use `$state` in class fields for reactive properties. For example:
  ```js
  class Todo {
  	done = $state(false);
  	text = $state('');
  	reset = () => {
  		this.text = '';
  		this.done = false;
  	};
  }
  ```

### $state.raw

- `$state.raw` creates shallow state where mutations are not tracked. For example:

```js
let person = $state.raw({ name: 'Heraclitus', age: 49 });
// Instead of mutating:
// person.age += 1;  // NO effect
person = { name: 'Heraclitus', age: 50 }; // Correct way to update
```

- Do **NOT** attempt to mutate properties on raw state; instead, reassign the entire object to trigger updates.

### $state.snapshot

- `$state.snapshot` produces a plain object copy of reactive state. For example:

```svelte
<script>
  let counter = $state({ count: 0 });
  function logSnapshot() {
    console.log($state.snapshot(counter));
  }
</script>
```

- **ONLY** use this if you are told there's a problem with passing reactive proxies to external APIs.

### Passing state into functions

- Pass-by-Value Semantics: Use getter functions to ensure functions access the current value of reactive state. For example:
  ```js
  function add(getA, getB) {
  	return () => getA() + getB();
  }
  let a = 1,
  	b = 2;
  let total = add(
  	() => a,
  	() => b
  );
  console.log(total());
  ```
- Do **NOT** assume that passing a reactive state variable directly maintains live updates; instead, pass getter functions.  
  _In Svelte 4, you often used stores with subscribe methods; now prefer getter functions with `$state` / `$derived` instead._

### $derived

- `$derived` computes reactive values based on dependencies. For example:

```svelte
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>
<button onclick={() => count++}>{doubled}</button>
```

- Do **NOT** introduce side effects in derived expressions; instead, keep them pure.  
  _In Svelte 4 you used `$:` for this, e.g. `$: doubled = count * 2;`, now use the $derived rune instead, e.g `let doubled = $derived(count * 2);`._

#### $derived.by

- Use `$derived.by` for multi-line or complex logic. For example:

```svelte
<script>
  let numbers = $state([1, 2, 3]);
  let total = $derived.by(() => {
    let sum = 0;
    for (const n of numbers) sum += n;
    return sum;
  });
</script>
```

- Do **NOT** force complex logic into a single expression; instead, use `$derived.by` to keep code clear.

#### Overriding derived values

- You can reassign a derived value for features like optimistic UI. It will go back to the `$derived` value once an update in its dependencies happen. For example:

```svelte
<script>
  let post = $props().post;
  let likes = $derived(post.likes);
  async function onclick() {
    likes += 1;
    try { await post.like(); } catch { likes -= 1; }
  }
</script>
```

- Do **NOT** try to override derived state via effects; instead, reassign directly when needed.  
  _In Svelte 4 you could use `$:` for that, e.g. `$: likes = post.likes; likes = 1`, now use the `$derived` instead, e.g. `let likes = $derived(post.likes); likes = 1;`._

### $effect

- `$effect` executes functions when reactive state changes. For example:

```svelte
<script>
  let size = $state(50);
  $effect(() => {
    console.log('Size changed:', size);
  });
</script>
```

- Do **NOT** use `$effect` for state synchronization; instead, use it only for side effects like logging or DOM manipulation.  
  _In Svelte 4, you used reactive statements (`$:`) for similar tasks, .e.g `$: console.log(size)`; now use the `$effect` rune instead, e.g. `$effect(() => console.log(size))` ._

#### Understanding lifecycle (for $effect)

- Effects run after the DOM updates and can return teardown functions. For example:

```svelte
<script>
  let count = $state(0);
  $effect(() => {
    const interval = setInterval(() => { count += 1; }, 1000);
    return () => clearInterval(interval);
  });
</script>
```

- **Directive:** Do **NOT** ignore cleanup; instead, always return a teardown function when needed.

#### $effect.pre

- `$effect.pre` works like `$effect` with the only difference that it runs before the DOM updates. For example:

```svelte
<script>
  let div = $state();
  $effect.pre(() => {
    if (div) console.log('Running before DOM update');
  });
</script>
```

- Do **NOT** use `$effect.pre` for standard post-update tasks; instead, reserve it for pre-DOM manipulation like autoscrolling.

#### $effect.tracking

- `$effect.tracking` indicates if code is running inside a reactive context. For example:

```svelte
<script>
  $effect(() => {
    console.log('Inside effect, tracking:', $effect.tracking());
  });
</script>
```

- Do **NOT** misuse tracking information outside its intended debugging context; instead, use it to enhance reactive debugging.  
  _In Svelte 4, no equivalent existed; now this feature offers greater insight into reactivity._

#### $effect.root

- `$effect.root` creates a non-tracked scope for nested effects with manual cleanup. For example:

```svelte
<script>
  let count = $state(0);
  const cleanup = $effect.root(() => {
    $effect(() => {
      console.log('Count is:', count);
    });
    return () => console.log('Root effect cleaned up');
  });
</script>
```

- Do **NOT** expect root effects to auto-cleanup; instead, manage their teardown manually.  
  _In Svelte 4, manual cleanup required explicit lifecycle hooks; now `$effect.root` centralizes this control._

### $props

- Use `$props` to access component inputs. For example:

```svelte
<script>
  let { adjective } = $props();
</script>
<p>This component is {adjective}</p>
```

- Do **NOT** mutate props directly; instead, use callbacks or bindable props to communicate changes.  
  _In Svelte 4, props were declared with `export let foo`; now you use `$props` rune, e.g. `let { foo } = $props()`._
- Declare fallback values via destructuring. For example:

```js
let { adjective = 'happy' } = $props();
```

- Rename props to avoid reserved keywords. For example:

```js
let { super: trouper } = $props();
```

- Use rest syntax to collect all remaining props. For example:

```js
let { a, b, ...others } = $props();
```

#### $props.id()

- Generate a unique ID for the component instance. For example:

```svelte
<script>
  const uid = $props.id();
</script>
<label for="{uid}-firstname">First Name:</label>
<input id="{uid}-firstname" type="text" />
```

- Do **NOT** manually generate or guess IDs; instead, rely on `$props.id()` for consistency.

### $bindable

- Mark props as bindable to allow two-way data flow. For example, in `FancyInput.svelte`:

```svelte
<script>
  let { value = $bindable() } = $props();
</script>
<input bind:value={value} />
```

- Do **NOT** overuse bindable props; instead, default to one-way data flow unless bi-directionality is truly needed.  
  _In Svelte 4, all props were implicitly bindable; in Svelte 5 `$bindable` makes this explicit._

### $host

- Only available inside custom elements. Access the host element for custom event dispatching. For example:

```svelte
<script>
  function dispatch(type) {
    $host().dispatchEvent(new CustomEvent(type));
  }
</script>
<button onclick={() => dispatch('increment')}>Increment</button>
```

- Do **NOT** use this unless you are explicitly tasked to create a custom element using Svelte components

### {#snippet ...}

- **Definition & Usage:**  
  Snippets allow you to define reusable chunks of markup with parameters inside your component.  
  _Example:_
  ```svelte
  {#snippet figure(image)}
    <figure>
      <img src={image.src} alt={image.caption} width={image.width} height={image.height} />
      <figcaption>{image.caption}</figcaption>
    </figure>
  {/snippet}
  ```
- **Parameterization:**  
  Snippets accept multiple parameters with optional defaults and destructuring, but rest parameters are not allowed.  
  _Example with parameters:_
  ```svelte
  {#snippet name(param1, param2)}
    <!-- snippet markup here -->
  {/snippet}
  ```

### Snippet scope

- **Lexical Visibility:**  
  Snippets can be declared anywhere and reference variables from their outer lexical scope, including script or block-level declarations.  
  _Example:_
  ```svelte
  <script>
    let { message = "it's great to see you!" } = $props();
  </script>
  {#snippet hello(name)}
    <p>hello {name}! {message}!</p>
  {/snippet}
  {@render hello('alice')}
  ```
- **Scope Limitations:**  
  Snippets are only accessible within their lexical scope; siblings and child blocks share scope, but nested snippets cannot be rendered outside.  
  _Usage caution:_ Do **NOT** attempt to render a snippet outside its declared scope.

### Passing snippets to components

- **As Props:**  
  Within a template, snippets are first-class values that can be passed to components as props.  
  _Example:_
  ```svelte
  <script>
    import Table from './Table.svelte';
    const fruits = [
      { name: 'apples', qty: 5, price: 2 },
      { name: 'bananas', qty: 10, price: 1 }
    ];
  </script>
  {#snippet header()}
    <th>fruit</th>
    <th>qty</th>
    <th>price</th>
    <th>total</th>
  {/snippet}
  {#snippet row(d)}
    <td>{d.name}</td>
    <td>{d.qty}</td>
    <td>{d.price}</td>
    <td>{d.qty * d.price}</td>
  {/snippet}
  <Table data={fruits} {header} {row} />
  ```
- **Slot-like Behavior:**  
  Snippets declared inside component tags become implicit props (akin to slots) for the component.  
  _Svelte 4 used slots for this, e.g. `<Component><p slot="x" let:y>hi {y}</p></Component>`; now use snippets instead, e.g. `<Component>{#snippet x(y)}<p>hi {y}</p>{/snippet}</Component>`._
- **Content Fallback:**  
  Content not wrapped in a snippet declaration becomes the `children` snippet, rendering as fallback content.  
  _Example:_
  ```svelte
  <!-- App.svelte -->
  <Button>click me</Button>
  <!-- Button.svelte -->
  <script>
    let { children } = $props();
  </script>
  <button>{@render children()}</button>
  ```

### Typing snippets

- Snippets implement the `Snippet` interface, enabling strict type checking in TypeScript or JSDoc.  
  _Example:_

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  interface Props {
    data: any[];
    children: Snippet;
    row: Snippet<[any]>;
  }
  let { data, children, row }: Props = $props();
</script>
```

### {@render ...}

- Use the {@render ...} tag to invoke and render a snippet, passing parameters as needed.  
  _Example:_
  ```svelte
  {#snippet sum(a, b)}
    <p>{a} + {b} = {a + b}</p>
  {/snippet}
  {@render sum(1, 2)}
  ```
- Do **NOT** call snippets without parentheses when parameters are required; instead, always invoke the snippet correctly.  
  _In Svelte 4, you used slots for this, e.g. `<slot name="sum" {a} {b} />`; now use `{@render}` instead, e.g. `{@render sum(a,b)}`._

### <svelte:boundary>

- Use error boundary tags to prevent rendering errors in a section from crashing the whole app.
  _Example:_

  ```svelte
  <svelte:boundary onerror={(error, reset) => console.error(error)}>
    <FlakyComponent />
  </svelte:boundary>
  ```

- **Failed Snippet for Fallback UI:**  
  Providing a `failed` snippet renders fallback content when an error occurs and supplies a `reset` function.  
  _Example:_

  ```svelte
  <svelte:boundary>
    <FlakyComponent />
    {#snippet failed(error, reset)}
      <button onclick={reset}>Oops! Try again</button>
    {/snippet}
  </svelte:boundary>
  ```

### class

- Svelte 5 allows objects for conditional class assignment using truthy keys. It closely follows the `clsx` syntax  
  _Example:_

```svelte
<script>
  let { cool } = $props();
</script>
<div class={{ cool, lame: !cool }}>Content</div>
```


# SvelteKit documentation

## Project types

SvelteKit supports all rendering modes: SPA, SSR, SSG, and you can mix them within one project.

## Setup

Scaffold a new SvelteKit project using `npx sv create` then follow the instructions. Do NOT use `npm create svelte` anymore, this command is deprecated.

A SvelteKit project needs a `package.json` with the following contents at minimum:

```json
{
	"devDependencies": {
		"@sveltejs/adapter-auto": "^6.0.0",
		"@sveltejs/kit": "^2.0.0",
		"@sveltejs/vite-plugin-svelte": "^5.0.0",
		"svelte": "^5.0.0",
		"vite": "^6.0.0"
	}
}
```

Do NOT put any of the `devDependencies` listed above into `dependencies`, keep them all in `devDependencies`.

It also needs a `vite.config.js` with the following at minimum:

```js
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()]
});
```

It also needs a `svelte.config.js` with the following at minimum:

```js
import adapter from '@sveltejs/adapter-auto';

export default {
	kit: {
		adapter: adapter()
	}
};
```

## Project structure

- **`src/` directory:**
  - `lib/` for shared code (`$lib`), `lib/server/` for server‑only modules (`$lib/server`), `params/` for matchers, `routes/` for your pages/components, plus `app.html`, `error.html`, `hooks.client.js`, `hooks.server.js`, and `service-worker.js`.
  - Do **NOT** import server‑only code into client files
- **Top‑level assets & configs:**
  - `static/` for public assets; `tests/` (if using Playwright); config files: `package.json` (with `@sveltejs/kit`, `svelte`, `vite` as devDeps), `svelte.config.js`, `tsconfig.json` (or `jsconfig.json`, extending `.svelte-kit/tsconfig.json`), and `vite.config.js`.
  - Do **NOT** forget `"type": "module"` in `package.json` if using ESM.
- **Build artifacts:**
  - `.svelte-kit/` is auto‑generated and safe to ignore or delete; it will be recreated on `dev`/`build`.
  - Do **NOT** commit `.svelte-kit/` to version control.

## Routing

- **Filesystem router:** `src/routes` maps directories to URL paths: Everything with a `+page.svelte` file inside it becomes a visitable URL, e.g. `src/routes/hello/+page.svelte` becomes `/hello`. `[param]` folders define dynamic segments. Do NOT use other file system router conventions, e.g. `src/routes/hello.svelte` does NOT become available als URL `/hello`
- **Route files:** Prefix with `+`: all run server‑side; only non‑`+server` run client‑side; `+layout`/`+error` apply recursively.
- **Best practice:** Do **not** hard‑code routes in code; instead rely on the filesystem convention.

### +page.svelte

- Defines UI for a route, SSR on first load and CSR thereafter
- Do **not** fetch data inside the component; instead use a `+page.js` or `+page.server.js` `load` function; access its return value through `data` prop via `let { data } = $props()` (typed with `PageProps`).

```svelte
<script lang="ts">
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
</script>
<h1>{data.title}</h1>
```

### +page.js

- Load data for pages via `export function load({ params })` (typed `PageLoad`), return value is put into `data` prop in component
- Can export `prerender`, `ssr`, and `csr` consts here to influence how page is rendered.
- Do **not** include private logic (DB or env vars), can **not** export `actions` from here; if needed, use `+page.server.js`.

```js
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
  return {
    title: 'Hello world!',
  };
}
```

### +page.server.js

- `export async function load(...)` (typed `PageServerLoad`) to access databases or private env; return serializable data.
- Can also export `actions` for `<form>` handling on the server.

### +error.svelte

- Add `+error.svelte` in a route folder to render an error page, can use `page.status` and `page.error.message` from `$app/state`.
- SvelteKit walks up routes to find the closest boundary; falls back to `src/error.html` if none.

### +layout.svelte

- Place persistent elements (nav, footer) and include `{@render children()}` to render page content. Example:

```svelte
<script>
    import { LayoutProps } from './$types';
    let { children, data } = $props();
</script>

<p>Some Content that is shared for all pages below this layout</p>
<!-- child layouts/page goes here -->
{@render children()}
```

- Create subdirectory `+layout.svelte` to scope UI to nested routes, inheriting parent layouts.
- Use layouts to avoid repeating common markup; do **not** duplicate UI in every `+page.svelte`.

### +layout.js / +layout.server.js

- In `+layout.js` or `+layout.server.js` export `load()` (typed `LayoutLoad`) to supply `data` to the layout and its children; set `prerender`, `ssr`, `csr`.
- Use `+layout.server.js` (typed `LayoutServerLoad`) for server-only things like DB or env access.
- Do **not** perform server‑only operations in `+layout.js`; use the server variant.

```js
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = () => {
	return {
		sections: [
			{ slug: 'profile', title: 'Profile' },
			{ slug: 'notifications', title: 'Notifications' }
		]
	};
}
```

### +server.js (Endpoints)

- Export HTTP handlers (`GET`, `POST`, etc.) in `+server.js` under `src/routes`; receive `RequestEvent`, return `Response` or use `json()`, `error()`, `redirect()` (exported from `@sveltejs/kit`).
- export `fallback` to catch all other methods.

```js
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	return new Response('hello world');
}
```

### $types

- SvelteKit creates `$types.d.ts` with `PageProps`, `LayoutProps`, `RequestHandler`, `PageLoad`, etc., for type‑safe props and loaders.
- Use them inside `+page.svelte`/`+page.server.js`/`+page.js`/`+layout.svelte`/`+layout.server.js`/`+layout.js` by importing from `./$types`

### Other files

- Any non‑`+` files in route folders are ignored by the router, use this to your advantage to colocate utilities or components.
- For cross‑route imports, place modules under `src/lib` and import via `$lib`.

## Loading data

### Page data

- `+page.js` exports a `load` (`PageLoad`) whose returned object is available in `+page.svelte` via `let { data } = $props()` (e.g. when you do `return { foo }` from `load` it is available within `let { data } = $props()` in `+page.svelte` as `data.foo`)
- Universal loads run on SSR and CSR; private or DB‑backed loads belong in `+page.server.js` (`PageServerLoad`) and must return devalue‑serializable data.

Example:

```js
// file: src/routes/foo/+page.js
export async function load({ fetch }) {
	const result = await fetch('/data/from/somewhere').then((r) => r.json());
	return { result }; // return property "result"
}
```

```svelte
<!-- file: src/routes/foo/+page.svelte -->
<script>
  // "data" prop contains property "result"
  let { data } = $props();
</script>
{data.result}
```

### Layout data

- `+layout.js` or `+layout.server.js` exports a `load` (`LayoutLoad`/`LayoutServerLoad`)
- Layout data flows downward: child layouts and pages see parent data in their `data` prop.
- Data loading flow (interaction of load function and props) works the same as for `+page(.server).js/svelte`

### page.data

- The `page` object from `$app/state` gives access to all data from `load` functions via `page.data`, usable in any layout or page.
- Ideal for things like `<svelte:head><title>{page.data.title}</title></svelte:head>`.
- Types come from `App.PageData`
- earlier Svelte versions used `$app/stores` for the same concepts, do NOT use `$app/stores` anymore unless prompted to do so

### Universal vs. server loads

- Universal (`+*.js`) run on server first, then in browser; server (`+*.server.js`) always run server‑side and can use secrets, cookies, DB, etc.
- Both receive `params`, `route`, `url`, `fetch`, `setHeaders`, `parent`, `depends`; server loads additionally get `cookies`, `locals`, `platform`, `request`.
- Use server loads for private data or non‑serializable items; universal loads for public APIs or returning complex values (like constructors).

### Load function arguments

- `url` is a `URL` object (no `hash` server‑side); `route.id` shows the route pattern; `params` map path segments to values.
- Query parameters via `url.searchParams` trigger reruns when they change.
- Use these to branch logic and fetch appropriate data in `load`.

## Making Fetch Requests

Use the provided `fetch` function for enhanced features:

```js
// src/routes/items/[id]/+page.js
export async function load({ fetch, params }) {
	const res = await fetch(`/api/items/${params.id}`);
	const item = await res.json();
	return { item };
}
```

## Headers and Cookies

Set response headers using `setHeaders`:

```js
export async function load({ fetch, setHeaders }) {
	const response = await fetch(url);

	setHeaders({
		age: response.headers.get('age'),
		'cache-control': response.headers.get('cache-control')
	});

	return response.json();
}
```

Access cookies in server load functions using `cookies`:

```js
export async function load({ cookies }) {
	const sessionid = cookies.get('sessionid');
	return {
		user: await db.getUser(sessionid)
	};
}
```

Do not set `set-cookie` via `setHeaders`; use `cookies.set()` instead.

## Using Parent Data

Access data from parent load functions:

```js
export async function load({ parent }) {
	const { a } = await parent();
	return { b: a + 1 };
}
```

## Errors and Redirects

Redirect users using `redirect`:

```js
import { redirect } from '@sveltejs/kit';

export function load({ locals }) {
	if (!locals.user) {
		redirect(307, '/login');
	}
}
```

Throw expected errors using `error`:

```js
import { error } from '@sveltejs/kit';

export function load({ locals }) {
	if (!locals.user) {
		error(401, 'not logged in');
	}
}
```

Unexpected exceptions trigger `handleError` hook and a 500 response.

## Streaming with Promises

Server load functions can stream promises as they resolve:

```js
export async function load({ params }) {
	return {
		comments: loadComments(params.slug),
		post: await loadPost(params.slug)
	};
}
```

```svelte
<h1>{data.post.title}</h1>
<div>{@html data.post.content}</div>

{#await data.comments}
  Loading comments...
{:then comments}
  {#each comments as comment}
    <p>{comment.content}</p>
  {/each}
{:catch error}
  <p>error loading comments: {error.message}</p>
{/await}
```

## Rerunning Load Functions

Load functions rerun when:

- Referenced params or URL properties change
- A parent load function reran and `await parent()` was called
- A dependency was invalidated with `invalidate(url)` or `invalidateAll()`

Manually invalidate load functions:

```js
// In load function
export async function load({ fetch, depends }) {
	depends('app:random');
	// ...
}

// In component
import { invalidate } from '$app/navigation';
function rerunLoadFunction() {
	invalidate('app:random');
}
```

## Dependency Tracking

Exclude from dependency tracking with `untrack`:

```js
export async function load({ untrack, url }) {
	if (untrack(() => url.pathname === '/')) {
		return { message: 'Welcome!' };
	}
}
```

### Implications for authentication

- Layout loads don’t automatically rerun on CSR; guards in `+layout.server.js` require child pages to await the parent.
- To avoid missed auth checks and waterfalls, use hooks like `handle` for global protection or per‑page server loads.

### Using getRequestEvent

- `getRequestEvent()` retrieves the current server `RequestEvent`, letting shared functions (e.g. `requireLogin()`) access `locals`, `url`, etc., without parameter passing.

## Using forms

### Form actions

- A `+page.server.js` can export `export const actions: Actions = { default: async (event) => {…} }`; `<form method="POST">` in `+page.svelte` posts to the default action without any JS. `+page.js` or `+layout.js` or `+layout.server.js` can NOT export `actions`
- Name multiple actions (`login`, `register`) in `actions`, invoke with `action="?/register"` or `button formaction="?/register"`; do NOT use `default` name in this case.
- Each action gets `{ request, cookies, params }`, uses `await request.formData()`, sets cookies or DB state, and returns an object that appears on the page as `form` (typed via `PageProps`).

Example: Define a default action in `+page.server.js`:

```js
// file: src/routes/login/+page.server.js
import type { Actions } from './$types';

export const actions: Actions = {
	default: async (event) => {
		// TODO log the user in
	}
};
```

Use it with a simple form:

```svelte
<!-- file: src/routes/login/+page.svelte -->
<form method="POST">
	<label>
		Email
		<input name="email" type="email">
	</label>
	<label>
		Password
		<input name="password" type="password">
	</label>
	<button>Log in</button>
</form>
```

### Validation errors

- Return `fail(400, { field, error: true })` from an action to send back status and data; display via `form?.field` and repopulate inputs with `value={form?.field ?? ''}`.
- Use `fail` instead of throwing so the nearest `+error.svelte` isn’t invoked and the user can correct their input.
- `fail` payload must be JSON‑serializable.

### Redirects

- In an action, call `redirect(status, location)` to send a 3xx redirect; this throws and bypasses form re-render.
- Client-side, use `goto()` from `$app/navigation` for programmatic redirects.

### Loading data after actions

- After an action completes (unless redirected), SvelteKit reruns `load` functions and re‑renders the page, merging the action’s return value into `form`.
- The `handle` hook runs once before the action; if you modify cookies in your action, you must also update `event.locals` there to keep `load` in sync.
- Do NOT assume `locals` persists automatically; set `event.locals` inside your action when auth state changes.

### Progressive enhancement

- Apply `use:enhance` from `$app/forms` to `<form>` to intercept submissions, prevent full reloads, update `form`, `page.form`, `page.status`, reset the form, invalidate all data, handle redirects, render errors, and restore focus. Do NOT use onsubmit event for progressive enhancement
- To customize, provide a callback that runs before submit and returns a handler; use `update()` for default logic or `applyAction(result)` to apply form data without full invalidation.
- You can also write your own `onsubmit` listener using `fetch`, then `deserialize` the response and `applyAction`/`invalidateAll`; do NOT use `JSON.parse` for action responses.

```svelte
<script>
  import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	let { form } = $props();
</script>

<form method="POST" use:enhance>
	<!-- form content -->
</form>
```

## Page options

#### prerender

- Set `export const prerender = true|false|'auto'` in page or layout modules; `true` generates static HTML, `false` skips, `'auto'` includes in SSR manifest.
- Applies to pages **and** `+server.js` routes (inherit parent flags); dynamic routes need `entries()` or `config.kit.prerender.entries` to tell the crawler which parameter values to use.
- Do NOT prerender pages that use form actions or rely on `url.searchParams` server‑side.

#### entries

- In a dynamic route’s `+page(.server).js` or `+server.js`, export `export function entries(): Array<Record<string,string>>` (can be async) to list parameter sets for prerendering.
- Overrides default crawling to ensure dynamic pages (e.g. `/blog/[slug]`) are generated.
- Do NOT forget to pair `entries()` with `export const prerender = true`.

### ssr

- `export const ssr = false` disables server-side rendering, sending only an HTML shell and turning the page into a client-only SPA.
- Use sparingly (e.g. when using browser‑only globals); do NOT set both `ssr` and `csr` to `false` or nothing will render.

#### csr

- `export const csr = false` prevents hydration, omits JS bundle, disables `<script>`s, form enhancements, client routing, and HMR.
- Ideal for purely static pages (e.g. marketing or blog posts); do NOT disable CSR on pages requiring interactivity.

## State management

- Avoid shared server variables—servers are stateless and shared across users. Authenticate via cookies and persist to a database instead of writing to in‑memory globals.
- Keep `load` functions pure: no side‑effects or global store writes. Return data from `load` and pass it via `data` or `page.data`.
- For shared client‑only state across components, use Svelte’s context API (`setContext`/`getContext`) or URL parameters for persistent filters; snapshots for ephemeral UI state tied to navigation history.

## Building your app

- Build runs in two phases: Vite compiles and prerenders (if enabled), then an adapter tailors output for your deployment target.
- Guard any code that should not execute at build time with `import { building } from '$app/environment'; if (!building) { … }`.
- Preview your production build locally with `npm run preview` (Node‑only, no adapter hooks).

## Adapters

- Adapters transform the built app into deployable assets for various platforms (Cloudflare, Netlify, Node, static, Vercel, plus community adapters).
- Configure in `svelte.config.js` under `kit.adapter = adapter(opts)`, importing the adapter module and passing its options.
- Some adapters expose a `platform` object (e.g. Cloudflare’s `env`); access it via `event.platform` in hooks and server routes.

## Single‑page apps

- Turn your app into a fully CSR SPA by setting `export const ssr = false;` in the root `+layout.js`.
- For static hosting, use `@sveltejs/adapter-static` with a `fallback` HTML (e.g. `200.html`) so client routing can handle unknown paths.
- You can still prerender select pages by enabling `prerender = true` and `ssr = true` in their individual `+page.js` or `+layout.js` modules.

## Advanced routing

- Rest parameters (`[...file]`) capture an unknown number of segments (e.g. `src/routes/hello/[...path]` catches all routes under `/hello`) and expose them as a single string; use a catch‑all route `+error.svelte` to render nested custom 404 pages.
- Optional parameters (`[[lang]]`) make a segment optional, e.g. for `[[lang]]/home` both `/home` and `/en/home` map to the same route; cannot follow a rest parameter.
- Matchers in `src/params/type.js` let you constrain `[param=type]` (e.g. only “apple” or “orange”), falling back to other routes or a 404 if the test fails.

### Advanced layouts

- Group directories `(app)` or `(marketing)` apply a shared layout without affecting URLs.
- Break out of the inherited layout chain per page with `+page@segment.svelte` (e.g. `+page@(app).svelte`) or per layout with `+layout@.svelte`.
- Use grouping judiciously: overuse can complicate nesting; sometimes simple composition or wrapper components suffice.

## Hooks

### Server hooks

- `handle({ event, resolve })`: runs on every request; mutate `event.locals`, bypass routing, or call `resolve(event, { transformPageChunk, filterSerializedResponseHeaders, preload })` to customize HTML, headers, and asset preloading.
- `handleFetch({ event, request, fetch })`: intercepts server‑side `fetch` calls to rewrite URLs, forward cookies on cross‑origin, or route internal requests directly to handlers.
- `init()`: runs once at server startup for async setup (e.g. database connections).

### Shared hooks

- `handleError({ error, event, status, message })`: catches unexpected runtime errors on server or client; log via Sentry or similar, return a safe object (e.g. `{ message: 'Oops', errorId }`) for `$page.error`.

### Universal hooks

- `reroute({ url, fetch? })`: map incoming `url.pathname` to a different route ID (without changing the address bar), optionally async and using `fetch`.
- `transport`: define `encode`/`decode` for custom types (e.g. class instances) to serialize them across server/client boundaries in loads and actions.

## Errors

- Expected errors thrown with `error(status, message|object)` set the response code, render the nearest `+error.svelte` with `page.error`, and let you pass extra props (e.g. `{ code: 'NOT_FOUND' }`).
- Unexpected exceptions invoke the `handleError` hook, are logged internally, and expose a generic `{ message: 'Internal Error' }` to users; customize reporting or user‑safe messages in `handleError`.
- Errors in server handlers or `handle` return JSON or your `src/error.html` fallback based on `Accept` headers; errors in `load` render component boundaries as usual. Type‑safe shapes via a global `App.Error` interface.

## Link options

The following are HTML attributes you can put on any HTML element.

- `data-sveltekit-preload-data="hover"|"tap"` preloads `load` on link hover (`touchstart`) or immediate tap; use `"tap"` for fast‑changing data.
- `data-sveltekit-preload-code="eager"|"viewport"|"hover"|"tap"` preloads JS/CSS aggressively or on scroll/hover/tap to improve load times.
- `data-sveltekit-reload` forces full-page reload; `data-sveltekit-replacestate` uses `replaceState`; `data-sveltekit-keepfocus` retains focus; `data-sveltekit-noscroll` preserves scroll position; disable any by setting the value to `"false"`.

## Server-only modules

- `$env/static/private` and `$env/dynamic/private` can only be imported into server‑only files (`hooks.server.js`, `+page.server.js`); prevents leaking secrets to the client.
- `$app/server` (e.g. the `read()` API) is likewise restricted to server‑side code.
- Make your own modules server‑only by naming them `*.server.js` or placing them in `src/lib/server/`; any public‑facing import chain to these files triggers a build error.

## Shallow routing

- Use `pushState(path, state)` or `replaceState('', state)` from `$app/navigation` to create history entries without full navigation; read/write `page.state` from `$app/state`.
- Ideal for UI like modals: `if (page.state.showModal) <Modal/>` and dismiss with `history.back()`.
- To embed a route’s page component without navigation, preload data with `preloadData(href)` then `pushState`, falling back to `goto`; note SSR and initial load have empty `page.state`, and shallow routing requires JS.

## Images

- Vite’s asset handling inlines small files, adds hashes, and lets you `import logo from '...png'` for use in `<img src={logo}>`.
- Install `@sveltejs/enhanced-img` and add `enhancedImages()` to your Vite config; use `<enhanced:img src="...jpg" alt="…"/>` to auto‑generate `<picture>` tags with AVIF/WebP, responsive `srcset`/`sizes`, and intrinsic dimensions.
- For CMS or dynamic images, leverage a CDN with Svelte libraries like `@unpic/svelte`; always supply high‑resolution originals (2×), specify `sizes` for LCP images, set `fetchpriority="high"`, constrain layout via CSS to avoid CLS, and include meaningful `alt` text.

## Reference docs

### Imports from `@sveltejs/kit`

- **error**: throw an HTTP error and halt request processing

  ```js
  import { error } from '@sveltejs/kit';
  export function load() {
  	error(404, 'Not found');
  }
  ```

- **fail**: return a form action failure without throwing

  ```js
  import { fail } from '@sveltejs/kit';
  export const actions = {
  	default: async ({ request }) => {
  		const data = await request.formData();
  		if (!data.get('name')) return fail(400, { missing: true });
  	}
  };
  ```

- **isActionFailure**: type‑guard for failures from `fail`

  ```js
  import { isActionFailure } from '@sveltejs/kit';
  if (isActionFailure(result)) {
  	/* handle invalid form */
  }
  ```

- **isHttpError**: type‑guard for errors from `error`

  ```js
  import { isHttpError } from '@sveltejs/kit';
  try {
  	/* … */
  } catch (e) {
  	if (isHttpError(e, 404)) console.log('Not found');
  }
  ```

- **isRedirect**: type‑guard for redirects from `redirect`

  ```js
  import { redirect, isRedirect } from '@sveltejs/kit';
  try {
  	redirect(302, '/login');
  } catch (e) {
  	if (isRedirect(e)) console.log('Redirecting');
  }
  ```

- **json**: build a JSON `Response`

  ```js
  import { json } from '@sveltejs/kit';
  export function GET() {
  	return json({ hello: 'world' });
  }
  ```

- **normalizeUrl** _(v2.18+)_: strip internal suffixes/trailing slashes

  ```js
  import { normalizeUrl } from '@sveltejs/kit';
  const { url, denormalize } = normalizeUrl('/foo/__data.json');
  url.pathname; // /foo
  ```

- **redirect**: throw a redirect response

  ```js
  import { redirect } from '@sveltejs/kit';
  export function load() {
  	redirect(303, '/dashboard');
  }
  ```

- **text**: build a plain‑text `Response`

  ```js
  import { text } from '@sveltejs/kit';
  export function GET() {
  	return text('Hello, text!');
  }
  ```

### Imports from `@sveltejs/kit/hooks`

- **sequence**: compose multiple `handle` hooks into one, merging their options

  ```js
  import { sequence } from '@sveltejs/kit/hooks';
  export const handle = sequence(handleOne, handleTwo);
  ```

### Imports from `$app/forms`

- **applyAction**: apply an `ActionResult` to update `page.form` and `page.status`

  ```js
  import { applyAction } from '$app/forms';
  // inside enhance callback:
  await applyAction(result);
  ```

- **deserialize**: parse a serialized form action response back into `ActionResult`

  ```js
  import { deserialize } from '$app/forms';
  const result = deserialize(await response.text());
  ```

- **enhance**: progressively enhance a `<form>` for AJAX submissions

  ```svelte
  <script>
    import { enhance } from '$app/forms';
  </script>
  <form use:enhance on:submit={handle}>
  ```

### Imports from `$app/navigation`

- **afterNavigate**: run code after every client‑side navigation. Needs to be called at component initialization

  ```js
  import { afterNavigate } from '$app/navigation';
  afterNavigate(({ type, to }) => console.log('navigated via', type));
  ```

- **beforeNavigate**: intercept and optionally cancel upcoming navigations. Needs to be called at component initialization

  ```js
  import { beforeNavigate } from '$app/navigation';
  beforeNavigate(({ cancel }) => {
  	if (!confirm('Leave?')) cancel();
  });
  ```

- **disableScrollHandling**: disable automatic scroll resetting after navigation

  ```js
  import { disableScrollHandling } from '$app/navigation';
  disableScrollHandling();
  ```

- **goto**: programmatically navigate within the app

  ```svelte
  <script>
    import { goto } from '$app/navigation';
    function navigate() {
      goto('/dashboard', { replaceState: true });
    }
  </script>
    <button onclick={navigate}>navigate</button>
  ```

- **invalidate**: re‑run `load` functions that depend on a given URL or custom key

  ```js
  import { invalidate } from '$app/navigation';
  await invalidate('/api/posts');
  ```

- **invalidateAll**: re‑run every `load` for the current page

  ```js
  import { invalidateAll } from '$app/navigation';
  await invalidateAll();
  ```

- **onNavigate**: hook invoked immediately before client‑side navigations. Needs to be called at component initialization

  ```js
  import { onNavigate } from '$app/navigation';
  onNavigate(({ to }) => console.log('about to go to', to.url));
  ```

- **preloadCode**: import route modules ahead of navigation (no data fetch)

  ```js
  import { preloadCode } from '$app/navigation';
  await preloadCode('/about');
  ```

- **preloadData**: load both code and data for a route ahead of navigation

  ```js
  import { preloadData } from '$app/navigation';
  const result = await preloadData('/posts/1');
  ```

- **pushState**: create a shallow‑routing history entry with custom state

  ```js
  import { pushState } from '$app/navigation';
  pushState('', { modalOpen: true });
  ```

- **replaceState**: replace the current history entry with new custom state

  ```js
  import { replaceState } from '$app/navigation';
  replaceState('', { modalOpen: false });
  ```

### Imports from `$app/paths`

- **assets**: the absolute URL prefix for static assets (`config.kit.paths.assets`)

  ```js
  import { assets } from '$app/paths';
  console.log(`<img src="${assets}/logo.png">`);
  ```

- **base**: the base path for your app (`config.kit.paths.base`)

  ```svelte
  <a href="{base}/about">About Us</a>
  ```

- **resolveRoute**: interpolate a route ID with parameters to form a pathname

  ```js
  import { resolveRoute } from '$app/paths';
  resolveRoute('/blog/[slug]/[...rest]', {
  	slug: 'hello',
  	rest: '2024/updates'
  });
  // → "/blog/hello/2024/updates"
  ```

### Imports from `$app/server`

- **getRequestEvent** _(v2.20+)_: retrieve the current server `RequestEvent`

  ```js
  import { getRequestEvent } from '$app/server';
  export function load() {
  	const event = getRequestEvent();
  	console.log(event.url);
  }
  ```

- **read** _(v2.4+)_: read a static asset imported by Vite as a `Response`

  ```js
  import { read } from '$app/server';
  import fileUrl from './data.txt';
  const res = read(fileUrl);
  console.log(await res.text());
  ```

- **navigating**: a read‑only object describing any in‑flight navigation (or `null`)

  ```svelte
  <script>
    import { navigating } from '$app/state';
    console.log(navigating.from, navigating.to);
  </script>
  ```

### Imports from `$app/state`

- **page**: read‑only reactive info about the current page (`url`, `params`, `data`, etc.)

  ```svelte
  <script>
    import { page } from '$app/state';
    const path = $derived(page.url.pathname);
  </script>
  {path}
  ```

- **updated**: reactive flag for new app versions; call `updated.check()` to poll immediately

  ```svelte
  <script>
    import { updated } from '$app/state';
    $effect(() => {
      if (updated.current) {
        alert('A new version is available. Refresh?');
      }
    })
  </script>
  ```

### Imports from `$env/dynamic/private`

- **env (dynamic/private)**: runtime private env vars (`process.env…`), not exposed to client

  ```js
  import { env } from '$env/dynamic/private';
  console.log(env.SECRET_API_KEY);
  ```

### Imports from `$env/dynamic/public`

- **env (dynamic/public)**: runtime public env vars (`PUBLIC_…`), safe for client use

  ```js
  import { env } from '$env/dynamic/public';
  console.log(env.PUBLIC_BASE_URL);
  ```

### Imports from `$env/static/private`

- **$env/static/private**: compile‑time private env vars, dead‑code eliminated

  ```js
  import { DATABASE_URL } from '$env/static/private';
  console.log(DATABASE_URL);
  ```

### Imports from `$env/static/public`

- **$env/static/public**: compile‑time public env vars (`PUBLIC_…`), safe on client

  ```js
  import { PUBLIC_WS_ENDPOINT } from '$env/static/public';
  console.log(PUBLIC_WS_ENDPOINT);
  ```

### `$lib` alias

Alias for `src/lib` folder, e.g.

```svelte
<script>
  import Button from '$lib/Button.svelte';
</script>
<Button>Click me</Button>
```

means that there's a component at `src/lib/Button.svelte`.


# Elysia documentation

TITLE: Configuring Global Error Handling in ElysiaJS (TypeScript)
DESCRIPTION: This main application file initializes Elysia, integrates Swagger documentation, and includes the previously defined `user` and `note` plugins using `.use()`. Crucially, it demonstrates global error handling by attaching an `onError` listener that logs errors to the console but specifically ignores 'NOT_FOUND' errors, showing how to intercept and process errors thrown within the application lifecycle.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_44

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'
import { swagger } from '@elysiajs/swagger'

import { note } from './note'
import { user } from './user'

const app = new Elysia()
    .use(swagger())
    .onError(({ error, code }) => { 
        if (code === 'NOT_FOUND') return 

        console.error(error) 
    }) 
    .use(user)
    .use(note)
    .listen(3000)
```

----------------------------------------

TITLE: Accessing Context in ElysiaJS Handlers
DESCRIPTION: Illustrates how to access the context object in an ElysiaJS route handler, which contains request-specific information.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/handler.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
	.get('/', (context) => context.path)
            // ^ This is a context
```

----------------------------------------

TITLE: Path Parameter Handling
DESCRIPTION: Shows how to use dynamic path parameters and rest parameters in routes
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/cheat-sheet.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .get('/id/:id', ({ params: { id } }) => id)
    .get('/rest/*', () => 'Rest')
    .listen(3000)
```

----------------------------------------

TITLE: Basic ElysiaJS Server Setup
DESCRIPTION: Minimal TypeScript code to create an Elysia server with a single GET route.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/quick-start.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const app = new Elysia()
	.get('/', () => 'Hello Elysia')
	.listen(3000)

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
```

----------------------------------------

TITLE: Basic Hello World Server in Elysia
DESCRIPTION: Creates a simple HTTP server that responds with 'Hello World' on the root path
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/cheat-sheet.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .get('/', () => 'Hello World')
    .listen(3000)
```

----------------------------------------

TITLE: Using Eden Treaty Client with Elysia Server (TypeScript)
DESCRIPTION: Demonstrates how to set up an Elysia server with defined types and connect to it from a client using `treaty` from `@elysiajs/eden` for end-to-end type safety, including auto-completion and type-safe error handling.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/overview.md#_snippet_0

LANGUAGE: TypeScript
CODE:
```
// @filename: server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/', 'hi')
    .get('/users', () => 'Skadi')
    .put('/nendoroid/:id', ({ body }) => body, {
        body: t.Object({
            name: t.String(),
            from: t.String()
        })
    })
    .get('/nendoroid/:id/name', () => 'Skadi')
    .listen(3000)

export type App = typeof app

// @filename: index.ts
// ---cut---
import { treaty } from '@elysiajs/eden'
import type { App } from './server'

const app = treaty<App>('localhost:3000')

// @noErrors
app.
//  ^|




// Call [GET] at '/'
const { data } = await app.get()

// Call [PUT] at '/nendoroid/:id'
const { data: nendoroid, error } = await app.nendoroid({ id: 1895 }).put({
    name: 'Skadi',
    from: 'Arknights'
})
```

----------------------------------------

TITLE: Implement Note Service (ElysiaJS)
DESCRIPTION: Defines a complete ElysiaJS service for managing notes, including a Note class for data handling, type definitions, middleware for logging and user authentication, and routes for CRUD operations (GET, PUT, DELETE, PATCH). It demonstrates using plugins (`.use`), decorators (`.decorate`), models (`.model`), lifecycle events (`.onTransform`), and route guards (`.guard`).
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_41

LANGUAGE: TypeScript
CODE:
```
import { Elysia, t } from 'elysia'
import { getUserId, userService } from './user' // [!code ++]

const memo = t.Object({
	data: t.String(),
	author: t.String()
})

type Memo = typeof memo.static

class Note {
    constructor(
		public data: Memo[] = [
			{
				data: 'Moonhalo',
				author: 'saltyaom'
			}
		]
	) {}

    add(note: Memo) {
        this.data.push(note)

        return this.data
    }

    remove(index: number) {
        return this.data.splice(index, 1)
    }

    update(index: number, note: Partial<Memo>) {
        return (this.data[index] = { ...this.data[index], ...note })
    }
}

export const note = new Elysia({ prefix: '/note' })
	.use(userService) // [!code ++]
    .decorate('note', new Note())
    .model({
        memo: t.Omit(memo, ['author'])
    })
    .onTransform(function log({ body, params, path, request: { method } }) {
        console.log(`${method} ${path}`, {
            body,
            params
        })
    })
    .get('/', ({ note }) => note.data)
    .use(getUserId) // [!code ++]
    .put(
        '/',
        ({ note, body: { data }, username }) =>
            note.add({ data, author: username }),
        {
            body: 'memo'
        }
    )
    .get(
        '/:index',
        ({ note, params: { index }, error }) => {
            return note.data[index] ?? error(404, 'Not Found :(')
        },
        {
            params: t.Object({
                index: t.Number()
            })
        }
    )
    .guard({
        params: t.Object({
            index: t.Number()
        })
    })
    .delete('/:index', ({ note, params: { index }, error }) => {
        if (index in note.data) return note.remove(index)

        return error(422)
    })
    .patch(
        '/:index',
        ({ note, params: { index }, body: { data }, error, username }) => {
            if (index in note.data)
                return note.update(index, { data, author: username })

            return error(422)
        },
        {
            isSignIn: true,
            body: 'memo'
        }
    )
```

----------------------------------------

TITLE: Updating Note Service with Memo Schema and Authorization - TypeScript
DESCRIPTION: Defines a `Memo` schema and type using Elysia's `t` for runtime validation and type inference. Updates the `Note` class constructor and methods (`add`, `update`) to manage `Memo` objects. Configures an Elysia instance (`note`) to use the updated `Note` class, define a model based on `Memo`, log requests, and handle routes (`/`, `/:index`) with updated body parsing and authorization logic to include the author.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_38

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

const memo = t.Object({
	data: t.String(),
	author: t.String()
})

type Memo = typeof memo.static

class Note {
    constructor(
		public data: Memo[] = [
			{
				data: 'Moonhalo',
				author: 'saltyaom'
			}
		]
	) {}

    add(note: Memo) {
        this.data.push(note)

        return this.data
    }

    remove(index: number) {
        return this.data.splice(index, 1)
    }

    update(index: number, note: Partial<Memo>) {
        return (this.data[index] = { ...this.data[index], ...note })
    }
}

export const note = new Elysia({ prefix: '/note' })
    .decorate('note', new Note())
    .model({
    	memo: t.Omit(memo, ['author'])
    })
    .onTransform(function log({ body, params, path, request: { method } }) {
        console.log(`${method} ${path}`, {
            body,
            params
        })
    })
    .get('/', ({ note }) => note.data)
    .put('/', ({ note, body: { data }, username }) =>
    	note.add({ data, author: username }),
     	{
     		body: 'memo'
      	}
    )
    .guard({
        params: t.Object({
            index: t.Number()
        })
    })
    .get(
        '/:index',
        ({ note, params: { index }, error }) => {
            return note.data[index] ?? error(404, 'Not Found :(')
        }
    )
    .delete(
        '/:index',
        ({ note, params: { index }, error }) => {
            if (index in note.data) return note.remove(index)

            return error(422)
        }
    )
    .patch(
        '/:index',
        ({ note, params: { index }, body: { data }, error, username }) => {
        	if (index in note.data)
         		return note.update(index, { data, author: username }))

            return error(422)
        },
        {
            body: 'memo'
        }
    )
```

----------------------------------------

TITLE: Define User Authentication Schemas with Elysia t
DESCRIPTION: Defines the schema for user authentication, including password requirements, session cookie structure with secrets, and an optional session reference using Elysia's `t` (TypeBox) module.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_57

LANGUAGE: TypeScript
CODE:
```
password: t.String({ minLength: 8 })
        }),
        session: t.Cookie(
            {
                token: t.Number()
            },
            {
                secrets: 'seia'
            }
        ),
        optionalSession: t.Optional(t.Ref('session'))
    })
```

----------------------------------------

TITLE: Type Inference in ElysiaJS
DESCRIPTION: This snippet illustrates type inference in ElysiaJS. It shows how to use inline functions and schema validation to achieve accurate type inference for request bodies.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/key-concept.md#2025-04-23_snippet_4

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

const app = new Elysia()
	.post('/', ({ body }) => body, {
		body: t.Object({
			name: t.String()
		})
	})
```

----------------------------------------

TITLE: Defining Elysia Server and Exporting Type for Eden Treaty (TypeScript)
DESCRIPTION: This snippet defines a basic Elysia server with GET and POST routes, including body validation using `t`. The crucial step for Eden Treaty is exporting the server's type (`App = typeof app`), which provides the necessary type information for client-side type safety.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/treaty/overview.md#_snippet_0

LANGUAGE: typescript
CODE:
```
// server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/hi', () => 'Hi Elysia')
    .get('/id/:id', ({ params: { id } }) => id)
    .post('/mirror', ({ body }) => body, {
        body: t.Object({
            id: t.Number(),
            name: t.String()
        })
    })
    .listen(3000)

export type App = typeof app // [!code ++]
```

----------------------------------------

TITLE: Implementing CRUD Routes in ElysiaJS
DESCRIPTION: This snippet defines a simple Note class to manage an array of strings and creates an Elysia plugin that exposes CRUD operations (GET, PUT, GET by index, DELETE by index, PATCH by index) via HTTP routes. It demonstrates basic route handling, body parsing, parameter extraction, and error handling.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_16

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

class Note {
    constructor(public data: string[] = ['Moonhalo']) {}

    add(note: string) {
        this.data.push(note)

        return this.data
    }

    remove(index: number) {
        return this.data.splice(index, 1)
    }

    update(index: number, note: string) {
        return (this.data[index] = note)
    }
}

export const note = new Elysia()
    .decorate('note', new Note())
    .get('/note', ({ note }) => note.data)
    .put('/note', ({ note, body: { data } }) => note.add(data), {
        body: t.Object({
            data: t.String()
        })
    })
    .get(
        '/note/:index',
        ({ note, params: { index }, error }) => {
            return note.data[index] ?? error(404, 'Not Found :(')
        },
        {
            params: t.Object({
                index: t.Number()
            })
        }
    )
    .delete(
        '/note/:index',
        ({ note, params: { index }, error }) => {
            if (index in note.data) return note.remove(index)

            return error(422)
        },
        {
            params: t.Object({
                index: t.Number()
            })
        }
    )
    .patch(
        '/note/:index',
        ({ note, params: { index }, body: { data }, error }) => {
            if (index in note.data) return note.update(index, data)

            return error(422)
        },
        {
            params: t.Object({
                index: t.Number()
            }),
            body: t.Object({
                data: t.String()
            })
        }
    )
```

----------------------------------------

TITLE: Elysia Reusable User ID Resolver (TypeScript)
DESCRIPTION: Defines an Elysia instance `getUserId` that acts as reusable middleware. It uses a `userService`, applies a guard requiring sign-in and a 'session' cookie, and resolves the authenticated username from the session store based on the cookie value.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_46

LANGUAGE: TypeScript
CODE:
```
export const getUserId = new Elysia()
    .use(userService)
    .guard({
    	isSignIn: true,
        cookie: 'session'
    })
    .resolve(
    	({ store: { session }, cookie: { token } }) => ({
    	   	username: session[token.value]
    	})
    )
    .as('scoped')
```

----------------------------------------

TITLE: Creating a Basic Handler in ElysiaJS
DESCRIPTION: Demonstrates how to create a simple GET route handler in ElysiaJS that returns a 'hello world' response.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/handler.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    // the function `() => 'hello world'` is a handler
    .get('/', () => 'hello world')
    .listen(3000)
```

----------------------------------------

TITLE: Add GET Route in Elysia
DESCRIPTION: Demonstrates how to add a new GET route /hello to the Elysia application instance. The route is defined with a path and a simple string response.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_4

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const app = new Elysia()
    .get('/', () => 'Hello Elysia')
    .get('/hello', 'Do you miss me?') // [!code ++]
    .listen(3000)
```

----------------------------------------

TITLE: Unit Testing with Eden Treaty 2
DESCRIPTION: Demonstrates how to use Eden Treaty 2 for end-to-end type-safe unit testing of Elysia applications without starting a mock server.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-10.md#2025-04-23_snippet_3

LANGUAGE: typescript
CODE:
```
// test/index.test.ts
import { describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import { treaty } from '@elysiajs/eden'

const app = new Elysia().get('/hello', () => 'hi')
const api = treaty(app)

describe('Elysia', () => {
    it('return a response', async () => {
        const { data } = await api.hello.get()

        expect(data).toBe('hi')
    })
})
```

----------------------------------------

TITLE: End-to-End Type Safety with Elysia and Eden
DESCRIPTION: Demonstrates end-to-end type safety between Elysia server and client using @elysiajs/eden. Shows type inference for API calls and response data.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/index.md#2025-04-23_snippet_6

LANGUAGE: typescript
CODE:
```
// @filename: server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .patch(
        '/profile',
        ({ body, error }) => {
            if(body.age < 18)
                return error(400, "Oh no")

            return body
        },
        {
            body: t.Object({
                age: t.Number()
            })
        }
    )
    .listen(80)

export type App = typeof app

// @filename: client.ts
// ---cut---
import { treaty } from '@elysiajs/eden'
import type { App } from './server'

const api = treaty<App>('api.elysiajs.com')

const { data } = await api.profile.patch({
      // ^?
    age: 21
})
```

----------------------------------------

TITLE: Implementing User Service and Authorization Resolver - TypeScript
DESCRIPTION: Defines an Elysia instance (`userService`) for managing user state and sessions, including models for sign-in and session cookies. Implements a `isSignIn` macro for authorization checks based on session tokens. Defines another Elysia instance (`getUserId`) that uses `userService` and a guard to resolve the authenticated user's username from the session token. Defines a `user` Elysia instance that uses `getUserId`.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_39

LANGUAGE: typescript
CODE:
```
// @errors: 2392 2300 2403 2345 2698, 2538
// @filename: user.ts
import { Elysia, t } from 'elysia'

export const userService = new Elysia({ name: 'user/service' })
    .state({
        user: {} as Record<string, string>,
        session: {} as Record<number, string>
    })
    .model({
        signIn: t.Object({
            username: t.String({ minLength: 1 }),
            password: t.String({ minLength: 8 })
        }),
        session: t.Cookie(
            {
                token: t.Number()
            },
            {
                secrets: 'seia'
            }
        ),
        optionalSession: t.Optional(t.Ref('session'))
    })
    .macro({
        isSignIn(enabled: boolean) {
            if (!enabled) return

            return {
            	beforeHandle({ error, cookie: { token }, store: { session } }) {
                    if (!token.value)
                        return error(401, {
                            success: false,
                            message: 'Unauthorized'
                        })

                    const username = session[token.value as unknown as number]

                    if (!username)
                        return error(401, {
                            success: false,
                            message: 'Unauthorized'
                        })
                }
            }
        }
    })

export const getUserId = new Elysia()
    .use(userService)
    .guard({
    	isSignIn: true,
        cookie: 'session'
    })
    .resolve(
    	({ store: { session }, cookie: { token } }) => ({
    	   	username: session[token.value]
    	})
    )
    .as('scoped')

export const user = new Elysia({ prefix: '/user' })
	.use(getUserId)
```

----------------------------------------

TITLE: Creating a Basic Elysia Server
DESCRIPTION: A simple hello world example in Elysia that sets up three routes - a root GET route, a parameterized user route, and a POST route for form submissions.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/at-glance.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .get('/', 'Hello Elysia')
    .get('/user/:id', ({ params: { id }}) => id)
    .post('/form', ({ body }) => body)
    .listen(3000)
```

----------------------------------------

TITLE: Defining User Service and Routes in Elysia (TypeScript)
DESCRIPTION: Creates an Elysia service (userService) managing user state and sessions. It defines models for sign-in and session cookies, including secrets. A macro (isSignIn) is implemented for authentication checks. It also sets up user-related routes (/user) for sign-up, sign-in, sign-out, and profile retrieval, utilizing the service, models, and macro.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_56

LANGUAGE: TypeScript
CODE:
```
import { Elysia, t } from 'elysia'

export const userService = new Elysia({ name: 'user/service' })
    .state({
        user: {} as Record<string, string>,
        session: {} as Record<number, string>
    })
    .model({
        signIn: t.Object({
            username: t.String({ minLength: 1 }),
            password: t.String({ minLength: 8 })
        }),
        session: t.Cookie(
            {
                token: t.Number()
            },
            {
                secrets: 'seia'
            }
        ),
        optionalSession: t.Optional(t.Ref('session'))
    })
    .macro({
        isSignIn(enabled: boolean) {
            if (!enabled) return

            return {
            	beforeHandle({ error, cookie: { token }, store: { session } }) {
                    if (!token.value)
                        return error(401, {
                            success: false,
                            message: 'Unauthorized'
                        })

                    const username = session[token.value as unknown as number]

                    if (!username)
                        return error(401, {
                            success: false,
                            message: 'Unauthorized'
                        })
                }
            }
        }
    })

export const getUserId = new Elysia()
    .use(userService)
    .guard({
    	isSignIn: true,
        cookie: 'session'
    })
    .resolve(({ store: { session }, cookie: { token } }) => ({
        username: session[token.value]
    }))
    .as('scoped')

export const user = new Elysia({ prefix: '/user' })
    .use(userService)
    .put(
        '/sign-up',
        async ({ body: { username, password }, store, error }) => {
            if (store.user[username])
                return error(400, {
                    success: false,
                    message: 'User already exists'
                })

            store.user[username] = await Bun.password.hash(password)

            return {
                success: true,
                message: 'User created'
            }
        },
        {
            body: 'signIn'
        }
    )
    .post(
        '/sign-in',
        async ({
            store: { user, session },
            error,
            body: { username, password },
            cookie: { token }
        }) => {
            if (
                !user[username] ||
                !(await Bun.password.verify(password, user[username]))
            )
                return error(400, {
                    success: false,
                    message: 'Invalid username or password'
                })

            const key = crypto.getRandomValues(new Uint32Array(1))[0]
            session[key] = username
            token.value = key

            return {
                success: true,
                message: `Signed in as ${username}`
            }
        },
        {
            body: 'signIn',
            cookie: 'optionalSession'
        }
    )
    .get(
        '/sign-out',
        ({ cookie: { token } }) => {
            token.remove()

            return {
                success: true,
                message: 'Signed out'
            }
        },
        {
            cookie: 'optionalSession'
        }
    )
    .use(getUserId)
    .get('/profile', ({ username }) => ({
        success: true,
        username
    }))
```

----------------------------------------

TITLE: Applying Scoped Lifecycle Properties in Elysia.js (TypeScript)
DESCRIPTION: This snippet demonstrates how to explicitly apply lifecycle properties from a plugin to its immediate parent using the `as: 'scoped'` option in `.guard()` and `.resolve()`. By marking the guard and resolve as 'scoped', the `username` property derived in the `getUserId` plugin becomes available in the context of the parent `user` application's route handlers, allowing access to the authenticated username.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_30

LANGUAGE: TypeScript
CODE:
```
// @errors: 2538
import { Elysia, t } from 'elysia'

export const userService = new Elysia({ name: 'user/service' })
    .state({
        user: {} as Record<string, string>,
        session: {} as Record<number, string>
    })
    .model({
        signIn: t.Object({
            username: t.String({ minLength: 1 }),
            password: t.String({ minLength: 8 })
        }),
        session: t.Cookie(
            {
                token: t.Number()
            },
            {
                secrets: 'seia'
            }
        ),
        optionalSession: t.Optional(t.Ref('session'))
    })
    .macro({
        isSignIn(enabled: boolean) {
            if (!enabled) return

            return {
            	beforeHandle({ error, cookie: { token }, store: { session } }) {
                    if (!token.value)
                        return error(401, {
                            success: false,
                            message: 'Unauthorized'
                        })

                    const username = session[token.value as unknown as number]

                    if (!username)
                        return error(401, {
                            success: false,
                            message: 'Unauthorized'
                        })
                }
            }
        }
    })
// ---cut---
export const getUserId = new Elysia()
    .use(userService)
    .guard({
    	as: 'scoped', // [!code ++]
    	isSignIn: true,
        cookie: 'session'
    })
    .resolve(
    	{ as: 'scoped' }, // [!code ++]
     	({ store: { session }, cookie: { token } }) => ({
        	username: session[token.value]
      	})
    )

export const user = new Elysia({ prefix: '/user' })
	.use(getUserId)
	.get('/profile', ({ username }) => ({
		                 // ^?
        success: true,
        username
    }))
```

----------------------------------------

TITLE: Defining Basic GET Routes - ElysiaJS (TypeScript)
DESCRIPTION: This snippet demonstrates how to define basic GET routes in ElysiaJS for the root path ('/') and '/hi'. It shows the use of the `.get()` method with a path and a simple string response, followed by `.listen()` to start the server on port 3000.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/route.md#_snippet_0

LANGUAGE: TypeScript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .get('/', 'hello')
    .get('/hi', 'hi')
    .listen(3000)
```

----------------------------------------

TITLE: Elysia Resolve: Extracting User ID from Session
DESCRIPTION: Demonstrates using Elysia's `resolve` feature to create a new context property (`username`) by accessing the session store with the token from the cookie. This allows extracting user information based on request data before the main handler executes.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_28

LANGUAGE: TypeScript
CODE:
```
export const getUserId = new Elysia() // [!code ++]
    .use(userService) // [!code ++]
    .guard({ // [!code ++]
        cookie: 'session' // [!code ++]
    }) // [!code ++]
    .resolve(({ store: { session }, cookie: { token } }) => ({ // [!code ++]
        username: session[token.value] // [!code ++]
    })) // [!code ++]
```

----------------------------------------

TITLE: Unit Testing Setup
DESCRIPTION: Demonstrates how to write unit tests for Elysia applications
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/cheat-sheet.md#2025-04-23_snippet_16

LANGUAGE: typescript
CODE:
```
import { describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'

describe('Elysia', () => {
    it('return a response', async () => {
        const app = new Elysia().get('/', () => 'hi')

        const response = await app
            .handle(new Request('http://localhost/'))
            .then((res) => res.text())

        expect(response).toBe('hi')
    })
})
```

----------------------------------------

TITLE: Creating a Unit Test with Eden Treaty in TypeScript
DESCRIPTION: This snippet demonstrates how to set up a unit test for an Elysia application using Eden Treaty. It creates a simple Elysia server with a GET endpoint, initializes the Eden Treaty client with the server instance, and tests that the endpoint returns the expected response. This approach provides end-to-end type safety without sending actual network requests.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/treaty/unit-test.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
// test/index.test.ts
import { describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import { treaty } from '@elysiajs/eden'

const app = new Elysia().get('/hello', 'hi')
const api = treaty(app)

describe('Elysia', () => {
    it('return a response', async () => {
        const { data } = await api.hello.get()

        expect(data).toBe('hi')
              // ^?

    })
})
```

----------------------------------------

TITLE: Creating Unit Tests for ElysiaJS using Bun Test Runner
DESCRIPTION: This code snippet demonstrates how to create a basic unit test for an ElysiaJS application using Bun's built-in test runner. It tests a simple GET request to the root endpoint.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/unit-test.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
// test/index.test.ts
import { describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'

describe('Elysia', () => {
    it('return a response', async () => {
        const app = new Elysia().get('/', () => 'hi')

        const response = await app
            .handle(new Request('http://localhost/'))
            .then((res) => res.text())

        expect(response).toBe('hi')
    })
})
```

----------------------------------------

TITLE: Context Extension in Elysia
DESCRIPTION: Demonstrates various methods for extending Elysia's context including state, decorate, derive, and resolve.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/handler.md#2025-04-23_snippet_14

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .state('version', 1)
    .get('/a', ({ store: { version } }) => version)
    .get('/b', ({ store }) => store)
    .get('/c', () => 'still ok')
    .listen(3000)
```

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

class Logger {
    log(value: string) {
        console.log(value)
    }
}

new Elysia()
    .decorate('logger', new Logger())
    .get('/', ({ logger }) => {
        logger.log('hi')

        return 'hi'
    })
```

----------------------------------------

TITLE: Basic Routing and WebSocket Handling in Elysia
DESCRIPTION: Demonstrates basic routing, file serving, streaming responses, and WebSocket handling in Elysia. Shows the simplicity of setting up various types of endpoints.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/index.md#2025-04-23_snippet_4

LANGUAGE: typescript
CODE:
```
import { Elysia, file } from 'elysia'

new Elysia()
	.get('/', 'Hello World')
	.get('/image', file('mika.webp'))
	.get('/stream', function* () {
		yield 'Hello'
		yield 'World'
	})
	.ws('/realtime', {
		message(ws, message) {
			ws.send('got:' + message)
		}
	})
	.listen(3000)
```

----------------------------------------

TITLE: Creating Public and Protected Post Routes Using Elysia (TypeScript)
DESCRIPTION: This code snippet defines both public (read) and protected (write) endpoints for a 'post' resource in an Elysia server. The public GET endpoint retrieves a post by its ID without requiring authentication, providing a success status and data. The protected PUT endpoint (after .use(authen)) allows authenticated users to create posts, validating the input and associating ownership via userId. Required dependencies: Elysia, t (type-safety and validation), Supabase, and the authen plugin. Inputs: GET - post ID via params; PUT - body with 'detail' property. Outputs: GET - {success, data}; PUT - new post ID or throws error on failure. Demonstrates selective scoping of middleware.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-supabase.md#2025-04-23_snippet_15

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

import { authen, supabase } from '../../libs'

export const post = (app: Elysia) =>
    app.group('/post', (app) =>
        app
            .get('/:id', async ({ params: { id } }) => { // [!code ++]
                const { data, error } = await supabase // [!code ++]
                    .from('post') // [!code ++]
                    .select() // [!code ++]
                    .eq('id', id) // [!code ++]
 // [!code ++]
                if (error) return error // [!code ++]
 // [!code ++]
                return { // [!code ++]
                    success: !!data[0], // [!code ++]
                    data: data[0] ?? null // [!code ++]
                } // [!code ++]
            }) // [!code ++]
            .use(authen)
            .put(
                '/create',
                async ({ body, userId }) => {
                    const { data, error } = await supabase
                        .from('post')
                        .insert({
                            // Add user_id somehow
                            // user_id: userId,
                            ...body
                        })
                        .select('id')

                    if (error) throw error

                    return data[0]
                },
                {
                    schema: {
                        body: t.Object({
                            detail: t.String()
                        })
                    }
                }
            )
    )
```

----------------------------------------

TITLE: Defining Note Routes in Elysia (TypeScript)
DESCRIPTION: Defines DELETE and PATCH endpoints for managing notes within an Elysia application. It includes parameter validation using t.Number(), checks for note existence, handles errors (422 Unprocessable Entity), and uses a guard (isSignIn) and body parsing (body: 'memo') for the PATCH route.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_54

LANGUAGE: TypeScript
CODE:
```
            params: t.Object({
                index: t.Number()
            })
        }
    )
    .guard({
        params: t.Object({
            index: t.Number()
        })
    })
    .delete('/:index', ({ note, params: { index }, error }) => {
        if (index in note.data) return note.remove(index)

        return error(422)
    })
    .patch(
        '/:index',
        ({ note, params: { index }, body: { data }, error, username }) => {
            if (index in note.data)
                return note.update(index, { data, author: username })

            return error(422)
        },
        {
            isSignIn: true,
            body: 'memo'
        }
    )
```

----------------------------------------

TITLE: Use Elysia.js Plugin (index.ts)
DESCRIPTION: Demonstrates how to import and apply a custom Elysia.js plugin (`note`) to the main application instance (`index.ts`), showing how to modularize routes and decorators.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_15

LANGUAGE: typescript
CODE:
```
// @filename: note.ts
import { Elysia, t } from 'elysia'

class Note {
    constructor(public data: string[] = ['Moonhalo']) {}
}

export const note = new Elysia()
    .decorate('note', new Note())
    .get('/note', ({ note }) => note.data)
    .get(
        '/note/:index',
        ({ note, params: { index }, error }) => {
            return note.data[index] ?? error(404, 'oh no :(')
        },
        {
            params: t.Object({
                index: t.Number()
            })
        }
    )

// @filename: index.ts
// ---cut---
import { Elysia, t } from 'elysia'
import { swagger } from '@elysiajs/swagger'

import { note } from './note' // [!code ++]

class Note { // [!code --]
    constructor(public data: string[] = ['Moonhalo']) {} // [!code --]
} // [!code --]

const app = new Elysia()
    .use(swagger())
    .use(note) // [!code ++]
    .decorate('note', new Note()) // [!code --]
    .get('/note', ({ note }) => note.data) // [!code --]
    .get( // [!code --]
        '/note/:index', // [!code --]
        ({ note, params: { index }, error }) => { // [!code --]
            return note.data[index] ?? error(404, 'oh no :(') // [!code --]
        }, // [!code --]
        { // [!code --]
            params: t.Object({ // [!code --]
                index: t.Number() // [!code --]
            }) // [!code --]
        } // [!code --]
    ) // [!code --]
    .listen(3000)
```

----------------------------------------

TITLE: Inline Error Implementation
DESCRIPTION: Demonstrates the new inline error handling with type-safe status codes and responses.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-10.md#2025-04-23_snippet_9

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .get('/hello', ({ error }) => {
        if(Math.random() > 0.5) return error(418, 'Nagisa')

        return 'Azusa'
    }, {
        response: t.Object({
            200: t.Literal('Azusa'),
            418: t.Literal('Nagisa')
        })
    })
```

----------------------------------------

TITLE: Error Handling and Response Validation in Elysia
DESCRIPTION: Demonstrates error handling and response validation in Elysia. Shows how to define expected response types and handle custom error responses.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/index.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/profile', ({ error }) => {
		if(Math.random() > .5)
			return error(418, 'Mika')

		return 'ok'
	}, {
		response: {
			200: t.Literal('ok'),
			418: t.Literal('Nagisa')
		}
	})
	.listen(3000)
```

----------------------------------------

TITLE: Server-side Setup for End-to-end Type Safety
DESCRIPTION: Shows how to export your Elysia app type to enable end-to-end type safety with frontend clients.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/at-glance.md#2025-04-23_snippet_4

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'
import { swagger } from '@elysiajs/swagger'

const app = new Elysia()
    .use(swagger())
    .get('/user/:id', ({ params: { id } }) => id, {
        params: t.Object({
            id: t.Number()
        })
    })
    .listen(3000)

export type App = typeof app
```

----------------------------------------

TITLE: Injecting and Referencing ElysiaJS Models in Routes (TypeScript)
DESCRIPTION: Shows how to define named models using `Elysia().model()` (e.g., mapping 'auth.sign' to `customBody`) and then reference these models by their string key within route definitions (`.post()`). This pattern leverages Elysia's reference model system for validation, providing benefits like autocompletion, schema modification, OpenAPI compatibility, and improved type inference speed. Requires the 'elysia' package.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/best-practice.md#2025-04-23_snippet_14

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

const customBody = t.Object({
	username: t.String(),
	password: t.String()
})

const AuthModel = new Elysia()
    .model({
        'auth.sign': customBody
    })

const models = AuthModel.models

const UserController = new Elysia({ prefix: '/auth' })
    .use(AuthModel)
    .post('/sign-in', async ({ body, cookie: { session } }) => {
                             // ^?

        return true
    }, {
        body: 'auth.sign'
    })
```

----------------------------------------

TITLE: Elysia User Authentication Service (TypeScript)
DESCRIPTION: Defines an Elysia plugin for user authentication and management. It includes routes for signing up, signing in, signing out, and retrieving user profiles. The service manages user data and sessions in memory and uses models for request body and cookie validation.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_34

LANGUAGE: TypeScript
CODE:
```
// @errors: 2538
// @filename: user.ts
import { Elysia, t } from 'elysia'

export const user = new Elysia({ prefix: '/user' })
    .state({
        user: {} as Record<string, string>,
        session: {} as Record<number, string>
    })
    .model({
        signIn: t.Object({
            username: t.String({ minLength: 1 }),
            password: t.String({ minLength: 8 })
        }),
        session: t.Cookie(
            {
                token: t.Number()
            },
            {
                secrets: 'seia'
            }
        ),
        optionalSession: t.Optional(t.Ref('session'))
    })
    .put(
        '/sign-up',
        async ({ body: { username, password }, store, error }) => {
            if (store.user[username])
                return error(400, {
                    success: false,
                    message: 'User already exists'
                })

            store.user[username] = await Bun.password.hash(password)

            return {
                success: true,
                message: 'User created'
            }
        },
        {
            body: 'signIn'
        }
    )
    .post(
        '/sign-in',
        async ({
            store: { user, session },
            error,
            body: { username, password },
            cookie: { token }
        }) => {
            if (
                !user[username] ||
                !(await Bun.password.verify(password, user[username]))
            )
                return error(400, {
                    success: false,
                    message: 'Invalid username or password'
                })

            const key = crypto.getRandomValues(new Uint32Array(1))[0]
            session[key] = username
            token.value = key

            return {
                success: true,
                message: `Signed in as ${username}`
            }
        },
        {
            body: 'signIn',
            cookie: 'optionalSession'
        }
    )
    .get(
        '/sign-out',
        ({ cookie: { token } }) => {
            token.remove()

            return {
                success: true,
                message: 'Signed out'
            }
        },
        {
            cookie: 'optionalSession'
        }
    )
    .get(
        '/profile',
        ({ cookie: { token }, store: { user, session }, error }) => {
            const username = session[token.value]

            if (!username)
                return error(401, {
                    success: false,
                    message: 'Unauthorized'
                })

            return {
                success: true,
                username
            }
        },
        {
            cookie: 'session'
        }
    )
```

----------------------------------------

TITLE: Adding Type Validation to User Sign-up Endpoint
DESCRIPTION: Enhances the user sign-up endpoint with Elysia's type system for input validation. This ensures that the incoming request body matches the expected shape and updates TypeScript types accordingly.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/with-prisma.md#2025-04-23_snippet_7

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const app = new Elysia()
    .post(
        '/sign-up', 
        async ({ body }) => db.user.create({
            data: body
        }),
        {
            body: t.Object({
                username: t.String(),
                password: t.String({
                    minLength: 8
                })
            })
        }
    )
    .listen(3000)

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
```

----------------------------------------

TITLE: Creating Basic Routes with Elysia in TypeScript
DESCRIPTION: This snippet demonstrates how to create basic routes using Elysia. It includes examples of GET routes with different response types and parameter handling.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/midori.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .get('/', 'Hello World')
    .get('/json', {
        hello: 'world'
    })
    .get('/id/:id', ({ params: { id } }) => id)
    .listen(3000)
```

----------------------------------------

TITLE: Handling GET and POST Requests in Elysia
DESCRIPTION: Shows how to define basic routes for handling GET requests at the root path (/) and POST requests at /hi using Elysia's built-in methods.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/route.md#_snippet_6

LANGUAGE: TypeScript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .get('/', 'hello')
    .post('/hi', 'hi')
    .listen(3000)
```

----------------------------------------

TITLE: Consuming Elysia API with Eden Treaty Client
DESCRIPTION: This snippet shows how to import the server type and use Eden Treaty to create a type-safe client. It demonstrates making GET and POST requests with proper type inference for both request parameters and response data.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/treaty/legacy.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
// client.ts
import { edenTreaty } from '@elysiajs/eden'
import type { App } from './server' // [!code ++]

const app = edenTreaty<App>('http://localhost:')

// response type: 'Hi Elysia'
const { data: pong, error } = app.get()

// response type: 1895
const { data: id, error } = app.id['1895'].get()

// response type: { id: 1895, name: 'Skadi' }
const { data: nendoroid, error } = app.mirror.post({
    id: 1895,
    name: 'Skadi'
})
```

----------------------------------------

TITLE: Authentication Guard Implementation in Elysia.js
DESCRIPTION: Shows how to implement authentication checks using beforeHandle and guard patterns
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/life-cycle.md#2025-04-23_snippet_10

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { validateSession } from './user'

new Elysia()
    .get('/', () => 'hi', {
        beforeHandle({ set, cookie: { session }, error }) {
            if (!validateSession(session.value)) return error(401)
        }
    })
    .listen(3000)
```

----------------------------------------

TITLE: Catching and Transforming Errors with Elysia Middleware (TypeScript)
DESCRIPTION: Demonstrates Elysia's `onError` middleware to catch and transform runtime errors into custom responses. Dependencies: `elysia` package. Defines an error handler that returns a plain text response of the error. Instantiates a GET route that throws an error, illustrating error catching behavior. Input: thrown error in request; output: custom response with error string.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/life-cycle.md#2025-04-23_snippet_13

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .onError(({ code, error }) => {
        return new Response(error.toString())
    })
    .get('/', () => {
        throw new Error('Server is during maintenance')

        return 'unreachable'
    })
```

----------------------------------------

TITLE: Testing Elysia Applications with Bun
DESCRIPTION: Shows how to write and run tests for Elysia applications using Bun's test runner. Demonstrates testing API endpoints and error handling.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/index.md#2025-04-23_snippet_7

LANGUAGE: typescript
CODE:
```
// @filename: index.ts
import { Elysia, t } from 'elysia'

export const app = new Elysia()
    .put(
        '/user',
        ({ body, error }) => {
        	if(body.username === 'mika')
				return error(400, {
					success: false,
					message: 'Username already taken'
				} as const)

            return {
            	success: true,
             	message: 'User created'
            } as const
        },
        {
            body: t.Object({
            	username: t.String(),
             	password: t.String()
            })
        }
    )

// @filename: client.ts
// ---cut---
import { treaty } from '@elysiajs/eden'
import { app } from './index'
import { test, expect } from 'bun:test'

const server = treaty(app)

test('should handle duplicated user', async () => {
	const { error } = await server.user.put({
	    username: 'mika',
	})

	expect(error?.value).toEqual({
		success: false,
		message: 'Username already taken'
	})
})
```

----------------------------------------

TITLE: Validating Path Parameters in Elysia
DESCRIPTION: This snippet demonstrates how to define a route `/id/:id` in Elysia and apply validation to the path parameters using `t.Object`. It specifically validates the `id` parameter to be a number. The validated `id` is then returned in the route handler.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_4

LANGUAGE: TypeScript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
    .get('/id/:id', ({ params: { id } }) => id, {
        params: t.Object({
            id: t.Number()
        })
    })
    .listen(3000)
```

----------------------------------------

TITLE: Using ElysiaJS Instance as a Controller (TypeScript)
DESCRIPTION: Shows the recommended approach of using the Elysia instance itself as a controller. This maintains type integrity and aligns with the framework's design philosophy.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/best-practice.md#2025-04-23_snippet_3

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { Service } from './service'

new Elysia()
    .get('/', ({ stuff }) => {
        Service.doStuff(stuff)
    })
```

----------------------------------------

TITLE: Applying Schema with Guard (ElysiaJS) - TypeScript
DESCRIPTION: Demonstrates how to use `Elysia.guard` to apply a common request body schema (`t.Object`) to multiple routes (`/sign-up`, `/sign-in`) within a scope, avoiding repetition. It also shows how to apply a route-specific hook (`beforeHandle`) alongside the guarded schema.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/plugin.md#_snippet_5

LANGUAGE: typescript
CODE:
```
const signUp = <T>(a: T) => a
const signIn = <T>(a: T) => a
const isUserExists = <T>(a: T) => a

import { Elysia, t } from 'elysia'

new Elysia()
    .guard(
        {
            body: t.Object({
                username: t.String(),
                password: t.String()
            })
        },
        (app) =>
            app
                .post('/sign-up', ({ body }) => signUp(body))
                .post('/sign-in', ({ body }) => signIn(body), {
                    beforeHandle: isUserExists
                })
    )
    .get('/', 'hi')
    .listen(3000)
```

----------------------------------------

TITLE: Defining GET Route with Parameter Validation in Elysia
DESCRIPTION: This snippet defines a GET route for '/note/:index' within an Elysia application. It includes a handler function that accesses data based on the 'index' parameter and returns a 404 error if the data is not found. It also uses Elysia's 't' object for runtime validation, ensuring the 'index' parameter is a number.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_36

LANGUAGE: TypeScript
CODE:
```
        '/note/:index',
        ({ note, params: { index }, error }) => {
            return note.data[index] ?? error(404, 'oh no :(')
        },
        {
            params: t.Object({
                index: t.Number()
            })
        }
    )
```

----------------------------------------

TITLE: Logging Response Status and Headers After Handling with Elysia (TypeScript)
DESCRIPTION: Shows how to access and log response status and headers using the `set` property from the context given to `onAfterResponse`. Implements a GET endpoint that logs the HTTP status and headers for each response. Dependency: `elysia` package. Input: any request; output: console log.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/life-cycle.md#2025-04-23_snippet_20

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
	.onAfterResponse(({ set }) => {
		console.log(set.status, set.headers)
	})
	.get('/', () => 'Hello')
	.listen(3000)
```

----------------------------------------

TITLE: Implementing User Service and Authentication Guard in ElysiaJS (TypeScript)
DESCRIPTION: This code defines a modular Elysia service for user management and authentication. It utilizes state (`user`, `session`), models (`signIn`, `session`, `optionalSession`) for data validation and typing, and a macro (`isSignIn`) to create reusable authentication guards that check for a valid session token in cookies and session state before handling requests.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_43

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

export const userService = new Elysia({ name: 'user/service' })
    .state({
        user: {} as Record<string, string>,
        session: {} as Record<number, string>
    })
    .model({
        signIn: t.Object({
            username: t.String({ minLength: 1 }),
            password: t.String({ minLength: 8 })
        }),
        session: t.Cookie(
            {
                token: t.Number()
            },
            {
                secrets: 'seia'
            }
        ),
        optionalSession: t.Optional(t.Ref('session'))
    })
    .macro({
        isSignIn(enabled: boolean) {
            if (!enabled) return

            return {
            	beforeHandle({ error, cookie: { token }, store: { session } }) {
                    if (!token.value)
                        return error(401, {
                            success: false,
                            message: 'Unauthorized'
                        })

                    const username = session[token.value as unknown as number]

                    if (!username)
                        return error(401, {
                            success: false,
                            message: 'Unauthorized'
                        })
                }
            }
        }
    })

export const getUserId = new Elysia()
    .use(userService)
    .guard({
    	isSignIn: true,
        cookie: 'session'
    })
    .resolve(
    	({ store: { session }, cookie: { token } }) => ({
    	   	username: session[token.value]
    	})
    )
    .as('scoped')

export const user = new Elysia({ prefix: '/user' })
	.use(getUserId)
	.get('/profile', ({ username }) => ({
        success: true,
        username
    }))
```

----------------------------------------

TITLE: Defining String Body Validation in ElysiaJS (TypeScript)
DESCRIPTION: This snippet demonstrates how to define a schema for validating the request body as a string using `Elysia.t.String()` within an ElysiaJS application. It sets up a POST route that expects a string body and listens on port 3000. If the body is not a string, Elysia will trigger the error life cycle.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/type.md#_snippet_0

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
	.post('/', ({ body }) => `Hello ${body}`, {
		body: t.String()
	})
	.listen(3000)
```

----------------------------------------

TITLE: Defining and Reusing Reference Models in Elysia (TypeScript)
DESCRIPTION: This snippet demonstrates how to define reusable data models using `Elysia.model` and reference them in route schemas (`body`, `cookie`) instead of defining the schema inline. It includes models for user sign-in credentials (`signIn`) and session cookies (`session`, `optionalSession`).
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_21

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

export const user = new Elysia({ prefix: '/user' })
    .state({
        user: {} as Record<string, string>,
        session: {} as Record<number, string>
    })
    .model({ // [!code ++]
    	signIn: t.Object({ // [!code ++]
    		username: t.String({ minLength: 1 }), // [!code ++]
    		password: t.String({ minLength: 8 }) // [!code ++]
    	}), // [!code ++]
     	session: t.Cookie( // [!code ++]
	     	{ // [!code ++]
	     		token: t.Number() // [!code ++]
	     	}, // [!code ++]
	     	{ // [!code ++]
		     	secrets: 'seia' // [!code ++]
	     	} // [!code ++]
	    ), // [!code ++]
      	optionalSession: t.Optional(t.Ref('session')) // [!code ++]
    }) // [!code ++]
    .put(
        '/sign-up',
        async ({ body: { username, password }, store, error }) => {
            if (store.user[username])
                return error(400, {
                    success: false,
                    message: 'User already exists'
                })
            store.user[username] = await Bun.password.hash(password)

            return {
                success: true,
                message: 'User created'
            }
        },
        {
           	body: 'signIn' // [!code ++]
        }
    )
    .post(
        '/sign-in',
        async ({
            store: { user, session },
            error,
            body: { username, password },
            cookie: { token }
        }) => {
            if (
                !user[username] ||
                !(await Bun.password.verify(password, user[username]))
            )
                return error(400, {
                    success: false,
                    message: 'Invalid username or password'
                })

            const key = crypto.getRandomValues(new Uint32Array(1))[0]
            session[key] = username
            token.value = key

            return {
                success: true,
                message: `Signed in as ${username}`
            }
        },
        {
           	body: 'signIn', // [!code ++]
           	cookie: 'session', // [!code ++]
        }
    )
```

----------------------------------------

TITLE: Implementing Type-Safe POST Requests in Elysia
DESCRIPTION: This example shows how to create a type-safe POST endpoint using Elysia. It defines a schema for the request body using the 't' object for runtime type checking.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/midori.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
    .post(
        '/profile',
        // ↓ hover me ↓
        ({ body }) => body,
        {
            body: t.Object({
                username: t.String()
            })
        }
    )
    .listen(3000)
```

----------------------------------------

TITLE: Implementing Custom Error Handling in Elysia.js
DESCRIPTION: Demonstrates how to create and handle custom errors with type support in Elysia.js. The code shows error class definition and error handling with type narrowing and auto-completion.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-06.md#2025-04-23_snippet_10

LANGUAGE: typescript
CODE:
```
class CustomError extends Error {
    constructor(public message: string) {
        super(message)
    }
}

new Elysia()
    .addError({
        MyError: CustomError
    })
    .onError(({ code, error }) => {
        switch(code) {
            // With auto-completion
            case 'MyError':
                // With type narrowing
                // Error is typed as CustomError
                return error
        }
    })
```

----------------------------------------

TITLE: Implementing Note Service and Routes in Elysia
DESCRIPTION: This snippet defines a `Note` class to manage note data and integrates it into an Elysia service (`note`). It utilizes the previously defined `userService` and `getUserId` for authentication and user context. The service includes models for notes, an `onTransform` hook for logging, and routes for retrieving all notes, adding a new note (requiring authentication), and retrieving a specific note by index.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_53

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'
import { getUserId, userService } from './user'

const memo = t.Object({
    data: t.String(),
    author: t.String()
})

type Memo = typeof memo.static

class Note {
    constructor(
        public data: Memo[] = [
            {
                data: 'Moonhalo',
                author: 'saltyaom'
            }
        ]
    ) {}

    add(note: Memo) {
        this.data.push(note)

        return this.data
    }

    remove(index: number) {
        return this.data.splice(index, 1)
    }

    update(index: number, note: Partial<Memo>) {
        return (this.data[index] = { ...this.data[index], ...note })
    }
}

export const note = new Elysia({ prefix: '/note' })
    .use(userService)
    .decorate('note', new Note())
    .model({
        memo: t.Omit(memo, ['author'])
    })
    .onTransform(function log({ body, params, path, request: { method } }) {
        console.log(`${method} ${path}`, {
            body,
            params
        })
    })
    .get('/', ({ note }) => note.data)
    .use(getUserId)
    .put(
        '/',
        ({ note, body: { data }, username }) =>
            note.add({ data, author: username }),
        {
            body: 'memo'
        }
    )
    .get(
        '/:index',
        ({ note, params: { index }, error }) => {
            return note.data[index] ?? error(404, 'Not Found :(')
        },
        {

```

----------------------------------------

TITLE: Using Controllers with Type Inference in ElysiaJS
DESCRIPTION: This example demonstrates how to use controllers while maintaining type inference in ElysiaJS. It shows a recommended approach for applying separate functions like MVC controllers.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/key-concept.md#2025-04-23_snippet_5

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

abstract class Controller {
	static greet({ name }: { name: string }) {
		return 'hello ' + name
	}
}

const app = new Elysia()
	.post('/', ({ body }) => Controller.greet(body), {
		body: t.Object({
			name: t.String()
		})
	})
```

----------------------------------------

TITLE: Inferring ElysiaJS Context Type using InferContext Utility (TypeScript)
DESCRIPTION: Shows how to use the `InferContext` utility type from ElysiaJS to automatically infer the type of the context object based on an Elysia instance's state and decorators. This avoids manual type definition and ensures type safety.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/handler.md#2025-04-23_snippet_24

LANGUAGE: typescript
CODE:
```
import { Elysia, type InferContext } from 'elysia'

const setup = new Elysia()
	.state('a', 'a')
	.decorate('b', 'b')

type Context = InferContext<typeof setup>

const handler = ({ store }: Context) => store.a
```

----------------------------------------

TITLE: Defining Authorization Plugin with Elysia and Supabase in TypeScript
DESCRIPTION: This snippet demonstrates how to encapsulate authorization and user identification logic as an Elysia plugin in TypeScript. It uses the @elysiajs/cookie plugin to access cookies, calls Supabase's getUser or refreshSession to retrieve the userId, and throws on failure, ensuring only authenticated requests are processed. The plugin injects userId into the request context for downstream handlers. Prerequisites: Elysia, Supabase client, @elysiajs/cookie installed and properly configured. Inputs: access_token and refresh_token cookies. Outputs: augments context with userId or prevents handler execution if authentication fails.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-supabase.md#2025-04-23_snippet_13

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { cookie } from '@elysiajs/cookie'

import { supabase } from './supabase'

export const authen = (app: Elysia) =>
    app
        .use(cookie())
        .derive(
            async ({ setCookie, cookie: { access_token, refresh_token } }) => {
                const { data, error } = await supabase.auth.getUser(
                    access_token
                )

                if (data.user)
                    return {
                        userId: data.user.id
                    }

                const { data: refreshed, error: refreshError } =
                    await supabase.auth.refreshSession({
                        refresh_token
                    })

                if (refreshError) throw error

                return {
                    userId: refreshed.user!.id
                }
            }
        )
```

----------------------------------------

TITLE: End-to-End Type-Safe Client-Server Interaction with Eden Treaty (TypeScript)
DESCRIPTION: This example demonstrates the complete workflow of using Eden Treaty. It shows the server definition exporting its type and the client-side code importing that type to create a type-safe client instance using `treaty`. It illustrates making a GET request with type-safe access.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/treaty/overview.md#_snippet_1

LANGUAGE: typescript
CODE:
```
// @filename: server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/hi', () => 'Hi Elysia')
    .get('/id/:id', ({ params: { id } }) => id)
    .post('/mirror', ({ body }) => body, {
        body: t.Object({
            id: t.Number(),
            name: t.String()
        })
    })
    .listen(3000)

export type App = typeof app // [!code ++]
```

LANGUAGE: typescript
CODE:
```
// @filename: client.ts
// ---cut---
// client.ts
import { treaty } from '@elysiajs/eden'
import type { App } from './server' // [!code ++]

const app = treaty<App>('localhost:3000')

// response type: 'Hi Elysia'
const { data, error } = await app.hi.get()
      // ^?
```

----------------------------------------

TITLE: Using ElysiaJS Models in Routes (TypeScript)
DESCRIPTION: Shows how to use Elysia models in route handlers to leverage both validation and type inference. This approach ensures type safety while providing runtime validation.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/best-practice.md#2025-04-23_snippet_11

LANGUAGE: typescript
CODE:
```
// ✅ Do
new Elysia()
	.post('/login', ({ body }) => {
	                 // ^?
		return body
	}, {
		body: customBody
	})
```

----------------------------------------

TITLE: Validating Request Body in ElysiaJS (TypeScript)
DESCRIPTION: Illustrates how to define a validation schema for the request body of a POST route using `t.Object`. This ensures that incoming requests to `/body` must have a JSON body containing a `name` property with a string value.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_8

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
	.post('/body', ({ body }) => body, {




		body: t.Object({
			name: t.String()
		})
	})
	.listen(3000)
```

----------------------------------------

TITLE: Configure Elysia Port for Railway Deployment
DESCRIPTION: Modify the Elysia listen call to bind to the port specified by the PORT environment variable, commonly used by deployment platforms like Railway. This allows the application to dynamically use the assigned port while providing a fallback for local development.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/deploy.md#_snippet_12

LANGUAGE: typescript
CODE:
```
new Elysia()
	.listen(3000) // [!code --]
	.listen(process.env.PORT ?? 3000) // [!code ++]
```

----------------------------------------

TITLE: Using Method Chaining in ElysiaJS (TypeScript)
DESCRIPTION: Demonstrates the proper way to use method chaining in ElysiaJS to maintain type integrity. This pattern ensures type inference works correctly by preserving type references through the chain of method calls.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/best-practice.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .state('build', 1)
    // Store is strictly typed // [!code ++]
    .get('/', ({ store: { build } }) => build)
    .listen(3000)
```

----------------------------------------

TITLE: Defining Elysia Macro for Authentication (TypeScript)
DESCRIPTION: Defines an Elysia service (`userService`) with state management for users and sessions, models for sign-in and session cookies, and a custom macro `isSignIn`. The macro conditionally adds a `beforeHandle` hook to check for a valid session token and user existence, returning a 401 error if unauthorized.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_25

LANGUAGE: TypeScript
CODE:
```
// @errors: 2538
import { Elysia, t } from 'elysia'

export const userService = new Elysia({ name: 'user/service' })
    .state({
        user: {} as Record<string, string>,
        session: {} as Record<number, string>
    })
    .model({
        signIn: t.Object({
            username: t.String({ minLength: 1 }),
            password: t.String({ minLength: 8 })
        }),
        session: t.Cookie(
            {
                token: t.Number()
            },
            {
                secrets: 'seia'
            }
        ),
        optionalSession: t.Optional(t.Ref('session'))
    })
    .macro({
        isSignIn(enabled: boolean) { // [!code ++]
            if (!enabled) return // [!code ++]

			return {
	            beforeHandle({ error, cookie: { token }, store: { session } }) { // [!code ++]
                    if (!token.value) // [!code ++]
                        return error(401, { // [!code ++]
                            success: false, // [!code ++]
                            message: 'Unauthorized' // [!code ++]
                        }) // [!code ++]

                    const username = session[token.value as unknown as number] // [!code ++]

                    if (!username) // [!code ++]
                        return error(401, { // [!code ++]
                            success: false, // [!code ++]
                            message: 'Unauthorized' // [!code ++]
                        }) // [!code ++]
                } // [!code ++]
			} // [!code ++]
        } // [!code ++]
    }) // [!code ++]
```

----------------------------------------

TITLE: Using Node Adapter in Elysia
DESCRIPTION: Demonstrates how to use the new Node adapter in Elysia 1.2 to run the framework on Node.js runtime.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-12.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
import { node } from '@elysiajs/node'

new Elysia({ adapter: node() })
	.get('/', 'Hello Node')
	.listen(3000)
```

----------------------------------------

TITLE: Implementing WebSocket with Eden Treaty in ElysiaJS
DESCRIPTION: Demonstrates how to set up a WebSocket server endpoint using ElysiaJS and connect to it using Eden Treaty. The example shows a chat implementation with type-safe messaging and event handling. It includes server setup with Elysia and client-side connection using Eden Treaty's subscribe method.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/treaty/websocket.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from "elysia";
import { treaty } from "@elysiajs/eden";

const app = new Elysia()
  .ws("/chat", {
    body: t.String(),
    response: t.String(),
    message(ws, message) {
      ws.send(message);
    },
  })
  .listen(3000);

const api = treaty<typeof app>("localhost:3000");

const chat = api.chat.subscribe();

chat.subscribe((message) => {
  console.log("got", message);
});

chat.on("open", () => {
  chat.send("hello from client");
});
```

----------------------------------------

TITLE: End-to-End Type Safety Testing with Eden Treaty
DESCRIPTION: This code snippet demonstrates how to use Eden Treaty to create an end-to-end type safety test for an ElysiaJS server. It sets up a simple GET endpoint and tests it using the treaty function.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/unit-test.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
// test/index.test.ts
import { describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import { treaty } from '@elysiajs/eden'

const app = new Elysia().get('/hello', 'hi')

const api = treaty(app)

describe('Elysia', () => {
    it('return a response', async () => {
        const { data, error } = await api.hello.get()

        expect(data).toBe('hi')
              // ^?
    })
})
```

----------------------------------------

TITLE: Scoping in ElysiaJS
DESCRIPTION: This example illustrates the concept of scoping in ElysiaJS. It shows how to create a global scope for sharing properties between instances.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/key-concept.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const ip = new Elysia()
	.derive(
		{ as: 'global' },
		({ server, request }) => ({
			ip: server?.requestIP(request)
		})
	)
	.get('/ip', ({ ip }) => ip)

const server = new Elysia()
	.use(ip)
	.get('/ip', ({ ip }) => ip)
	.listen(3000)
```

----------------------------------------

TITLE: Applying Authorization Plugin to Scoped Route Groups in Elysia (TypeScript)
DESCRIPTION: This snippet showcases how to use the previously defined authen plugin to protect a group of Elysia routes in TypeScript. Within the '/post' route group, it uses .put to define an authenticated post creation endpoint, relying on userId injected by the plugin. The handler validates the input body, ensures proper authorization using supabase, and inserts a new post associated with the user. Dependencies: authen plugin, Elysia, Supabase client, t for schema validation. Inputs: body with a 'detail' string. Outputs: Returns the created post's ID. The scope pattern ensures all subsequent routes are protected.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-supabase.md#2025-04-23_snippet_14

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

import { authen, supabase } from '../../libs' // [!code ++]

export const post = (app: Elysia) =>
    app.group('/post', (app) =>
        app
            .use(authen) // [!code ++]
            .put(
                '/create',
                async ({ body, userId }) => { // [!code ++]
                    let userId: string // [!code --]
    // [!code --]
                    const { data, error } = await supabase.auth.getUser( // [!code --]
                        access_token // [!code --]
                    ) // [!code --]
    // [!code --]
                    if(error) { // [!code --]
                        const { data, error } = await supabase.auth.refreshSession({ // [!code --]
                            refresh_token // [!code --]
                        }) // [!code --]
    // [!code --]
                        if (error) throw error // [!code --]
    // [!code --]
                        userId = data.user!.id // [!code --]
                    } // [!code --]

                    const { data, error } = await supabase
                        .from('post')
                        .insert({
                            user_id: userId, // [!code ++]
                            ...body
                        })
                        .select('id')

                    if (error) throw error

                    return data[0]
                },
                {
                    schema: {
                        body: t.Object({
                            detail: t.String()
                        })
                    }
                }
            )
    )

```

----------------------------------------

TITLE: Setting Up Status-Based Error Types in Elysia Server
DESCRIPTION: This snippet shows how to define specific error types for different HTTP status codes in an Elysia server. It uses the model and response properties to map status codes to specific schema definitions for better type safety.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/treaty/legacy.md#2025-04-23_snippet_4

LANGUAGE: typescript
CODE:
```
// server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .model({
        nendoroid: t.Object({
            id: t.Number(),
            name: t.String()
        }),
        error: t.Object({
            message: t.String()
        })
    })
    .get('/', () => 'Hi Elysia')
    .get('/id/:id', ({ params: { id } }) => id)
    .post('/mirror', ({ body }) => body, {
        body: 'nendoroid',
        response: {
            200: 'nendoroid', // [!code ++]
            400: 'error', // [!code ++]
            401: 'error' // [!code ++]
        }
    })
    .listen(3000)

export type App = typeof app
```

----------------------------------------

TITLE: Handling Route Parameters in Elysia with TypeScript
DESCRIPTION: Demonstrates how to define routes with parameters in Elysia, including optional parameters. Shows type inference for route parameters and response headers.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/index.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
	.get('/id/:id', ({ params, set }) => {
	                   // ^?




		set.headers.a
		//           ^|


		return 'Su'
	})

	.get('/optional/:name?', ({ params: { name } }) => {
	                                   // ^?
        return name ?? 'Pardofelis'
	})
	.listen(3000)
```

----------------------------------------

TITLE: Validating Path Parameters with Elysia Schema (TypeScript)
DESCRIPTION: Shows how to add runtime validation and TypeScript type inference to path parameters using Elysia's schema system (`t`). By defining a schema for `params` (e.g., `t.Object({ index: t.Number() })`), Elysia automatically validates the input and provides type safety, preventing errors from invalid parameter types.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_11

LANGUAGE: TypeScript
CODE:
```
import { Elysia, t } from 'elysia';
import { swagger } from '@elysiajs/swagger';

class Note {
    constructor(public data: string[] = ['Moonhalo']) {}
}

const app = new Elysia()
    .use(swagger())
    .decorate('note', new Note())
    .get('/note', ({ note }) => note.data)
    .get(
        '/note/:index',
        ({ note, params: { index } }) => {
            return note.data[index];
        },
        {
            params: t.Object({
                index: t.Number()
            })
        }
    )
    .listen(3000);
```

----------------------------------------

TITLE: Integrating OpenAI Chat Completion with ElysiaJS Stream - TypeScript
DESCRIPTION: This snippet illustrates how to stream OpenAI ChatGPT responses directly to clients using ElysiaJS. It defines an endpoint '/ai' that wraps OpenAI's chat stream (an AsyncIterable) in the Stream class, automatically handling data flow. Assumes the OpenAI library is installed and initialized, and the Stream plugin is available.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/stream.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
new Elysia()
    .get(
        '/ai',
        ({ query: { prompt } }) =>
            new Stream(
                openai.chat.completions.create({
                    model: 'gpt-3.5-turbo',
                    stream: true,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                })
            )
    )
```

----------------------------------------

TITLE: Correct Controller Implementation
DESCRIPTION: Shows the recommended way of using Elysia instance as a controller.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/structure.md#2025-04-23_snippet_3

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { Service } from './service'

new Elysia()
    .get('/', ({ stuff }) => {
        Service.doStuff(stuff)
    })
```

----------------------------------------

TITLE: Defining User Service and Authentication Routes in Elysia
DESCRIPTION: This snippet defines the core user service (`userService`) including state for users and sessions, models for sign-in and cookies, and an authentication macro (`isSignIn`). It also sets up the main user routes (`user`) for sign-up, sign-in, sign-out, and profile retrieval, utilizing the defined service and a helper (`getUserId`) for extracting the authenticated user's ID.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_52

LANGUAGE: typescript
CODE:
```
// @errors: 2538
// @filename: user.ts
import { Elysia, t } from 'elysia'

export const userService = new Elysia({ name: 'user/service' })
    .state({
        user: {} as Record<string, string>,
        session: {} as Record<number, string>
    })
    .model({
        signIn: t.Object({
            username: t.String({ minLength: 1 }),
            password: t.String({ minLength: 8 })
        }),
        session: t.Cookie(
            {
                token: t.Number()
            },
            {
                secrets: 'seia'
            }
        ),
        optionalSession: t.Optional(t.Ref('session'))
    })
    .macro({
        isSignIn(enabled: boolean) {
            if (!enabled) return

            return {
            	beforeHandle({ error, cookie: { token }, store: { session } }) {
                    if (!token.value)
                        return error(401, {
                            success: false,
                            message: 'Unauthorized'
                        })

                    const username = session[token.value as unknown as number]

                    if (!username)
                        return error(401, {
                            success: false,
                            message: 'Unauthorized'
                        })
                }
            }
        }
    })

export const getUserId = new Elysia()
    .use(userService)
    .guard({
    	isSignIn: true,
        cookie: 'session'
    })
    .resolve(({ store: { session }, cookie: { token } }) => ({
        username: session[token.value]
    }))
    .as('scoped')

export const user = new Elysia({ prefix: '/user' })
    .use(userService)
    .put(
        '/sign-up',
        async ({ body: { username, password }, store, error }) => {
            if (store.user[username])
                return error(400, {
                    success: false,
                    message: 'User already exists'
                })

            store.user[username] = await Bun.password.hash(password)

            return {
                success: true,
                message: 'User created'
            }
        },
        {
            body: 'signIn'
        }
    )
    .post(
        '/sign-in',
        async ({
            store: { user, session },
            error,
            body: { username, password },
            cookie: { token }
        }) => {
            if (
                !user[username] ||
                !(await Bun.password.verify(password, user[username]))
            )
                return error(400, {
                    success: false,
                    message: 'Invalid username or password'
                })

            const key = crypto.getRandomValues(new Uint32Array(1))[0]
            session[key] = username
            token.value = key

            return {
                success: true,
                message: `Signed in as ${username}`
            }
        },
        {
            body: 'signIn',
            cookie: 'optionalSession'
        }
    )
    .get(
        '/sign-out',
        ({ cookie: { token } }) => {
            token.remove()

            return {
                success: true,
                message: 'Signed out'
            }
        },
        {
            cookie: 'optionalSession'
        }
    )
    .use(getUserId)
    .get('/profile', ({ username }) => ({
        success: true,
        username
    }))

```

----------------------------------------

TITLE: Response Header Modification in Elysia.js
DESCRIPTION: Demonstrates how to modify response headers using afterHandle hook
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/life-cycle.md#2025-04-23_snippet_11

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { isHtml } from '@elysiajs/html'

new Elysia()
    .get('/', () => '<h1>Hello World</h1>', {
        afterHandle({ response, set }) {
            if (isHtml(response))
                set.headers['content-type'] = 'text/html; charset=utf8'
        }
    })
    .get('/hi', () => '<h1>Hello World</h1>')
    .listen(3000)
```

----------------------------------------

TITLE: Applying Guard for Query Parameter Validation (demo3)
DESCRIPTION: This snippet defines an Elysia instance (`demo3`) using `.guard()` to apply a schema that validates the query parameter `name` as a number. It includes example routes `/query?id=1` and `/query?id=salt` which would likely fail validation for the `name` parameter if it were used.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_2

LANGUAGE: TypeScript
CODE:
```
const demo3 = new Elysia()
 	.guard({
        query: t.Object({
            name: t.Number()
        })
    })
    .get('/query?id=1', ({ query: { id } }) => id)
    .get('/query?id=salt', ({ query: { id } }) => id)
```

----------------------------------------

TITLE: Defining Basic Response Schema in ElysiaJS
DESCRIPTION: Illustrates how to define the expected structure of a successful response using `t.Object` within the route's `response` option.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_21

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/response', () => {
		return {
			name: 'Jane Doe'
		}
	}, {
		response: t.Object({
			name: t.String()
		})
	})
```

----------------------------------------

TITLE: Enabling Automatic OpenAPI Documentation with Swagger in Elysia (TypeScript)
DESCRIPTION: This code enables automatic API documentation using the @elysiajs/swagger plugin in an Elysia TypeScript application. The swagger() plugin is registered before the usual auth and post modules, allowing the app to generate OpenAPI documentation conforming to Schema 3.0. Required dependencies: Elysia, @elysiajs/swagger, project modules. Inputs: None. Outputs: Running API server with Swagger UI available for documentation and testing. Useful for front-end integrations and API consumers.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-supabase.md#2025-04-23_snippet_18

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'
import { swagger } from '@elysiajs/swagger' // [!code ++]

import { auth, post } from './modules'

const app = new Elysia()
    .use(swagger()) // [!code ++]
    .use(auth)
    .use(post)
    .listen(3000)

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
```

----------------------------------------

TITLE: Define Note Service Routes with Elysia
DESCRIPTION: Creates an Elysia instance `note` with a `/note` prefix, integrates user service and the `Note` class, defines a schema for note body, adds a transform hook for logging, and sets up GET, PUT, GET (by index), DELETE, and PATCH routes for managing notes, including authentication guards and parameter validation.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_63

LANGUAGE: TypeScript
CODE:
```
export const note = new Elysia({ prefix: '/note' })
    .use(userService)
    .decorate('note', new Note())
    .model({
        memo: t.Omit(memo, ['author'])
    })
    .onTransform(function log({ body, params, path, request: { method } }) {
        console.log(`${method} ${path}`, {
            body,
            params
        })
    })
    .get('/', ({ note }) => note.data)
    .use(getUserId)
    .put(
        '/',
        ({ note, body: { data }, username }) =>
            note.add({ data, author: username }),
        {
            body: 'memo'
        }
    )
    .get(
        '/:index',
        ({ note, params: { index }, error }) => {
            return note.data[index] ?? error(404, 'Not Found :(')
        },
        {
            params: t.Object({
                index: t.Number()
            })
        }
    )
    .guard({
        params: t.Object({
            index: t.Number()
        })
    })
    .delete('/:index', ({ note, params: { index }, error }) => {
        if (index in note.data) return note.remove(index)

        return error(422)
    })
    .patch(
        '/:index',
        ({ note, params: { index }, body: { data }, error, username }) => {
            if (index in note.data)
                return note.update(index, { data, author: username })

            return error(422)
        },
        {
            isSignIn: true,
            body: 'memo'
        }
    })
```

----------------------------------------

TITLE: Demonstrating Components in ElysiaJS
DESCRIPTION: This snippet shows how to create and use components in ElysiaJS. It demonstrates creating a store, a router, and an app, each as separate Elysia instances that can be combined.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/key-concept.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const store = new Elysia()
	.state({ visitor: 0 })

const router = new Elysia()
	.use(store)
	.get('/increase', ({ store }) => store.visitor++)

const app = new Elysia()
	.use(router)
	.get('/', ({ store }) => store)
	.listen(3000)
```

----------------------------------------

TITLE: Defining Note Routes with Error Handling in ElysiaJS (TypeScript)
DESCRIPTION: This snippet defines an Elysia plugin for managing notes. It includes a simple `Note` class and two GET routes: one to fetch all notes and another to fetch a specific note by index, demonstrating basic route definition and returning a 404 error using the `error` helper if the index is out of bounds. It also uses `t.Object` and `t.Number` for parameter validation.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_42

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

class Note {
    constructor(public data: string[] = ['Moonhalo']) {}
}

export const note = new Elysia()
    .decorate('note', new Note())
    .get('/note', ({ note }) => note.data)
    .get(
        '/note/:index',
        ({ note, params: { index }, error }) => {
            return note.data[index] ?? error(404, 'oh no :(')
        },
        {
            params: t.Object({
                index: t.Number()
            })
        }
    )
```

----------------------------------------

TITLE: Model Definition Using Elysia Validation
DESCRIPTION: Demonstrates the correct way to define models using Elysia's built-in validation system.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/structure.md#2025-04-23_snippet_6

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

const customBody = t.Object({
	username: t.String(),
	password: t.String()
})

type CustomBody = typeof customBody.static

export { customBody }
```

----------------------------------------

TITLE: File Upload with Eden Treaty in TypeScript using ElysiaJS
DESCRIPTION: This snippet demonstrates how to handle file uploads using Eden Treaty, including setting up the server and client-side code for file submission.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/treaty/parameters.md#2025-04-23_snippet_4

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'
import { treaty } from '@elysiajs/eden'

const app = new Elysia()
    .post('/image', ({ body: { image, title } }) => title, {
        body: t.Object({
            title: t.String(),
            image: t.Files()
        })
    })
    .listen(3000)

export const api = treaty<typeof app>('localhost:3000')

const images = document.getElementById('images') as HTMLInputElement

const { data } = await api.image.post({
    title: "Misono Mika",
    image: images.files!,
})
```

----------------------------------------

TITLE: Grouping Routes with Prefix in Elysia (TypeScript)
DESCRIPTION: Illustrates how to use the `Elysia.group` method to define multiple routes that share a common URL prefix, making the code more organized and concise.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/route.md#_snippet_12

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .group('/user', (app) =>
        app
            .post('/sign-in', 'Sign in')
            .post('/sign-up', 'Sign up')
            .post('/profile', 'Profile')
    )
    .listen(3000)
```

----------------------------------------

TITLE: Creating a Plugin with Prefix for Route Grouping in Elysia (TypeScript)
DESCRIPTION: Demonstrates how to create a reusable plugin for a set of routes by initializing a new Elysia instance with a `prefix` option and then attaching it to the main application using `.use()`.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/route.md#_snippet_14

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const users = new Elysia({ prefix: '/user' })
    .post('/sign-in', 'Sign in')
    .post('/sign-up', 'Sign up')
    .post('/profile', 'Profile')

new Elysia()
    .use(users)
    .get('/', 'hello world')
    .listen(3000)
```

----------------------------------------

TITLE: Using ElysiaJS Macro for Better Auth Session/User (TypeScript)
DESCRIPTION: Implements an ElysiaJS macro (`auth`) that uses `auth.api.getSession` to retrieve session and user information from request headers. If a session exists, it makes `user` and `session` objects available to routes that opt-in via the macro, simplifying access to authentication state.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/better-auth.md#_snippet_6

LANGUAGE: TypeScript
CODE:
```
import { Elysia } from 'elysia'
import { auth } from './auth'

// user middleware (compute user and session and pass to routes)
const betterAuth = new Elysia({ name: 'better-auth' })
	.mount(auth.handler)
	.macro({
		auth: {
			async resolve({ error, request: { headers } }) {
				const session = await auth.api.getSession({
					headers
				})

				if (!session) return error(401)

				return {
					user: session.user,
					session: session.session
				}
			}
		}
	})

const app = new Elysia()
	.use(betterAuth)
	.get('/user', ({ user }) => user, {
		auth: true
	})
	.listen(3000)

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
```

----------------------------------------

TITLE: Initializing Elysia App with Plugins (TypeScript)
DESCRIPTION: Sets up the main Elysia application instance. It integrates opentelemetry and swagger plugins, defines a custom error handler for 'NOT_FOUND', and includes routes from separate user and note modules. The app is configured to listen on port 3000.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_55

LANGUAGE: TypeScript
CODE:
```
import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { opentelemetry } from '@elysiajs/opentelemetry'

import { note } from './note'
import { user } from './user'

const app = new Elysia()
    .use(opentelemetry())
    .use(swagger())
    .onError(({ error, code }) => {
        if (code === 'NOT_FOUND') return 'Not Found :('

        console.error(error)
    })
    .use(user)
    .use(note)
    .listen(3000)
```

----------------------------------------

TITLE: Change Route Method to POST in Elysia
DESCRIPTION: Shows how to change the HTTP method for the /hello route from GET to POST. This illustrates defining routes for different HTTP verbs in Elysia.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_5

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const app = new Elysia()
    .get('/', () => 'Hello Elysia')
    .get('/hello', 'Do you miss me?') // [!code --]
    .post('/hello', 'Do you miss me?') // [!code ++]
    .listen(3000)
```

----------------------------------------

TITLE: Incorrect Method Chaining (Breaks Type Inference) - TypeScript
DESCRIPTION: Illustrates an incorrect way to configure Elysia without method chaining. This approach prevents Elysia from updating the instance type correctly, leading to a lack of type inference for added properties like those in the `store`.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/installation.md#_snippet_6

LANGUAGE: typescript
CODE:
```
// @errors: 2339
import { Elysia } from 'elysia'

const app = new Elysia()

app.state('build', 1)

app.get('/', ({ store: { build } }) => build)

app.listen(3000)
```

----------------------------------------

TITLE: JWT Implementation with Header Authentication
DESCRIPTION: Example of implementing JWT authentication using authorization headers in ElysiaJS
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/jwt.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'

const app = new Elysia()
    .use(
        jwt({
            name: 'jwt',
            secret: 'Fischl von Luftschloss Narfidort'
        })
    )
    .get('/sign/:name', ({ jwt, params: { name } }) => {
    	return jwt.sign({ name })
    })
    .get('/profile', async ({ jwt, error, headers: { authorization } }) => {
        const profile = await jwt.verify(authorization)

        if (!profile)
            return error(401, 'Unauthorized')

        return `Hello ${profile.name}`
    })
    .listen(3000)
```

----------------------------------------

TITLE: Expose Elysia Server Type - TypeScript
DESCRIPTION: Define your Elysia server application and export its type. This exported type (`App`) is crucial for Eden to provide correct type inference on the client side.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/installation.md#_snippet_1

LANGUAGE: typescript
CODE:
```
// server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/', () => 'Hi Elysia')
    .get('/id/:id', ({ params: { id } }) => id)
    .post('/mirror', ({ body }) => body, {
        body: t.Object({
            id: t.Number(),
            name: t.String()
        })
    })
    .listen(3000)

export type App = typeof app // [!code ++]
```

----------------------------------------

TITLE: Initializing Elysia Application with Plugins
DESCRIPTION: This snippet demonstrates the basic setup of an Elysia application. It imports core Elysia components and plugins like '@elysiajs/swagger' and custom modules ('./note', './user'). It then creates an Elysia instance, registers the imported plugins using the '.use()' method, and starts the server listening on port 3000.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_37

LANGUAGE: TypeScript
CODE:
```
import { Elysia, t } from 'elysia'
import { swagger } from '@elysiajs/swagger'

import { note } from './note'
import { user } from './user' // [!code ++]

const app = new Elysia()
    .use(swagger())
    .use(user) // [!code ++]
    .use(note)
    .listen(3000)
```

----------------------------------------

TITLE: Method Chaining Pattern in ElysiaJS
DESCRIPTION: Demonstrates the correct way to use method chaining in ElysiaJS to maintain type inference. Shows how to properly chain state and route definitions.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/structure.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .state('build', 1)
    .get('/', ({ store: { build } }) => build)
    .listen(3000)
```

----------------------------------------

TITLE: Custom Headers and Status Codes
DESCRIPTION: Shows how to set custom headers and status codes in responses
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/cheat-sheet.md#2025-04-23_snippet_5

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .get('/', ({ set, error }) => {
        set.headers['x-powered-by'] = 'Elysia'

        return error(418, "I'm a teapot")
    })
    .listen(3000)
```

----------------------------------------

TITLE: Custom 404 Error Handling with Elysia (TypeScript)
DESCRIPTION: Shows how to provide a custom 404 (Not Found) message using the `onError` middleware in Elysia. Imports `NotFoundError` from `elysia`, assigns an error handler that checks if the error code is 'NOT_FOUND', and returns a custom response. Demonstrates POST request behavior that throws a not found error. Dependencies: `elysia` package. Output: Custom 404 message on error.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/life-cycle.md#2025-04-23_snippet_14

LANGUAGE: typescript
CODE:
```
import { Elysia, NotFoundError } from 'elysia'

new Elysia()
    .onError(({ code, error, set }) => {
        if (code === 'NOT_FOUND') return error(404, 'Not Found :(')
    })
    .post('/', () => {
        throw new NotFoundError()
    })
    .listen(3000)
```

----------------------------------------

TITLE: Defining Authentication Routes with Elysia and Supabase - TypeScript
DESCRIPTION: Defines an Elysia group for authentication routes, implementing '/sign-up', '/sign-in', and '/refresh' endpoints using Supabase's authentication APIs. The code sets up models for request validation and manages cookies for session handling. Dependencies include Elysia, Supabase client, and type definitions from the 't' module. Inputs include request bodies matching schema definitions for email and password; outputs are either user objects or error responses. Limitations: requires correct Supabase configuration and secure handling of cookies.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-supabase.md#2025-04-23_snippet_9

LANGUAGE: TypeScript
CODE:
```
// src/modules/authen.ts
import { Elysia, t } from 'elysia'
import { supabase } from '../../libs'

const authen = (app: Elysia) =>
    app.group('/auth', (app) =>
        app
            .setModel({
                sign: t.Object({
                    email: t.String({
                        format: 'email'
                    }),
                    password: t.String({
                        minLength: 8
                    })
                })
            })
            .post(
                '/sign-up',
                async ({ body }) => {
                    const { data, error } = await supabase.auth.signUp(body)

                    if (error) return error
                    return data.user
                },
                {
                    schema: {
                        body: 'sign'
                    }
                }
            )
            .post(
                '/sign-in',
                async ({ body }) => {
                    const { data, error } =
                        await supabase.auth.signInWithPassword(body)

                    if (error) return error

                    return data.user
                },
                {
                    schema: {
                        body: 'sign'
                    }
                }
            )
            .get( // [!code ++]
                '/refresh', // [!code ++]
                async ({ setCookie, cookie: { refresh_token } }) => { // [!code ++]
                    const { data, error } = await supabase.auth.refreshSession({ // [!code ++]
                        refresh_token // [!code ++]
                    }) // [!code ++]
 // [!code ++]
                    if (error) return error // [!code ++]
 // [!code ++]
                    setCookie('refresh_token', data.session!.refresh_token) // [!code ++]
 // [!code ++]
                    return data.user // [!code ++]
                } // [!code ++]
            ) // [!code ++]
    )
```

----------------------------------------

TITLE: Using ElysiaJS Validation System for Models (TypeScript)
DESCRIPTION: Demonstrates the recommended approach for defining models in ElysiaJS using its built-in validation system. This approach provides both runtime validation and type inference.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/best-practice.md#2025-04-23_snippet_10

LANGUAGE: typescript
CODE:
```
// ✅ Do
import { Elysia, t } from 'elysia'

const customBody = t.Object({
	username: t.String(),
	password: t.String()
})

// Optional if you want to get the type of the model
// Usually if we didn't use the type, as it's already inferred by Elysia
type CustomBody = typeof customBody.static
    // ^?



export { customBody }
```

----------------------------------------

TITLE: Elysia Main Server Entry Point with Modules (TypeScript)
DESCRIPTION: This snippet shows how to compose a main Elysia server instance in TypeScript by importing modular route groups (auth and post modules). The app sets up these modules using .use(), then starts the HTTP server on port 3000 and logs the status. Dependencies: Elysia, imported auth and post modules. Inputs: None directly. Outputs: Server running on specified hostname and port, with specified routes attached. Useful as a project entry-point.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-supabase.md#2025-04-23_snippet_16

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

import { auth, post } from './modules' // [!code ++]

const app = new Elysia()
    .use(auth)
    .use(post) // [!code ++]
    .listen(3000)

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
```

----------------------------------------

TITLE: Normalizing Request Body and Response Data with Elysia (TypeScript)
DESCRIPTION: Illustrates how Elysia v1.1 automatically normalizes data based on defined schemas using `t.Object`. The example shows how extra fields (`title` in body, `point` in response) are removed to ensure data consistency and prevent sensitive information leaks, using `@elysiajs/eden` for a client-side test.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-11.md#_snippet_5

LANGUAGE: TypeScript
CODE:
```
import { Elysia, t } from 'elysia'
import { treaty } from '@elysiajs/eden'

const app = new Elysia()
	.post('/', ({ body }) => body, {
		body: t.Object({
			name: t.String(),
			point: t.Number()
		}),
		response: t.Object({
			name: t.String()
		})
	})

const { data } = await treaty(app).index.post({
	name: 'SaltyAom',
	point: 9001,
	// ⚠️ additional field
	title: 'maintainer'
})

// 'point' is removed as defined in response
console.log(data) // { name: 'SaltyAom' }
```

----------------------------------------

TITLE: Context Derivation in Elysia.js
DESCRIPTION: Demonstrates how to derive new context values from request headers before validation
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/life-cycle.md#2025-04-23_snippet_9

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .derive(({ headers }) => {
        const auth = headers['Authorization']

        return {
            bearer: auth?.startsWith('Bearer ') ? auth.slice(7) : null
        }
    })
    .get('/', ({ bearer }) => bearer)
```

----------------------------------------

TITLE: Handling Different Path Types (Static, Dynamic, Wildcard) - ElysiaJS (TypeScript)
DESCRIPTION: This example illustrates the different path types supported by ElysiaJS: static ('/id/1'), dynamic ('/id/:id'), and wildcard ('/id/*'). It demonstrates how to define routes for each type and implicitly shows their priority in matching incoming requests.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/route.md#_snippet_1

LANGUAGE: TypeScript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .get('/id/1', 'static path')
    .get('/id/:id', 'dynamic path')
    .get('/id/*', 'wildcard path')
    .listen(3000)
```

----------------------------------------

TITLE: Correct Method Chaining for Type Inference - TypeScript
DESCRIPTION: Demonstrates the correct way to use method chaining with Elysia. Method chaining is essential for Elysia to correctly track and update the instance type, enabling proper type inference for features like `store`.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/installation.md#_snippet_5

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .state('build', 1)
    // Store is strictly typed // [!code ++]
    .get('/', ({ store: { build } }) => build)
    .listen(3000)
```

----------------------------------------

TITLE: Elysia Main Application Setup with Plugins and Error Handling (TypeScript)
DESCRIPTION: Sets up the main Elysia application instance `app`. It integrates the `swagger` plugin for API documentation, defines a custom `onError` handler to specifically catch and respond to 'NOT_FOUND' errors, includes the `note` plugin (presumably for note-related routes), and starts the server listening on port 3000.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_48

LANGUAGE: TypeScript
CODE:
```
import { Elysia, t } from 'elysia'
import { swagger } from '@elysiajs/swagger'

import { note } from './note'

const app = new Elysia()
    .use(swagger())
    .onError(({ error, code }) => { // [!code ++]
        if (code === 'NOT_FOUND') return 'Not Found :(' // [!code ++]

        console.error(error) // [!code ++]
    }) // [!code ++]
    .use(note)
    .listen(3000)
```

----------------------------------------

TITLE: Validating File Uploads in ElysiaJS (TypeScript)
DESCRIPTION: Demonstrates how to validate file uploads within a `multipart/form-data` request body using `t.File` for a single file and `t.Files` for multiple files. Elysia automatically handles the `multipart/form-data` content type when these types are used.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_10

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
	.post('/body', ({ body }) => body, {





		body: t.Object({
			file: t.File({ format: 'image/*' }),
			multipleFiles: t.Files()
		})
	})
	.listen(3000)
```

----------------------------------------

TITLE: Configuring Elysia Server with TypeScript
DESCRIPTION: Sets up an Elysia server with various endpoints including GET and POST routes with type validation. Exports the app type for client-side usage.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/fetch.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/hi', () => 'Hi Elysia')
    .get('/id/:id', ({ params: { id } }) => id)
    .post('/mirror', ({ body }) => body, {
        body: t.Object({
            id: t.Number(),
            name: t.String()
        })
    })
    .listen(3000)

export type App = typeof app
```

----------------------------------------

TITLE: Applying Multiple Validation Schemas to a Route
DESCRIPTION: This snippet shows how to apply multiple validation schemas (query and params) to a single route `/id/:id` in Elysia. It validates the `name` query parameter as a string and the `id` path parameter as a number. The route handler itself returns a static string.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_5

LANGUAGE: TypeScript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
    .get('/id/:id', () => 'Hello World!', {
        query: t.Object({
            name: t.String()
        }),
        params: t.Object({
            id: t.Number()
        })
    })
    .listen(3000)
```

----------------------------------------

TITLE: Defining Path Parameters in Elysia (TypeScript)
DESCRIPTION: Illustrates how to define a dynamic segment in a route path using a colon prefix (e.g., `/note/:index`). The value from the URL segment is automatically parsed and made available in the `params` object within the route handler, allowing retrieval of specific resources.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_10

LANGUAGE: TypeScript
CODE:
```
import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';

class Note {
    constructor(public data: string[] = ['Moonhalo']) {}
}

const app = new Elysia()
    .use(swagger())
    .decorate('note', new Note())
    .get('/note', ({ note }) => note.data)
    .get('/note/:index', ({ note, params: { index } }) => {
        return note.data[index];
    })
    .listen(3000);
```

----------------------------------------

TITLE: Incorrect Usage Without Method Chaining in ElysiaJS (TypeScript)
DESCRIPTION: Shows the incorrect approach of using ElysiaJS without method chaining, resulting in loss of type inference. This anti-pattern breaks type references between method calls.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/best-practice.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
// @errors: 2339
import { Elysia } from 'elysia'

const app = new Elysia()

app.state('build', 1)

app.get('/', ({ store: { build } }) => build)

app.listen(3000)
```

----------------------------------------

TITLE: Basic Cookie Usage in ElysiaJS
DESCRIPTION: Demonstrates basic get and set operations for cookies using ElysiaJS's reactive cookie system.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/cookie.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .get('/', ({ cookie: { name } }) => {
        // Get
        name.value

        // Set
        name.value = "New Value"
    })
```

----------------------------------------

TITLE: Defining String Type Schema in ElysiaJS (TypeScript)
DESCRIPTION: This snippet shows the basic TypeBox syntax used in ElysiaJS (`Elysia.t.String()`) to define a schema that validates a value as a string. This corresponds directly to the TypeScript `string` type for validation purposes.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/type.md#_snippet_1

LANGUAGE: typescript
CODE:
```
t.String()
```

----------------------------------------

TITLE: Request Schema Validation
DESCRIPTION: Shows how to implement request body validation using schema definitions
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/cheat-sheet.md#2025-04-23_snippet_7

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
    .post('/mirror', ({ body: { username } }) => username, {
        body: t.Object({
            username: t.String(),
            password: t.String()
        })
    })
    .listen(3000)
```

----------------------------------------

TITLE: Create Elysia Instance for User ID Resolution
DESCRIPTION: Creates an Elysia instance `getUserId` that uses the `userService`, applies the `isSignIn` guard, and resolves the username from the session store based on the session token, exposing it as a scoped value.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_59

LANGUAGE: TypeScript
CODE:
```
export const getUserId = new Elysia()
    .use(userService)
    .guard({
    	isSignIn: true,
        cookie: 'session'
    })
    .resolve(({ store: { session }, cookie: { token } }) => ({
        username: session[token.value]
    }))
    .as('scoped')
```

----------------------------------------

TITLE: Basic CORS Plugin Usage in ElysiaJS
DESCRIPTION: Basic implementation of the CORS plugin in an Elysia application that accepts requests from any origin
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/cors.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'

new Elysia().use(cors()).listen(3000)
```

----------------------------------------

TITLE: Inspecting Response Objects After Handling in Elysia (TypeScript)
DESCRIPTION: Demonstrates use of `onAfterResponse` in Elysia to inspect the value returned by a request handler. Logs the response value to the console after the route handler finishes processing. Particularly useful for debugging or analytics. Dependencies: `elysia` package.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/life-cycle.md#2025-04-23_snippet_19

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
	.onAfterResponse(({ response }) => {
		console.log(response)
	})
	.get('/', () => 'Hello')
	.listen(3000)
```

----------------------------------------

TITLE: Configuring String Sanitization in Elysia (TypeScript)
DESCRIPTION: Shows how to define a function or an array of functions using the `santize` option that will be applied to every `t.String` during validation, allowing transformation or sanitization of string inputs.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/configuration.md#_snippet_12

LANGUAGE: TypeScript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia({
	santize: (value) => Bun.escapeHTML(value)
})
```

----------------------------------------

TITLE: Defining Number Type Schema in ElysiaJS (TypeScript)
DESCRIPTION: This snippet shows the basic TypeBox syntax used in ElysiaJS (`Elysia.t.Number()`) to define a schema that validates a value as a number. This corresponds directly to the TypeScript `number` type for validation purposes.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/type.md#_snippet_2

LANGUAGE: typescript
CODE:
```
t.Number()
```

----------------------------------------

TITLE: Listing All Validation Errors in Route Handler (TypeScript)
DESCRIPTION: Demonstrates how to access a list of all validation errors using the `error.all` property of the `ValidationError` object within a route's specific `error` handler. It shows logging all errors and finding a specific error by path.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_35

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
	.post('/', ({ body }) => body, {
		body: t.Object({
			name: t.String(),
			age: t.Number()
		}),
		error({ code, error }) {
			switch (code) {
				case 'VALIDATION':
                    console.log(error.all)

                    // Find a specific error name (path is OpenAPI Schema compliance)
                    const name = error.all.find(
						(x) => x.summary && x.path === '/name'
					)

                    // If there is a validation error, then log it
                    if(name)
    					console.log(name)
			}
		}
	})
	.listen(3000)
```

----------------------------------------

TITLE: Coercing Query Parameters to Number in Elysia
DESCRIPTION: This snippet shows how to define a schema for query parameters in Elysia using TypeBox (`t`). It specifically requires the `name` query parameter to be a number, allowing Elysia to automatically coerce the input string value to a number.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_13

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/', ({ query }) => query, {
               // ^?




		query: t.Object({ // [!code ++]
			name: t.Number() // [!code ++]
		}) // [!code ++]
	})
	.listen(3000)
```

----------------------------------------

TITLE: Defining ElysiaJS User Service Plugin and App
DESCRIPTION: This snippet defines an ElysiaJS plugin named `userService` with shared state (user, session) and models (signIn, session, optionalSession). It then shows a main `user` app instance that uses this plugin. The `name` property on the plugin is crucial for preventing duplicate registrations when the plugin is used multiple times.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_24

LANGUAGE: TypeScript
CODE:
```
import { Elysia, t } from 'elysia'

export const userService = new Elysia({ name: 'user/service' })
	.state({
        user: {} as Record<string, string>,
        session: {} as Record<number, string>
    })
    .model({
        signIn: t.Object({
            username: t.String({ minLength: 1 }),
            password: t.String({ minLength: 8 })
        }),
        session: t.Cookie(
            {
                token: t.Number()
            },
            {
                secrets: 'seia'
            }
        ),
        optionalSession: t.Optional(t.Ref('session'))
    })

export const user = new Elysia({ prefix: '/user' })
	.use(userService)
	.state({
        user: {} as Record<string, string>,
        session: {} as Record<number, string>
    })
    .model({
        signIn: t.Object({
            username: t.String({ minLength: 1 }),
            password: t.String({ minLength: 8 })
        }),
        session: t.Cookie(
            {
                token: t.Number()
            },
            {
                secrets: 'seia'
            }
        ),
  		optionalSession: t.Optional(t.Ref('session'))
    })
```

----------------------------------------

TITLE: Dependency Management in ElysiaJS
DESCRIPTION: This example shows how to manage dependencies in ElysiaJS using unique identifiers. It demonstrates how to prevent duplication of methods when applying instances multiple times.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/key-concept.md#2025-04-23_snippet_3

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const ip = new Elysia({ name: 'ip' })
	.derive(
		{ as: 'global' },
		({ server, request }) => ({
			ip: server?.requestIP(request)
		})
	)
	.get('/ip', ({ ip }) => ip)

const router1 = new Elysia()
	.use(ip)
	.get('/ip-1', ({ ip }) => ip)

const router2 = new Elysia()
	.use(ip)
	.get('/ip-2', ({ ip }) => ip)

const server = new Elysia()
	.use(router1)
	.use(router2)
```

----------------------------------------

TITLE: Applying Global Query Schema with Guard in ElysiaJS (TypeScript)
DESCRIPTION: Demonstrates how to use `guard` to apply a validation schema (using `t.Object`) to the query parameters for multiple subsequent routes in an Elysia application. This ensures that requests to `/query` must include a `name` string parameter.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_6

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
    .get('/none', ({ query }) => 'hi')

    .guard({
        query: t.Object({
            name: t.String()
        })
    })
    .get('/query', ({ query }) => query)
    .listen(3000)
```

----------------------------------------

TITLE: Route Grouping
DESCRIPTION: Demonstrates how to group routes under a common prefix
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/cheat-sheet.md#2025-04-23_snippet_6

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .get("/", () => "Hi")
    .group("/auth", app => {
        return app
            .get("/", () => "Hi")
            .post("/sign-in", ({ body }) => body)
            .put("/sign-up", ({ body }) => body)
    })
    .listen(3000)
```

----------------------------------------

TITLE: Using Error and Set.Status in ElysiaJS Handlers
DESCRIPTION: Shows two methods for returning custom status codes in ElysiaJS: using the error function and set.status property.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/handler.md#2025-04-23_snippet_4

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
	.get('/error', ({ error }) => error(418, 'I am a teapot'))
	.get('/set.status', ({ set }) => {
		set.status = 418
		return 'I am a teapot'
	})
	.listen(3000)
```

----------------------------------------

TITLE: Plugin System Usage
DESCRIPTION: Shows how to create and use plugins in Elysia
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/cheat-sheet.md#2025-04-23_snippet_13

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const plugin = new Elysia()
    .state('plugin-version', 1)
    .get('/hi', () => 'hi')

new Elysia()
    .use(plugin)
    .get('/version', ({ store }) => store['plugin-version'])
    .listen(3000)
```

----------------------------------------

TITLE: Grouping ElysiaJS Routes with Prefix
DESCRIPTION: This snippet refactors the previous CRUD example by applying a common prefix '/note' to the Elysia plugin. This simplifies route definitions by allowing relative paths within the group, making the code cleaner and more organized.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_17

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

class Note {
    constructor(public data: string[] = ['Moonhalo']) {}

    add(note: string) {
        this.data.push(note)

        return this.data
    }

    remove(index: number) {
        return this.data.splice(index, 1)
    }

    update(index: number, note: string) {
        return (this.data[index] = note)
    }
}

export const note = new Elysia({ prefix: '/note' })
    .decorate('note', new Note())
    .get('/', ({ note }) => note.data)
    .put('/', ({ note, body: { data } }) => note.add(data), {
        body: t.Object({
            data: t.String()
        })
    })
    .get(
        '/:index',
        ({ note, params: { index }, error }) => {
            return note.data[index] ?? error(404, 'Not Found :(')
        },
        {
            params: t.Object({
                index: t.Number()
            })
        }
    )
    .delete(
        '/:index',
        ({ note, params: { index }, error }) => {
            if (index in note.data) return note.remove(index)

            return error(422)
        },
        {
            params: t.Object({
                index: t.Number()
            })
        }
    )
    .patch(
        '/:index',
        ({ note, params: { index }, body: { data }, error }) => {
            if (index in note.data) return note.update(index, data)

            return error(422)
        },
        {
            params: t.Object({
                index: t.Number()
            }),
            body: t.Object({
                data: t.String()
            })
        }
    )
```

----------------------------------------

TITLE: Implementing User Authentication Routes with Elysia and TypeScript
DESCRIPTION: This snippet defines an Elysia plugin named user with a /user prefix. It sets up in-memory state for storing user credentials (user) and active sessions (session). It includes a PUT /sign-up route to register new users, hashing passwords with Bun.password.hash, and a POST /sign-in route to authenticate users, verify passwords, generate a session key, and set a signed cookie (token) for session management. It uses Elysia's t for request body validation.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_20

LANGUAGE: TypeScript
CODE:
```
import { Elysia, t } from 'elysia' // [!code ++]
// [!code ++]
export const user = new Elysia({ prefix: '/user' })// [!code ++]
    .state({// [!code ++]
        user: {} as Record<string, string>,// [!code ++]
        session: {} as Record<number, string>// [!code ++]
    })// [!code ++]
    .put(// [!code ++]
        '/sign-up',// [!code ++]
        async ({ body: { username, password }, store, error }) => {// [!code ++]
            if (store.user[username])// [!code ++]
                return error(400, {// [!code ++]
                    success: false,// [!code ++]
                    message: 'User already exists'// [!code ++]
                })// [!code ++]
// [!code ++]
            store.user[username] = await Bun.password.hash(password)// [!code ++]
// [!code ++]
            return {// [!code ++]
                success: true,// [!code ++]
                message: 'User created'// [!code ++]
            }// [!code ++]
        },// [!code ++]
        {// [!code ++]
            body: t.Object({// [!code ++]
                username: t.String({ minLength: 1 }),// [!code ++]
                password: t.String({ minLength: 8 })// [!code ++]
            })// [!code ++]
        }// [!code ++]
    )// [!code ++]
    .post(// [!code ++]
        '/sign-in',// [!code ++]
        async ({// [!code ++]
            store: { user, session },// [!code ++]
            error,// [!code ++]
            body: { username, password },// [!code ++]
            cookie: { token }// [!code ++]
        }) => {// [!code ++]
            if (// [!code ++]
                !user[username] ||// [!code ++]
                !(await Bun.password.verify(password, user[username]))// [!code ++]
            )// [!code ++]
                return error(400, {// [!code ++]
                    success: false,// [!code ++]
                    message: 'Invalid username or password'// [!code ++]
                })// [!code ++]

            const key = crypto.getRandomValues(new Uint32Array(1))[0]// [!code ++]
            session[key] = username// [!code ++]
            token.value = key// [!code ++]

            return {// [!code ++]
                success: true,// [!code ++]
                message: `Signed in as ${username}`// [!code ++]
            }// [!code ++]
        },// [!code ++]
        {// [!code ++]
            body: t.Object({// [!code ++]
                username: t.String({ minLength: 1 }),// [!code ++]
                password: t.String({ minLength: 8 })// [!code ++]
            }),// [!code ++]
            cookie: t.Cookie(// [!code ++]
                {// [!code ++]
                    token: t.Number()// [!code ++]
                },// [!code ++]
                {// [!code ++]
                    secrets: 'seia'// [!code ++]
                }// [!code ++]
            )// [!code ++]
        }// [!code ++]
    )// [!code ++]
```

----------------------------------------

TITLE: Implementing Model Injection with Elysia Reference Models
DESCRIPTION: Demonstrates how to create and inject a custom authentication model using Elysia's reference model pattern. The example shows the creation of a validation schema for authentication data and its integration into a controller route. This approach enables model naming, auto-completion, schema modification capabilities, and OpenAPI compliance.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/structure.md#2025-04-23_snippet_7

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

const customBody = t.Object({
	username: t.String(),
	password: t.String()
})

const AuthModel = new Elysia()
    .model({
        'auth.sign': customBody
    })

const UserController = new Elysia({ prefix: '/auth' })
    .use(AuthModel)
    .post('/sign-in', async ({ body, cookie: { session } }) => {
                             // ^?

        return true
    }, {
        body: 'auth.sign'
    })
```

----------------------------------------

TITLE: Integrating Swagger Documentation with Elysia
DESCRIPTION: Shows how to integrate Swagger documentation into an Elysia application. Demonstrates the use of plugins for extending functionality.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/index.md#2025-04-23_snippet_5

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import swagger from '@elysiajs/swagger'

new Elysia()
	.use(swagger())
	.use(character)
	.use(auth)
	.listen(3000)
```

----------------------------------------

TITLE: Handling Validation Errors with onError Hook (TypeScript)
DESCRIPTION: Demonstrates using the `onError` lifecycle hook in Elysia to catch errors. It specifically checks if the error `code` is 'VALIDATION' and, if so, returns the error message from the `ValidationError` object.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_33

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
	.onError(({ code, error }) => {
		if (code === 'VALIDATION')
		    return error.message
	})
	.listen(3000)
```

----------------------------------------

TITLE: Consume Elysia API with Eden Treaty - TypeScript
DESCRIPTION: Demonstrates how to use Eden Treaty on the client side by importing the server's type and creating a typed client instance. It shows examples of making GET and POST requests with type-safe parameters and receiving typed responses.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/installation.md#_snippet_2

LANGUAGE: typescript
CODE:
```
// @filename: server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/', 'Hi Elysia')
    .get('/id/:id', ({ params: { id } }) => id)
    .post('/mirror', ({ body }) => body, {
        body: t.Object({
            id: t.Number(),
            name: t.String()
        })
    })
    .listen(3000)

export type App = typeof app // [!code ++]
```

LANGUAGE: typescript
CODE:
```
// @filename: index.ts
// ---cut---
// client.ts
import { treaty } from '@elysiajs/eden'
import type { App } from './server' // [!code ++]

const client = treaty<App>('localhost:3000') // [!code ++]

// response: Hi Elysia
const { data: index } = await client.get()

// response: 1895
const { data: id } = await client.id({ id: 1895 }).get()

// response: { id: 1895, name: 'Skadi' }
const { data: nendoroid } = await client.mirror.post({
    id: 1895,
    name: 'Skadi'
})

// @noErrors
client.
//     ^|
```

----------------------------------------

TITLE: Defining Array Query Parameters in Elysia
DESCRIPTION: This example illustrates how to use TypeBox (`t.Array(t.String())`) to define a query parameter (`name`) that should be treated as an array of strings. Elysia will then parse comma-separated values or repeated keys into an array.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_14

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/', ({ query }) => query, {
               // ^?




		query: t.Object({
			name: t.Array(t.String()) // [!code ++]
		})
	})
	.listen(3000)
```

----------------------------------------

TITLE: Validating Array and String Query Parameters (demo4)
DESCRIPTION: This snippet defines an Elysia instance (`demo4`) using `.guard()` to apply a schema that validates the query parameter `name` as an array of strings and `squad` as a string. It shows examples of how array query parameters might be passed.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_3

LANGUAGE: TypeScript
CODE:
```
const demo4 = new Elysia()
 	.guard({
        query: t.Object({
            name: t.Array(t.String()),
            squad: t.String()
        })
    })
    .get('/query?name=rapi,anis,neon&squad=counter', ({ query: { id } }) => id)
    .get('/query?name=rapi&name=anis&name=neon&squad=counter', ({ query: { id } }) => id)
```

----------------------------------------

TITLE: Request Parameter Transformation in Elysia.js
DESCRIPTION: Example of using transform to convert URL parameters to numeric values before validation
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/life-cycle.md#2025-04-23_snippet_8

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
    .get('/id/:id', ({ params: { id } }) => id, {
        params: t.Object({
            id: t.Number()
        }),
        transform({ params }) {
            const id = +params.id

            if (!Number.isNaN(id)) params.id = id
        }
    })
    .listen(3000)
```

----------------------------------------

TITLE: Implementing Error Handling in Elysia Server
DESCRIPTION: This example demonstrates error handling in Elysia. It shows how to handle different error scenarios in a PATCH route, including custom error responses and type-safe body validation.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/midori.md#2025-04-23_snippet_3

LANGUAGE: typescript
CODE:
```
// server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .patch(
        '/user/profile',
        ({ body, error }) => {
            if(body.age < 18) 
                return error(400, "Oh no")

            if(body.name === 'Nagisa')
                return error(418)

            return body
        },
        {
            body: t.Object({
                name: t.String(),
                age: t.Number()
            })
        }
    )
    .listen(80)
    
export type App = typeof app
```

----------------------------------------

TITLE: Implementing Basic User Sign-up with Elysia and Prisma
DESCRIPTION: Creates a simple Elysia server with a POST endpoint for user sign-up, using Prisma to interact with the database. This version doesn't include input validation.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/with-prisma.md#2025-04-23_snippet_6

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const app = new Elysia()
    .post(
        '/sign-up',
        async ({ body }) => db.user.create({
            data: body
        })
    )
    .listen(3000)

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
```

----------------------------------------

TITLE: Handling Multiple Dynamic Path Parameters in ElysiaJS
DESCRIPTION: This example shows how to define and access multiple dynamic path parameters within a single route. Each parameter is prefixed with ':' and separated by '/', and their values are available as properties in the `params` object.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/route.md#_snippet_3

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .get('/id/:id', ({ params: { id } }) => id)
    .get('/id/:id/:name', ({ params: { id, name } }) => id + ' ' + name)
    .listen(3000)
```

----------------------------------------

TITLE: Defining a Dynamic Path Parameter in ElysiaJS
DESCRIPTION: This snippet demonstrates how to define a dynamic path parameter in ElysiaJS using the ':paramName' syntax. The value of the dynamic segment is captured and made available in the `params` object within the handler function.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/route.md#_snippet_2

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .get('/id/:id', ({ params: { id } }) => id)
    .listen(3000)
```

----------------------------------------

TITLE: Using Eden Treaty for GET Requests in TypeScript with ElysiaJS
DESCRIPTION: This example demonstrates how to use Eden Treaty for GET requests, which only accept additional parameters like headers.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/treaty/parameters.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { treaty } from '@elysiajs/eden'

const app = new Elysia()
    .get('/hello', () => 'hi')
    .listen(3000)

const api = treaty<typeof app>('localhost:3000')

// ✅ works
api.hello.get({
    // This is optional as not specified in schema
    headers: {
        hello: 'world'
    }
})
```

----------------------------------------

TITLE: Executing After-Response Hooks with Elysia (TypeScript)
DESCRIPTION: Utilizes Elysia's `onAfterResponse` hook to perform actions (e.g., logging or analytics) after the HTTP response is sent. Contains a handler that logs the response completion time using the `performance.now()` API. Dependencies: `elysia` package, Bun's performance timer. Output: Console logs per request.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/life-cycle.md#2025-04-23_snippet_18

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .onAfterResponse(() => {
        console.log('Response', performance.now())
    })
    .listen(3000)
```

----------------------------------------

TITLE: Integrating Swagger Documentation with Elysia
DESCRIPTION: Shows how to add Swagger documentation to an Elysia application using the Swagger plugin, including model definitions and typed endpoints.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/integrate-trpc-with-elysia.md#2025-04-23_snippet_9

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'
import { swagger } from '@elysiajs/swagger'

const app = new Elysia()
    .use(swagger())
    .setModel({
        sign: t.Object({
            username: t.String(),
            password: t.String()
        })
    })
    .get('/', () => 'Hello Elysia')
    .post('/typed-body', ({ body }) => body, {
        schema: {
            body: 'sign',
            response: 'sign'
        }
    })
    .listen(3000)

export type App = typeof app

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
```

----------------------------------------

TITLE: Inferring ElysiaJS Handler Type using InferHandler Utility (TypeScript)
DESCRIPTION: Demonstrates using the `InferHandler` utility type to infer the complete type signature for an ElysiaJS route handler. It takes the Elysia instance, the route path, and the route's schema (body, response, etc.) to provide strong typing for the handler's context, parameters, and expected return type.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/handler.md#2025-04-23_snippet_25

LANGUAGE: typescript
CODE:
```
import { Elysia, type InferHandler } from 'elysia'

const setup = new Elysia()
	.state('a', 'a')
	.decorate('b', 'b')

type Handler = InferHandler<
	// Elysia instance to based on
	typeof setup,
	// path
	'/path',
	// schema
	{
		body: string
		response: {
			200: string
		}
	}
>

const handler: Handler = ({ body }) => body

const app = new Elysia()
	.get('/', handler)
```

----------------------------------------

TITLE: Request Dependent Service Implementation
DESCRIPTION: Shows the recommended way of implementing a service that depends on request context using Elysia instance.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/structure.md#2025-04-23_snippet_5

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const AuthService = new Elysia({ name: 'Service.Auth' })
    .derive({ as: 'scoped' }, ({ cookie: { session } }) => ({
        Auth: {
            user: session.value
        }
    }))
    .macro(({ onBeforeHandle }) => ({
        isSignIn(value: boolean) {
            onBeforeHandle(({ Auth, error }) => {
                if (!Auth?.user || !Auth.user) return error(401)
            })
        }
    }))

const UserController = new Elysia()
    .use(AuthService)
    .get('/profile', ({ Auth: { user } }) => user, {
    	isSignIn: true
    })
```

----------------------------------------

TITLE: Basic Response Handling in Elysia
DESCRIPTION: Demonstrates basic response handling in Elysia using both implicit and explicit Response objects.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/handler.md#2025-04-23_snippet_10

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    // Equivalent to "new Response('hi')"
    .get('/', () => 'hi')
    .listen(3000)
```

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .get('/', () => new Response('hi'))
    .listen(3000)
```

----------------------------------------

TITLE: Composing Multiple Elysia Projects
DESCRIPTION: Shows how to combine multiple existing Elysia projects into a single application using the mount method, allowing for modular application composition.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-06.md#2025-04-23_snippet_8

LANGUAGE: typescript
CODE:
```
import A from 'project-a/elysia'
import B from 'project-b/elysia'
import C from 'project-c/elysia'

new Elysia()
    .mount(A)
    .mount(B)
    .mount(C)
```

----------------------------------------

TITLE: Automatic JSON Response Handling
DESCRIPTION: Example of Elysia's automatic JSON response conversion
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/cheat-sheet.md#2025-04-23_snippet_3

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .get('/json', () => {
        return {
            hello: 'Elysia'
        }
    })
    .listen(3000)
```

----------------------------------------

TITLE: Initializing ElysiaJS with the Static Plugin
DESCRIPTION: This TypeScript snippet demonstrates the basic integration of the `@elysiajs/static` plugin into an ElysiaJS application. It imports `Elysia` and `staticPlugin`, creates a new Elysia instance, registers the plugin using `.use(staticPlugin())`, and starts the server on port 3000. By default, this serves files from the 'public' directory under the '/public' URL prefix.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/static.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { staticPlugin } from '@elysiajs/static'

new Elysia()
    .use(staticPlugin())
    .listen(3000)
```

----------------------------------------

TITLE: Validating Request Cookies in Elysia
DESCRIPTION: This snippet illustrates how to use TypeBox (`t.Cookie({ cookieName: t.String() })`) to define a schema for expected request cookies. It requires the `cookieName` cookie to be present and a string. Cookies, like headers, have `additionalProperties` true by default.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_18

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/cookie', ({ cookie }) => cookie, {
                     // ^?



		cookie: t.Cookie({
			cookieName: t.String()
		})
	})
```

----------------------------------------

TITLE: Setting Up WebSocket Server in Elysia
DESCRIPTION: This code shows how to create a WebSocket endpoint in an Elysia server. It defines a chat endpoint with message handling and type definitions for both request and response bodies.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/treaty/legacy.md#2025-04-23_snippet_6

LANGUAGE: typescript
CODE:
```
// Server
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .ws('/chat', {
        message(ws, message) {
            ws.send(message)
        },
        body: t.String(),
        response: t.String()
    })
    .listen(3000)

type App = typeof app
```

----------------------------------------

TITLE: Handling 404 Error in Elysia (TypeScript)
DESCRIPTION: Demonstrates how to use the `onError` lifecycle hook in Elysia to intercept the 'NOT_FOUND' error code and return a custom response instead of the default 404 page.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/route.md#_snippet_10

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .get('/', 'hi')
    .onError(({ code }) => {
        if (code === 'NOT_FOUND') {
            return 'Route not found :('
        }
    })
    .listen(3000)
```

----------------------------------------

TITLE: Creating an Authentication Macro in ElysiaJS v2
DESCRIPTION: Shows how to create an authentication macro in v2 that adds user data to the context. This example demonstrates using resolve to add properties to the context.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/macro.md#2025-04-23_snippet_5

LANGUAGE: typescript
CODE:
```
// @filename: auth.ts
import { Elysia } from 'elysia'

export const auth = new Elysia()
    .macro({
    	isAuth: {
      		resolve() {
     			return {
         			user: 'saltyaom'
          		}
      		}
        },
        role(role: 'admin' | 'user') {
        	return {}
        }
    })

// @filename: index.ts
// ---cut---
import { Elysia } from 'elysia'
import { auth } from './auth'

const app = new Elysia()
    .use(auth)
    .get('/', ({ user }) => user, {
                          // ^?
        isAuth: true,
        role: 'admin'
    })
```

----------------------------------------

TITLE: Enable TypeScript Strict Mode - JSON
DESCRIPTION: Configure your `tsconfig.json` to enable strict mode. This is often required for Eden's type inference to function correctly.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/installation.md#_snippet_3

LANGUAGE: json
CODE:
```
{
  "compilerOptions": {
    "strict": true // [!code ++]
  }
}
```

----------------------------------------

TITLE: Authorizing Post Creation by Extracting User ID via Supabase in Elysia - TypeScript
DESCRIPTION: Enhances the '/post/create' endpoint to extract the user ID from cookies using Supabase authentication. It first attempts to get the user from the access_token, and if it fails, refreshes the session using refresh_token. The user ID is then intended to be associated with the post creation. Dependencies: Elysia, Supabase client, '@elysiajs/cookie' middleware. Inputs include 'access_token' and 'refresh_token' cookies as well as a post detail in the body; outputs are the created row's ID or an error. Limitation: the complete wiring of userId to the database operation is indicated but not finalized in the sample.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-supabase.md#2025-04-23_snippet_12

LANGUAGE: TypeScript
CODE:
```
import { Elysia, t } from 'elysia'
import { cookie } from '@elysiajs/cookie' // [!code ++]

import { supabase } from '../../libs'

export const post = (app: Elysia) =>
    app.group('/post', (app) =>
        app.put(
            '/create',
            async ({ body }) => {
                let userId: string // [!code ++]
   // [!code ++]
                const { data, error } = await supabase.auth.getUser( // [!code ++]
                    access_token // [!code ++]
                ) // [!code ++]
   // [!code ++]
                if(error) { // [!code ++]
                    const { data, error } = await supabase.auth.refreshSession({ // [!code ++]
                        refresh_token // [!code ++]
                    }) // [!code ++]
   // [!code ++]
                    if (error) throw error // [!code ++]
   // [!code ++]
                    userId = data.user!.id // [!code ++]
                } // [!code ++]

                const { data, error } = await supabase
                    .from('post')
                    .insert({
                        // Add user_id somehow
                        // user_id: userId,
                        ...body
                    })
                    .select('id')

                if (error) throw error

                return data[0]
            },
            {
                schema: {
                    body: t.Object({
                        detail: t.String()
                    })
                }
            }
        )
    )
```

----------------------------------------

TITLE: Using Elysia.error for Throwing vs. Returning Errors (TypeScript)
DESCRIPTION: Illustrates Elysia's convention for returning versus throwing errors using the built-in `error` helper. An `onError` handler is configured to catch thrown errors, while returned errors bypass `onError`. Demonstrates both approaches via two GET endpoints (`/throw` and `/return`). Dependencies: `elysia` package. Inputs are requests to the two different endpoints; outputs are either caught or uncaught error handling.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/life-cycle.md#2025-04-23_snippet_15

LANGUAGE: typescript
CODE:
```
import { Elysia, file } from 'elysia'

new Elysia()
    .onError(({ code, error, path }) => {
        if (code === 418) return 'caught'
    })
    .get('/throw', ({ error }) => {
        // This will be caught by onError
        throw error(418)
    })
    .get('/return', () => {
        // This will NOT be caught by onError
        return error(418)
    })
```

----------------------------------------

TITLE: Apply Parameter Validation with Elysia Guard (TypeScript)
DESCRIPTION: Demonstrates how to use the `.guard()` method in ElysiaJS to apply a shared validation schema (here, for route parameters) to all subsequent routes defined within the same plugin instance. This simplifies validation logic for routes with common parameter requirements.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_18

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

class Note {
    constructor(public data: string[] = ['Moonhalo']) {}

    add(note: string) {
        this.data.push(note)

        return this.data
    }

    remove(index: number) {
        return this.data.splice(index, 1)
    }

    update(index: number, note: string) {
        return (this.data[index] = note)
    }
}

export const note = new Elysia({ prefix: '/note' })
    .decorate('note', new Note())
    .get('/', ({ note }) => note.data)
    .put('/', ({ note, body: { data } }) => note.add(data), {
        body: t.Object({
            data: t.String()
        })
    })
    .guard({
        params: t.Object({
            index: t.Number()
        })
    })
    .get(
        '/:index',
        ({ note, params: { index }, error }) => {
            return note.data[index] ?? error(404, 'Not Found :(')
        }
    )
    .delete(
        '/:index',
        ({ note, params: { index }, error }) => {
            if (index in note.data) return note.remove(index)

            return error(422)
        }
    )
    .patch(
        '/:index',
        ({ note, params: { index }, body: { data }, error }) => {
            if (index in note.data) return note.update(index, data)

            return error(422)
        },
        {
            body: t.Object({
                data: t.String()
            })
        }
    )
```

----------------------------------------

TITLE: Creating Plugins with Elysia Instances (New Approach)
DESCRIPTION: Demonstrates the new plugin model in Elysia 0.6 that allows turning any Elysia instance into a plugin directly, eliminating the need for callback functions and improving code organization.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-06.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
const plugin = new Elysia()
    .get('/', () => 'hello')
```

----------------------------------------

TITLE: Returning Errors from ElysiaJS Derive Function in TypeScript
DESCRIPTION: Demonstrates how to return an error early from the `derive` lifecycle hook in ElysiaJS. If the 'authorization' header is missing, it returns a 400 Bad Request error; otherwise, it derives a 'bearer' token property for the context.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/handler.md#2025-04-23_snippet_15

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .derive(({ headers, error }) => {
        const auth = headers['authorization']

        if(!auth) return error(400)

        return {
            bearer: auth?.startsWith('Bearer ') ? auth.slice(7) : null
        }
    })
    .get('/', ({ bearer }) => bearer)
```

----------------------------------------

TITLE: JWT Implementation with Cookie Authentication
DESCRIPTION: Example of implementing JWT authentication using cookies in ElysiaJS, including sign-in and profile verification endpoints
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/jwt.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'

const app = new Elysia()
    .use(
        jwt({
            name: 'jwt',
            secret: 'Fischl von Luftschloss Narfidort'
        })
    )
    .get('/sign/:name', async ({ jwt, params: { name }, cookie: { auth } }) => {
    	const value = await jwt.sign({ name })

        auth.set({
            value,
            httpOnly: true,
            maxAge: 7 * 86400,
            path: '/profile',
        })

        return `Sign in as ${value}`
    })
    .get('/profile', async ({ jwt, error, cookie: { auth } }) => {
        const profile = await jwt.verify(auth.value)

        if (!profile)
            return error(401, 'Unauthorized')

        return `Hello ${profile.name}`
    })
    .listen(3000)
```

----------------------------------------

TITLE: Running Tests for Elysia Applications with Bun
DESCRIPTION: Shows the command to run tests for Elysia applications using Bun's test runner.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/index.md#2025-04-23_snippet_8

LANGUAGE: bash
CODE:
```
$ bun test
```

----------------------------------------

TITLE: Registering Authentication Middleware in Elysia Root Server - TypeScript
DESCRIPTION: Demonstrates how to attach the authentication module as middleware to the Elysia server and start listening on port 3000. It shows server initialization flow, registration order, and outputs the live server address. Dependencies are Elysia and the custom 'auth' module from './modules'. Input is programmatic use only; no explicit parameters are provided. Limitation: 'auth' must be implemented and imported correctly.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-supabase.md#2025-04-23_snippet_10

LANGUAGE: TypeScript
CODE:
```
import { Elysia, t } from 'elysia'

import { auth } from './modules' // [!code ++]

const app = new Elysia()
    .use(auth) // [!code ++]
    .listen(3000)

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
```

----------------------------------------

TITLE: Making Route Parameters Optional with Elysia t.Optional
DESCRIPTION: Demonstrates how to use `t.Optional` in Elysia route schemas (query, body, headers) to allow clients to omit a field. Contrasts this with TypeBox's use of optional for object properties.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/type.md#_snippet_23

LANGUAGE: TypeScript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/optional', ({ query }) => query, {
                       // ^?




		query: t.Optional(
			t.Object({
				name: t.String()
			})
		)
	})
```

----------------------------------------

TITLE: Using Eden Fetch Client
DESCRIPTION: Demonstrates how to use Eden Fetch to make type-safe API requests to the Elysia server. Shows examples of GET and POST requests with proper typing.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/fetch.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
import { edenFetch } from '@elysiajs/eden'
import type { App } from './server'

const fetch = edenFetch<App>('http://localhost:3000')

// response type: 'Hi Elysia'
const pong = await fetch('/hi', {})

// response type: 1895
const id = await fetch('/id/:id', {
    params: {
        id: '1895'
    }
})

// response type: { id: 1895, name: 'Skadi' }
const nendoroid = await fetch('/mirror', {
    method: 'POST',
    body: {
        id: 1895,
        name: 'Skadi'
    }
})
```

----------------------------------------

TITLE: Setting Default Headers in Elysia
DESCRIPTION: Shows how to set default headers in Elysia using the new headers API, which improves performance by setting headers directly instead of using onRequest handlers.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-08.md#2025-04-23_snippet_7

LANGUAGE: typescript
CODE:
```
new Elysia()
    .headers({
        'X-Powered-By': 'Elysia'
    })
```

----------------------------------------

TITLE: Deriving Types from ElysiaJS Models using typeof .static (TypeScript)
DESCRIPTION: Demonstrates the recommended method for obtaining a static TypeScript type from an ElysiaJS model schema defined using `t.Object`. Instead of manually declaring a separate type, use `typeof model.static` to ensure type consistency and reduce redundancy. Requires the 'elysia' package.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/best-practice.md#2025-04-23_snippet_12

LANGUAGE: typescript
CODE:
```
// ❌ Don't
import { Elysia, t } from 'elysia'

const customBody = t.Object({
	username: t.String(),
	password: t.String()
})

type CustomBody = {
	username: string
	password: string
}

// ✅ Do
const customBody = t.Object({
	username: t.String(),
	password: t.String()
})

type CustomBody = typeof customBody.static
```

----------------------------------------

TITLE: Implementing Custom Error Handling in ElysiaJS with Prisma
DESCRIPTION: Example of handling Prisma's unique constraint violation errors using ElysiaJS's onError hook. Shows how to return custom error messages when username duplication occurs.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/with-prisma.md#2025-04-23_snippet_8

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const app = new Elysia()
    .post(
        '/',
        async ({ body }) => db.user.create({
            data: body
        }),
        {
            error({ code }) {
                switch (code) {
                    case 'P2002':
                        return {
                            error: 'Username must be unique'
                        }
                }
            },
            body: t.Object({
                username: t.String(),
                password: t.String({
                    minLength: 8
                })
            })
        }
    )
    .listen(3000)

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
```

----------------------------------------

TITLE: Defining Union Types with TypeBox and TypeScript
DESCRIPTION: Demonstrates how to define a type that can be one of multiple types using TypeBox's `t.Union` and its equivalent TypeScript syntax.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/type.md#_snippet_12

LANGUAGE: typescript
CODE:
```
t.Union([
    t.String(),
    t.Number()
])
```

LANGUAGE: typescript
CODE:
```
string | number
```

----------------------------------------

TITLE: Programmatically Testing Elysia Routes with Elysia.handle
DESCRIPTION: Shows how to use Elysia.handle to programmatically simulate an incoming request to the Elysia application and process it, useful for testing or simulation.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/route.md#_snippet_9

LANGUAGE: TypeScript
CODE:
```
import { Elysia } from 'elysia'

const app = new Elysia()
    .get('/', 'hello')
    .post('/hi', 'hi')
    .listen(3000)

app.handle(new Request('http://localhost/')).then(console.log)
```

----------------------------------------

TITLE: Basic WebSocket Setup in ElysiaJS
DESCRIPTION: Demonstrates the basic setup of a WebSocket endpoint that echoes back received messages.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/websocket.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .ws('/ws', {
        message(ws, message) {
            ws.send(message)
        }
    })
    .listen(3000)
```

----------------------------------------

TITLE: Defining Strict Response Schema in Elysia
DESCRIPTION: Demonstrates how to define a strict response schema for different HTTP status codes using Elysia's schema validation. This example shows a POST route with specific response types for 200 and 400 status codes.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-04.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
app.post('/strict-status', process, {
    schema: {
        response: {
            200: t.String(),
            400: t.Number()
        }
    }
})
```

----------------------------------------

TITLE: FormData Handling in Elysia
DESCRIPTION: Shows how to return FormData and files using Elysia's form and file utilities.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/handler.md#2025-04-23_snippet_11

LANGUAGE: typescript
CODE:
```
import { Elysia, form, file } from 'elysia'

new Elysia()
	.get('/', () => form({
		name: 'Tea Party',
		images: [file('nagi.web'), file('mika.webp')]
	}))
	.listen(3000)
```

LANGUAGE: typescript
CODE:
```
import { Elysia, file } from 'elysia'

new Elysia()
	.get('/', file('nagi.web'))
	.listen(3000)
```

----------------------------------------

TITLE: Define User Profile Route with Elysia
DESCRIPTION: Creates an Elysia instance `user` with a `/user` prefix, uses the `getUserId` instance to get the username, and defines a GET route `/profile` that returns the success status and the resolved username.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_60

LANGUAGE: TypeScript
CODE:
```
export const user = new Elysia({ prefix: '/user' })
    .use(getUserId)
    .get('/profile', ({ username }) => ({
        success: true,
        username
    }))
```

----------------------------------------

TITLE: File Upload Handling
DESCRIPTION: Demonstrates how to handle file uploads with validation
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/cheat-sheet.md#2025-04-23_snippet_8

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
	.post('/body', ({ body }) => body, {
		body: t.Object({
			file: t.File({ format: 'image/*' }),
			multipleFiles: t.Files()
		})
	})
	.listen(3000)
```

----------------------------------------

TITLE: Defining Object with Number Property Schema in ElysiaJS (TypeScript)
DESCRIPTION: This snippet shows how to define a schema for an object with a specific structure using `Elysia.t.Object()`. It defines an object that must have a property `x` which is validated as a number. This corresponds to a TypeScript object type `{ x: number }`.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/type.md#_snippet_5

LANGUAGE: typescript
CODE:
```
t.Object({
    x: t.Number()
})
```

----------------------------------------

TITLE: Mapping and Compressing HTTP Responses with Elysia (TypeScript)
DESCRIPTION: Implements the `mapResponse` lifecycle hook in Elysia to compress outgoing responses using gzip. The provided function serializes and encodes responses conditionally (JSON or string), applies gzip compression with Bun, and returns them with appropriate headers. Dependencies: `elysia` and Bun runtime; expects an Elysia context and utilizes the `TextEncoder` API. Routes "/text" and "/json" are demonstrated. Output is compressed HTTP responses with accurate `Content-Encoding` and `Content-Type` headers.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/life-cycle.md#2025-04-23_snippet_12

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const encoder = new TextEncoder()

new Elysia()
    .mapResponse(({ response, set }) => {
        const isJson = typeof response === 'object'

        const text = isJson
            ? JSON.stringify(response)
            : (response?.toString() ?? '')

        set.headers['Content-Encoding'] = 'gzip'

        return new Response(Bun.gzipSync(encoder.encode(text)), {
            headers: {
                'Content-Type': `${
                    isJson ? 'application/json' : 'text/plain'
                }; charset=utf-8`
            }
        })
    })
    .get('/text', () => 'mapResponse')
    .get('/json', () => ({ map: 'response' }))
    .listen(3000)
```

----------------------------------------

TITLE: Decorating Elysia Instance with Singleton Class (TypeScript)
DESCRIPTION: Demonstrates how to use the `decorate` method to attach a singleton instance of a custom class (`Note`) to the Elysia application context, making it accessible within route handlers. This allows sharing state or functionality across different routes.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_9

LANGUAGE: TypeScript
CODE:
```
import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';

class Note {
    constructor(public data: string[] = ['Moonhalo']) {}
}

const app = new Elysia()
    .use(swagger())
    .decorate('note', new Note())
    .get('/note', ({ note }) => note.data)
    .listen(3000);
```

----------------------------------------

TITLE: Customizing Validation Error Handling in Elysia
DESCRIPTION: Illustrates how to implement custom error handling for validation errors in Elysia. This example shows how to return different responses for 'NOT_FOUND' and 'VALIDATION' error codes, including detailed field errors for validation failures.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-04.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
new Elysia()
    .onError(({ code, error, set }) => {
        if (code === 'NOT_FOUND') {
            set.status = 404

            return 'Not Found :('
        }

        if (code === 'VALIDATION') {
            set.status = 400

            return {
                fields: error.all()
            }
        }
    })
    .post('/sign-in', () => 'hi', {
        schema: {
            body: t.Object({
                username: t.String(),
                password: t.String()
            })
        }
    })
    .listen(3000)
```

----------------------------------------

TITLE: Exporting Elysia Server Type for Client Consumption
DESCRIPTION: This snippet demonstrates how to set up an Elysia server and export its type for client-side consumption with Eden Treaty. It includes route definitions with various HTTP methods and parameter types.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/treaty/legacy.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
// server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/', () => 'Hi Elysia')
    .get('/id/:id', ({ params: { id } }) => id)
    .post('/mirror', ({ body }) => body, {
        body: t.Object({
            id: t.Number(),
            name: t.String()
        })
    })
    .listen(3000)

export type App = typeof app // [!code ++]
```

----------------------------------------

TITLE: Creating Route Groups with Prefixed Elysia Instances (New Approach)
DESCRIPTION: Demonstrates the simplified route group creation in Elysia 0.6 using the prefix option with an Elysia instance, reducing nesting and improving readability.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-06.md#2025-04-23_snippet_3

LANGUAGE: typescript
CODE:
```
// >= 0.6
const group = new Elysia({ prefix: '/v1' })
    .get('/hello', () => 'Hello World')
```

----------------------------------------

TITLE: Grouping Routes with Prefix and Guard in Elysia (TypeScript)
DESCRIPTION: Shows how to apply a guard (like body schema validation) to an entire group of routes by passing the guard object as the second parameter to the `Elysia.group` method.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/route.md#_snippet_13

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
    .group(
        '/user',
        {
            body: t.Literal('Rikuhachima Aru')
        },
        (app) => app
            .post('/sign-in', 'Sign in')
            .post('/sign-up', 'Sign up')
            .post('/profile', 'Profile')
    )
    .listen(3000)
```

----------------------------------------

TITLE: Enabling Ahead of Time Compilation in Elysia (TypeScript)
DESCRIPTION: Illustrates how to enable Ahead of Time (AOT) compilation for Elysia routes by setting the `aot` option to `true` in the constructor configuration. AOT compilation can optimize performance by precompiling routes.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/configuration.md#_snippet_2

LANGUAGE: TypeScript
CODE:
```
import { Elysia } from 'elysia'

new Elysia({
	aot: true
})
```

----------------------------------------

TITLE: Elysia Guard and Resolve for User ID (TypeScript)
DESCRIPTION: An Elysia plugin that demonstrates using `.guard` for access control and `.resolve` to extract user information (username) from the session store based on a session token provided in a cookie. This pattern allows reusing authentication logic across multiple routes.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_32

LANGUAGE: TypeScript
CODE:
```
export const getUserId = new Elysia()
    .use(userService)
    .guard({
    	as: 'scoped', // [!code --]
    	isSignIn: true,
        cookie: 'session'
    })
    .resolve(
   		{ as: 'scoped' }, // [!code --]
    	({ store: { session }, cookie: { token } }) => ({
    	   	username: session[token.value]
    	})
    )
    .as('scoped') // [!code ++]
```

----------------------------------------

TITLE: Response Redirection
DESCRIPTION: Demonstrates how to implement response redirection
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/cheat-sheet.md#2025-04-23_snippet_12

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .get('/', () => 'hi')
    .get('/redirect', ({ redirect }) => {
        return redirect('/')
    })
    .listen(3000)
```

----------------------------------------

TITLE: Lifecycle Hooks Implementation
DESCRIPTION: Shows how to use lifecycle hooks for request handling
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/cheat-sheet.md#2025-04-23_snippet_9

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
    .onRequest(() => {
        console.log('On request')
    })
    .on('beforeHandle', () => {
        console.log('Before handle')
    })
    .post('/mirror', ({ body }) => body, {
        body: t.Object({
            username: t.String(),
            password: t.String()
        }),
        afterHandle: () => {
            console.log("After handle")
        }
    })
    .listen(3000)
```

----------------------------------------

TITLE: Appending Response Headers in ElysiaJS
DESCRIPTION: Shows how to append custom headers to the response using the set.headers property in an ElysiaJS handler.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/handler.md#2025-04-23_snippet_6

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .get('/', ({ set }) => {
        set.headers['x-powered-by'] = 'Elysia'

        return 'a mimir'
    })
    .listen(3000)
```

----------------------------------------

TITLE: Implement Request Logging with Elysia onTransform Lifecycle (TypeScript)
DESCRIPTION: Illustrates the use of the `.onTransform()` lifecycle hook in ElysiaJS to execute logic before route validation. This example logs details of incoming requests, providing visibility into the request flow before potential validation errors occur.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_19

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

class Note {
    constructor(public data: string[] = ['Moonhalo']) {}

    add(note: string) {
        this.data.push(note)

        return this.data
    }

    remove(index: number) {
        return this.data.splice(index, 1)
    }

    update(index: number, note: string) {
        return (this.data[index] = note)
    }
}
export const note = new Elysia({ prefix: '/note' })
    .decorate('note', new Note())
    .onTransform(function log({ body, params, path, request: { method } }) {
        console.log(`${method} ${path}`, {
            body,
            params
        })
    })
    .get('/', ({ note }) => note.data)
    .put('/', ({ note, body: { data } }) => note.add(data), {
        body: t.Object({
            data: t.String()
        })
    })
    .guard({
        params: t.Object({
            index: t.Number()
        })
    })
    .get('/:index', ({ note, params: { index }, error }) => {
        return note.data[index] ?? error(404, 'Not Found :(')
    })
    .delete('/:index', ({ note, params: { index }, error }) => {
        if (index in note.data) return note.remove(index)

        return error(422)
    })
    .patch(
        '/:index',
        ({ note, params: { index }, body: { data }, error }) => {
            if (index in note.data) return note.update(index, data)

            return error(422)
        },
        {
            body: t.Object({
                data: t.String()
            })
        }
    )
```

----------------------------------------

TITLE: Rate Limiter Implementation with onRequest
DESCRIPTION: Example showing how to implement rate limiting using the onRequest lifecycle event.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/life-cycle.md#2025-04-23_snippet_3

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .use(rateLimiter)
    .onRequest(({ rateLimiter, ip, set, error }) => {
        if (rateLimiter.check(ip)) return error(420, 'Enhance your calm')
    })
    .get('/', () => 'hi')
    .listen(3000)
```

----------------------------------------

TITLE: Grouping ElysiaJS Models for Organization (TypeScript)
DESCRIPTION: Illustrates how to group multiple ElysiaJS model definitions (e.g., `t.Object` for request/response schemas) into a single JavaScript object literal. This improves code organization and allows accessing models through a common namespace (e.g., `AuthModel.sign`). Requires the 'elysia' package and its 't' type builder.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/best-practice.md#2025-04-23_snippet_13

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

export const AuthModel = {
	sign: t.Object({
		username: t.String(),
		password: t.String()
	})
}

const models = AuthModel.models
```

----------------------------------------

TITLE: Client-side Implementation with Eden for Type-safe API Calls
DESCRIPTION: Demonstrates how to use the Eden client library to make type-safe API calls to an Elysia server without code generation.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/at-glance.md#2025-04-23_snippet_5

LANGUAGE: typescript
CODE:
```
// client.ts
import { treaty } from '@elysiajs/eden'
import type { App } from './server'

const app = treaty<App>('localhost:3000')

// Get data from /user/617
const { data } = await app.user({ id: 617 }).get()
      // ^?

console.log(data)
```

----------------------------------------

TITLE: Testing ElysiaJS Controllers (TypeScript)
DESCRIPTION: Demonstrates how to test ElysiaJS controllers using the handle method to directly call a function and its lifecycle. This approach allows for proper unit testing of controller functionality.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/best-practice.md#2025-04-23_snippet_4

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { Service } from './service'

import { describe, it, should } from 'bun:test'

const app = new Elysia()
    .get('/', ({ stuff }) => {
        Service.doStuff(stuff)

        return 'ok'
    })

describe('Controller', () => {
	it('should work', async () => {
		const response = await app
			.handle(new Request('http://localhost/'))
			.then((x) => x.text())

		expect(response).toBe('ok')
	})
})
```

----------------------------------------

TITLE: Nested Group and Guard (ElysiaJS) - TypeScript
DESCRIPTION: Shows how to combine route grouping with `Elysia.group('/v1', ...)` and schema application using `Elysia.guard({...}, ...)` within the group's scope. This applies a body schema to a route like `/v1/student` defined inside the guarded group.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/plugin.md#_snippet_7

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
    .group('/v1', (app) =>
        app.guard(
            {
                body: t.Literal('Rikuhachima Aru')
            },
            (app) => app.post('/student', ({ body }) => body)
        )
    )
    .listen(3000)
```

----------------------------------------

TITLE: Defining and Using a Functional Callback Plugin in Elysia
DESCRIPTION: Demonstrates how to define a plugin as a functional callback that accepts the Elysia instance and modifies it, allowing access to the main instance's properties like state. The plugin adds a state property and a GET route.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/plugin.md#_snippet_0

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const plugin = (app: Elysia) => app
    .state('counter', 0)
    .get('/plugin', () => 'Hi')

const app = new Elysia()
    .use(plugin)
    .get('/counter', ({ store: { counter } }) => counter)
    .listen(3000)
```

----------------------------------------

TITLE: Define Elysia.js Plugin (note.ts)
DESCRIPTION: Defines an Elysia.js plugin in a separate file (`note.ts`) that includes a decorator and routes related to 'notes'. This plugin can be applied to a main Elysia instance for modularity.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_14

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

class Note {
    constructor(public data: string[] = ['Moonhalo']) {}
}

export const note = new Elysia()
    .decorate('note', new Note())
    .get('/note', ({ note }) => note.data)
    .get(
        '/note/:index',
        ({ note, params: { index }, error }) => {
            return note.data[index] ?? error(404, 'oh no :(')
        },
        {
            params: t.Object({
                index: t.Number()
            })
        }
    )
```

----------------------------------------

TITLE: Sending Emails with Nodemailer in ElysiaJS
DESCRIPTION: Implementation for sending the OTP email using Nodemailer as the email provider. It renders the React component to HTML and sends it via SMTP.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/react-email.md#2025-04-23_snippet_5

LANGUAGE: tsx
CODE:
```
import { Elysia, t } from 'elysia'

import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import OTPEmail from './emails/otp'

import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  	host: 'smtp.gehenna.sh',
  	port: 465,
  	auth: {
  		user: 'makoto',
  		pass: '12345678'
  	}
})

new Elysia()
	.get('/otp', ({ body }) => {
		// Random between 100,000 and 999,999
  		const otp = ~~(Math.random() * (900_000 - 1)) + 100_000

		const html = renderToStaticMarkup(<OTPEmail otp={otp} />)

        await transporter.sendMail({
        	from: 'ibuki@gehenna.sh',
           	to: body,
           	subject: 'Verify your email address',
            html,
        })

        return { success: true }
	}, {
		body: t.String({ format: 'email' })
	})
	.listen(3000)
```

----------------------------------------

TITLE: Lifecycle Event Order Demonstration
DESCRIPTION: Shows the execution order of different lifecycle events in Elysia, demonstrating how hooks are processed in sequence.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/life-cycle.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .onBeforeHandle(() => {
        console.log('1')
    })
    .onAfterHandle(() => {
        console.log('3')
    })
    .get('/', () => 'hi', {
        beforeHandle() {
            console.log('2')
        }
    })
    .listen(3000)
```

----------------------------------------

TITLE: Defining Route Schema with Details in ElysiaJS
DESCRIPTION: Demonstrates how to define a route with schema and additional details for OpenAPI documentation.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/openapi.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'
import { swagger } from '@elysiajs/swagger'

new Elysia()
    .use(swagger())
    .post('/sign-in', ({ body }) => body, {
        body: t.Object(
            {
                username: t.String(),
                password: t.String({
                	minLength: 8,
                	description: 'User password (at least 8 characters)'
                })
            },
            {
                description: 'Expected an username and password'
            }
        ),
        detail: {
            summary: 'Sign in the user',
            tags: ['authentication']
        }
    })
```

----------------------------------------

TITLE: Defining Elysia Service with State, Models, and Macro (TypeScript)
DESCRIPTION: This snippet defines an Elysia service named 'user/service' which manages user state and sessions. It includes state properties for users and sessions, defines models for sign-in data and session cookies using Elysia's `t` (type) system, and implements a `isSignIn` macro for handling authentication checks before route execution.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_31

LANGUAGE: TypeScript
CODE:
```
// @errors: 2538
import { Elysia, t } from 'elysia'

export const userService = new Elysia({ name: 'user/service' })
    .state({
        user: {} as Record<string, string>,
        session: {} as Record<number, string>
    })
    .model({
        signIn: t.Object({
            username: t.String({ minLength: 1 }),
            password: t.String({ minLength: 8 })
        }),
```

----------------------------------------

TITLE: Setting Default Values for Optional Path Parameters in Elysia (TypeScript)
DESCRIPTION: This example demonstrates how to assign a default value to an optional path parameter in Elysia using a TypeBox schema. By defining the parameter within the `params` schema and setting the `default` property on the corresponding TypeBox type, the parameter will automatically take the specified default value if it is not provided in the request URL.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-11.md#_snippet_18

LANGUAGE: TypeScript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/ok/:id?', ({ params: { id } }) => id, {
		params: t.Object({
			id: t.Number({
				default: 1
			})
		})
	})
```

----------------------------------------

TITLE: Authenticating Users with Supabase in TypeScript
DESCRIPTION: Demonstrates how to use Supabase for user authentication, including sign up and sign in functionality.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-supabase.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
supabase.auth.signUp(body)

supabase.auth.signInWithPassword(body)
```

----------------------------------------

TITLE: Retrieving Request IP in ElysiaJS Handlers
DESCRIPTION: Demonstrates how to get the request IP address using the server.requestIP method in an ElysiaJS handler.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/handler.md#2025-04-23_snippet_9

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
	.get('/ip', ({ server, request }) => {
		return server?.requestIP(request)
	})
	.listen(3000)
```

----------------------------------------

TITLE: Refining Insert and Select Schemas with Drizzle TypeBox in TypeScript
DESCRIPTION: This TypeScript snippet demonstrates defining and refining database schemas using Drizzle TypeBox within an Elysia framework project. It imports schema creation functions and utility helpers to construct strongly-typed insert and select schemas for a 'user' table. The 'email' field schema is refined to enforce a specific format constraint. Dependencies include 'elysia', 'drizzle-typebox', and local 'schema' and 'utils' modules. The 'db' object exposes refined schemas for both insert and select operations, and uses a 'spreads' utility to assemble the full schema set while respecting refined definitions.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/drizzle.md#2025-04-23_snippet_9

LANGUAGE: TypeScript
CODE:
```
import { t } from 'elysia'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'

import { table } from './schema'
import { spreads } from './utils'

export const db = {
	insert: spreads({
		user: createInsertSchema(table.user, {
			email: t.String({ format: 'email' })
		}),
	}, 'insert')),
	select: spreads({
		user: createSelectSchema(table.user, {
			email: t.String({ format: 'email' })
		})
	}, 'select')
} as const
```

----------------------------------------

TITLE: Initializing State and Decorators using Key-Value Pattern in ElysiaJS (TypeScript)
DESCRIPTION: Illustrates the key-value pattern for adding properties to the ElysiaJS context using `state` to initialize a primitive value ('counter') and `decorate` to add an instance of a class ('Logger'). This pattern enhances readability for single property assignments.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/handler.md#2025-04-23_snippet_16

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

class Logger {
    log(value: string) {
        console.log(value)
    }
}

new Elysia()
    .state('counter', 0)
    .decorate('logger', new Logger())
```

----------------------------------------

TITLE: Implementing ElysiaJS Sign-out and Profile Routes
DESCRIPTION: This code defines two ElysiaJS routes: the handler and options for a sign-out route (implicitly part of a POST request) which removes a cookie named `token`, and a GET route `/profile` which retrieves a username from the store using the `token` cookie value. It demonstrates accessing cookies and store within route handlers and handling unauthorized access.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_23

LANGUAGE: TypeScript
CODE:
```
({ cookie: { token } }) => {
    token.remove()

    return {
        success: true,
        message: 'Signed out'
    }
},
{
    cookie: 'optionalSession'
}
)
.get(
    '/profile',
    ({ cookie: { token }, store: { session }, error }) => {
        const username = session[token.value]

        if (!username)
            return error(401, {
                success: false,
                message: 'Unauthorized'
            })

        return {
            success: true,
            username
        }
    },
    {
        cookie: 'session'
    }
)
```

----------------------------------------

TITLE: Defining Nullable Type in Elysia
DESCRIPTION: Uses Elysia's `t.Nullable` to define a type that allows the value to be `null` in addition to the base type, but not `undefined`.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/type.md#_snippet_19

LANGUAGE: typescript
CODE:
```
t.Nullable(t.String())
```

----------------------------------------

TITLE: Validating Request Headers in Elysia
DESCRIPTION: This example shows how to use TypeBox (`t.Object({ authorization: t.String() })`) to define a schema for expected request headers. It requires the `authorization` header to be present and a string. Elysia parses headers with lower-case keys.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_17

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/headers', ({ headers }) => headers, {
                      // ^?




		headers: t.Object({
			authorization: t.String()
		})
	})
```

----------------------------------------

TITLE: Cookie Setup for Session Management
DESCRIPTION: Implementation of secure cookie handling for managing user sessions with configurable security options.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-supabase.md#2025-04-23_snippet_8

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'
import { cookie } from '@elysiajs/cookie'

import { supabase } from '../../libs'

const authen = (app: Elysia) =>
    app.group('/auth', (app) =>
        app
            .use(
                cookie({
                    httpOnly: true,
                    // If you need cookie to deliver via https only
                    // secure: true,
                    //
                    // If you need a cookie to be available for same-site only
                    // sameSite: "strict",
                    //
                    // If you want to encrypt a cookie
                    // signed: true,
                    // secret: process.env.COOKIE_SECRET,
                })
            )
            .setModel({
                sign: t.Object({
                    email: t.String({
                        format: 'email'
                    }),
                    password: t.String({
                        minLength: 8
                    })
                })
            })
    )
```

----------------------------------------

TITLE: Validating Path Parameters as Number in Elysia
DESCRIPTION: This snippet demonstrates how to use TypeBox (`t.Object({ id: t.Number() })`) to define a schema for path parameters. It enforces that the `id` parameter in the `/id/:id` route must be a number, enabling Elysia's validation and potential coercion.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_15

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/id/:id', ({ params }) => params, {
                      // ^?




		params: t.Object({
			id: t.Number()
		})
	})
```

----------------------------------------

TITLE: Mutating ElysiaJS State Using References vs. Values (TypeScript)
DESCRIPTION: Highlights the importance of using references when mutating state managed by ElysiaJS. Accessing `store.counter++` directly modifies the shared state correctly. In contrast, destructuring the primitive `counter` from `store` (`{ store: { counter } }`) creates a local copy, and modifying it does not affect the global state.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/handler.md#2025-04-23_snippet_23

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .state('counter', 0)
    // ✅ Using reference, value is shared
    .get('/', ({ store }) => store.counter++)
    // ❌ Creating a new variable on primitive value, the link is lost
    .get('/error', ({ store: { counter } }) => counter)
```

----------------------------------------

TITLE: Defining Drizzle Database Schema for User Table
DESCRIPTION: TypeScript code defining a PostgreSQL user table schema using Drizzle ORM with fields for id, username, password, email, salt, and creation timestamp.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/drizzle.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
import { relations } from 'drizzle-orm'
import {
    pgTable,
    varchar,
    timestamp
} from 'drizzle-orm/pg-core'

import { createId } from '@paralleldrive/cuid2'

export const user = pgTable(
    'user',
    {
        id: varchar('id')
            .$defaultFn(() => createId())
            .primaryKey(),
        username: varchar('username').notNull().unique(),
        password: varchar('password').notNull(),
        email: varchar('email').notNull().unique(),
        salt: varchar('salt', { length: 64 }).notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    }
)

export const table = {
	user
} as const

export type Table = typeof table
```

----------------------------------------

TITLE: Adding Query Parameters and Fetch Options in Eden Treaty
DESCRIPTION: This code demonstrates how to add query parameters and customize fetch options when making requests with Eden Treaty. The $query parameter is used for URL query strings, while $fetch allows setting any standard fetch API options.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/treaty/legacy.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
app.get({
    $query: {
        name: 'Eden',
        code: 'Gold'
    }
})
```

LANGUAGE: typescript
CODE:
```
app.post({
    $fetch: {
        headers: {
            'x-organization': 'MANTIS'
        }
    }
})
```

----------------------------------------

TITLE: Schema Validation for Authentication Routes
DESCRIPTION: Adding schema validation to ensure proper data structure for authentication requests using Elysia's built-in type system.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-supabase.md#2025-04-23_snippet_7

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'
import { supabase } from '../../libs'

const authen = (app: Elysia) =>
    app.group('/auth', (app) =>
        app
            .setModel({
                sign: t.Object({
                    email: t.String({
                        format: 'email'
                    }),
                    password: t.String({
                        minLength: 8
                    })
                })
            })
            .post('/sign-up', async ({ body }) => {
                const { data, error } = await supabase.auth.signUp(body)
                if (error) return error
                return data.user
            },
            {
                schema: {
                    body: 'sign'
                }
            })
            .post('/sign-in', async ({ body }) => {
                const { data, error } = await supabase.auth.signInWithPassword(body)
                if (error) return error
                return data.user
            },
            {
                schema: {
                    body: 'sign'
                }
            })
    )
```

----------------------------------------

TITLE: Use Function Handler to Access Context in Elysia
DESCRIPTION: Modifies the root route handler to use a function instead of a static value. This allows accessing the Context object, which provides route and instance information like the current path.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_6

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const app = new Elysia()
    .get('/', () => 'Hello Elysia') // [!code --]
    .get('/', ({ path }) => path) // [!code ++]
    .post('/hello', 'Do you miss me?')
    .listen(3000)
```

----------------------------------------

TITLE: Schema Validation with Elysia.t
DESCRIPTION: Shows how to use Elysia's schema builder to validate that a path parameter is numeric at both runtime and compile-time.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/at-glance.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
    .get('/user/:id', ({ params: { id } }) => id, {
                                // ^?
        params: t.Object({
            id: t.Numeric()
        })
    })
    .listen(3000)
```

----------------------------------------

TITLE: Elysia Route Composition with Guard/Resolve (TypeScript)
DESCRIPTION: Defines an Elysia plugin that composes with the `getUserId` plugin. It creates a `/profile` route that accesses the `username` resolved by `getUserId`, demonstrating how to reuse authentication logic defined in a separate plugin.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_33

LANGUAGE: TypeScript
CODE:
```
export const user = new Elysia({ prefix: '/user' })
	.use(getUserId)
	.get('/profile', ({ username }) => ({
        success: true,
        username
    }))
```

----------------------------------------

TITLE: Creating Custom Macros in Elysia for Authorization
DESCRIPTION: Shows how to create custom macros in Elysia for handling authorization. Demonstrates the use of onBeforeHandle for role-based access control.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/index.md#2025-04-23_snippet_3

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

const role = new Elysia({ name: 'macro' })
	.macro(({ onBeforeHandle }) => ({
		role(type: 'user' | 'staff' | 'admin') {
			onBeforeHandle(({ headers, error }) => {
				if(headers.authorization !== type)
					return error(401)
			})
		}
	}))

new Elysia()
	.use(role)
	.get('/admin/check', 'ok', {
        r
      // ^|
	})
	.listen(3000)
```

----------------------------------------

TITLE: Elysia Guard/Resolve Session Check (TypeScript)
DESCRIPTION: This code snippet shows logic typically used within an Elysia guard or resolve function to check for a valid session token in cookies, retrieve the associated username from the session store, and return an unauthorized error if the session is invalid or missing.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_45

LANGUAGE: TypeScript
CODE:
```
return error(401, {
    success: false,
    message: 'Unauthorized'
})

const username = session[token.value as unknown as number]

if (!username)
    return error(401, {
        success: false,
        message: 'Unauthorized'
    })
```

----------------------------------------

TITLE: Initializing OpenTelemetry Plugin with Custom Processors - ElysiaJS - Typescript
DESCRIPTION: This snippet demonstrates how to initialize the @elysiajs/opentelemetry plugin in an Elysia application. It shows importing necessary modules, creating an Elysia instance, and applying the plugin with a custom configuration that uses a BatchSpanProcessor and an OTLPTraceExporter for sending trace data.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/opentelemetry.md#_snippet_0

LANGUAGE: Typescript
CODE:
```
import { Elysia } from 'elysia'
import { opentelemetry } from '@elysiajs/opentelemetry'

import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'

new Elysia()
	.use(
		opentelemetry({
			spanProcessors: [
				new BatchSpanProcessor(
					new OTLPTraceExporter()
				)
			]
		})
	)
```

----------------------------------------

TITLE: Comparing Hook/Schema Scoping in Elysia 1.0 vs 1.1 Typescript
DESCRIPTION: Contrasts the method of applying scoped hooks and schemas in Elysia 1.0, which required setting 'as: 'scoped'' on each individual hook, with the approach in Elysia 1.1. The new version allows defining hooks/schemas within 'guard' and then using 'as('plugin')' to lift their scope in bulk, simplifying configuration.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-11.md#_snippet_15

LANGUAGE: Typescript
CODE:
```
import { Elysia, t } from 'elysia'

// On 1.0
const from = new Elysia()
	// Not possible to apply guard to parent on 1.0
	.guard({
		response: t.String()
	})
	.onBeforeHandle({ as: 'scoped' }, () => { console.log('called') })
	.onAfterHandle({ as: 'scoped' }, () => { console.log('called') })
	.onParse({ as: 'scoped' }, () => { console.log('called') })

// On 1.1
const to = new Elysia()
	.guard({
		response: t.String()
	})
	.onBeforeHandle(() => { console.log('called') })
	.onAfterHandle(() => { console.log('called') })
	.onParse(() => { console.log('called') })
	.as('plugin')
```

----------------------------------------

TITLE: Integrating OpenAPI with Elysia in TypeScript
DESCRIPTION: This snippet demonstrates how to integrate OpenAPI (Swagger) with Elysia. It shows the setup of multiple route modules and their combination with the Swagger middleware.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/midori.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { users, feed } from './controllers'

new Elysia()
    .use(swagger())
    .use(users)
    .use(feed)
    .listen(3000)
```

----------------------------------------

TITLE: Dockerize Elysia Binary with Distroless Image
DESCRIPTION: Provides a Dockerfile example for building and deploying an ElysiaJS application compiled to a binary. It uses a multi-stage build with `oven/bun` for compilation and `gcr.io/distroless/base` for the final minimal runtime image, copying only the compiled binary.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/deploy.md#_snippet_6

LANGUAGE: dockerfile
CODE:
```
FROM oven/bun AS build

WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lock bun.lock

RUN bun install

COPY ./src ./src

ENV NODE_ENV=production

RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--target bun \
	--outfile server \
	./src/index.ts

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/server server

ENV NODE_ENV=production

CMD ["./server"]

EXPOSE 3000
```

----------------------------------------

TITLE: Basic HTML and JSX Usage in ElysiaJS
DESCRIPTION: Example showing how to use both HTML strings and JSX components in ElysiaJS routes with the HTML plugin
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/html.md#2025-04-23_snippet_1

LANGUAGE: tsx
CODE:
```
import { Elysia } from 'elysia'
import { html, Html } from '@elysiajs/html'

new Elysia()
	.use(html())
	.get(
		'/html',
		() => `
            <html lang='en'>
                <head>
                    <title>Hello World</title>
                </head>
                <body>
                    <h1>Hello World</h1>
                </body>
            </html>`
	)
	.get('/jsx', () => (
		<html lang="en">
			<head>
				<title>Hello World</title>
			</head>
			<body>
				<h1>Hello World</h1>
			</body>
		</html>
	))
	.listen(3000)
```

----------------------------------------

TITLE: Registering Swagger Plugin in ElysiaJS
DESCRIPTION: Example of importing and using the Swagger plugin in an ElysiaJS application.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/openapi.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'

const app = new Elysia()
    .use(swagger())
```

----------------------------------------

TITLE: Configuring tRPC with ElysiaJS
DESCRIPTION: Example showing how to set up a tRPC router with ElysiaJS, including procedure definition and input validation using either Zod or Elysia's built-in validator.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/trpc.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia, t as T } from 'elysia'

import { initTRPC } from '@trpc/server'
import { compile as c, trpc } from '@elysiajs/trpc'

const t = initTRPC.create()
const p = t.procedure

const router = t.router({
	greet: p
		// 💡 Using Zod
		//.input(z.string())
		// 💡 Using Elysia's T
		.input(c(T.String()))
		.query(({ input }) => input)
})

export type Router = typeof router

const app = new Elysia().use(trpc(router)).listen(3000)
```

----------------------------------------

TITLE: Demonstrating Elysia Scope Levels in TypeScript
DESCRIPTION: This snippet illustrates the behavior of 'local', 'scoped', and 'global' scope levels for an `onBeforeHandle` hook across nested Elysia instances (child, current, parent, main). It shows how the hook's execution is limited based on the specified scope, affecting which instances inherit and run the hook.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/plugin.md#_snippet_12

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

// ? Value base on table value provided below
const type = 'local'

const child = new Elysia()
    .get('/child', 'hi')

const current = new Elysia()
    .onBeforeHandle({ as: type }, () => { // [!code ++]
        console.log('hi')
    })
    .use(child)
    .get('/current', 'hi')

const parent = new Elysia()
    .use(current)
    .get('/parent', 'hi')

const main = new Elysia()
    .use(parent)
    .get('/main', 'hi')
```

----------------------------------------

TITLE: Return 404 with Custom Message in Elysia.js
DESCRIPTION: Shows how to return a 404 status code along with a custom string message using the `error` function in an Elysia.js route handler when a resource is not found.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_13

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'
import { swagger } from '@elysiajs/swagger'

class Note {
    constructor(public data: string[] = ['Moonhalo']) {}
}

const app = new Elysia()
    .use(swagger())
    .decorate('note', new Note())
    .get('/note', ({ note }) => note.data)
    .get(
        '/note/:index',
        ({ note, params: { index }, error }) => {
            return note.data[index] ?? error(404, 'oh no :(') // [!code ++]
        },
        {
            params: t.Object({
                index: t.Number()
            })
        }
    )
    .listen(3000)
```

----------------------------------------

TITLE: Using ElysiaJS Instance as a Service (TypeScript)
DESCRIPTION: Shows the recommended approach of using an Elysia instance as a service. This maintains type integrity and allows for proper dependency injection while providing scoped functionality.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/best-practice.md#2025-04-23_snippet_7

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

// ✅ Do
const AuthService = new Elysia({ name: 'Service.Auth' })
    .derive({ as: 'scoped' }, ({ cookie: { session } }) => ({
    	// This is equivalent to dependency injection
        Auth: {
            user: session.value
        }
    }))
    .macro(({ onBeforeHandle }) => ({
     	// This is declaring a service method
        isSignIn(value: boolean) {
            onBeforeHandle(({ Auth, error }) => {
                if (!Auth?.user || !Auth.user) return error(401)
            })
        }
    }))

const UserController = new Elysia()
    .use(AuthService)
    .get('/profile', ({ Auth: { user } }) => user, {
    	isSignIn: true
    })
```

----------------------------------------

TITLE: Handling File Uploads in Elysia with TypeScript
DESCRIPTION: Shows how to handle file uploads in Elysia using the PATCH method. Demonstrates type inference for request body and file validation.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/index.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
	.patch('/profile', ({ body }) => body.profile, {
	                    // ^?




		body: t.Object({
			id: t.Number(),
			profile: t.File({ type: 'image' })
		})
	})
	.listen(3000)
```

----------------------------------------

TITLE: Example of Prefixing Routes in Elysia (TypeScript)
DESCRIPTION: Provides a concrete example showing how setting a `prefix` on an Elysia instance affects the final path of a defined route, illustrating that `/name` becomes `/v1/name`.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/configuration.md#_snippet_11

LANGUAGE: TypeScript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia({ prefix: '/v1' }).get('/name', 'elysia') // Path is /v1/name
```

----------------------------------------

TITLE: Making All Object Properties Optional with TypeBox and TypeScript
DESCRIPTION: Illustrates how to make all fields within a TypeBox object optional using `t.Partial` and the resulting TypeScript type.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/type.md#_snippet_14

LANGUAGE: typescript
CODE:
```
t.Partial(
    t.Object({
        x: t.Number(),
        y: t.Number()
    })
)
```

LANGUAGE: typescript
CODE:
```
{
    x?: number,
    y?: number
}
```

----------------------------------------

TITLE: Mounting Scoped and Unscoped Elysia Instances - TypeScript
DESCRIPTION: Shows the deprecation of the `scoped` option in Elysia's constructor as of version 1.2, previously used to denote scoped/global distinction. The snippet demonstrates removing the `scoped` configuration, constructing instances normally, and mounting them for modular route composition. Relies on the `elysia` package. Instantiates Elysia servers and composes them using `.mount()`, with old and new approaches annotated. This clarifies instance scoping for future code and modular design patterns.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-12.md#2025-04-23_snippet_10

LANGUAGE: TypeScript
CODE:
```
import { Elysia } from 'elysia'

new Elysia({ scoped: false }) // [!code --]

const scoped = new Elysia() // [!code ++]

const main = new Elysia() // [!code ++]
	.mount(scoped) // [!code ++]
```

----------------------------------------

TITLE: Initializing Supabase Client in TypeScript
DESCRIPTION: Demonstrates how to create and export a Supabase client instance using environment variables.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-supabase.md#2025-04-23_snippet_4

LANGUAGE: typescript
CODE:
```
// src/libs/supabase.ts
import { createClient } from '@supabase/supabase-js'

const { supabase_url, supabase_service_role } = process.env

export const supabase = createClient(supabase_url!, supabase_service_role!)
```

----------------------------------------

TITLE: Equivalent Code Without Guard (ElysiaJS) - TypeScript
DESCRIPTION: Illustrates the same functionality as the `guard` example but by applying the body schema and `beforeHandle` hook directly to each route definition. This highlights the increased verbosity when not using `guard` for shared configurations.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/plugin.md#_snippet_6

LANGUAGE: typescript
CODE:
```
const signUp = <T>(a: T) => a
const signIn = <T>(a: T) => a
const isUserExists = (a: any) => a

import { Elysia, t } from 'elysia'

new Elysia()
    .post('/sign-up', ({ body }) => signUp(body), {
        body: t.Object({
            username: t.String(),
            password: t.String()
        })
    })
    .post('/sign-in', ({ body }) => body, {
        beforeHandle: isUserExists,
        body: t.Object({
            username: t.String(),
            password: t.String()
        })
    })
    .get('/', () => 'hi')
    .listen(3000)
```

----------------------------------------

TITLE: Defining String Schema with Email Format Attribute in ElysiaJS (TypeScript)
DESCRIPTION: This snippet demonstrates adding attributes to a schema definition using `Elysia.t.String()`. The `format: 'email'` attribute specifies that the string must adhere to the email format, providing more specific validation based on JSON Schema specifications.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/type.md#_snippet_8

LANGUAGE: typescript
CODE:
```
t.String({
    format: 'email'
})
```

----------------------------------------

TITLE: Incorrect Model Declaration in ElysiaJS (TypeScript)
DESCRIPTION: Shows anti-patterns for model declarations in ElysiaJS using class instances or interfaces. These approaches don't leverage Elysia's built-in validation and type inference capabilities.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/best-practice.md#2025-04-23_snippet_9

LANGUAGE: typescript
CODE:
```
// ❌ Don't
class CustomBody {
	username: string
	password: string

	constructor(username: string, password: string) {
		this.username = username
		this.password = password
	}
}

// ❌ Don't
interface ICustomBody {
	username: string
	password: string
}
```

----------------------------------------

TITLE: Defining Elysia Instance with Query Validation (demo1)
DESCRIPTION: This snippet defines an Elysia instance (`demo1`) with two routes. The `/query` route uses `.guard()` to apply a schema that validates the query parameter `name` as a string. The `/none` route has no validation.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_0

LANGUAGE: TypeScript
CODE:
```
const demo1 = new Elysia()
    .get('/none', () => 'hi')
    .guard({
        query: t.Object({
            name: t.String()
        })
    })
    .get('/query', ({ query: { name } }) => name)
```

----------------------------------------

TITLE: Initializing OpenTelemetry Plugin with Default Exporter - TypeScript
DESCRIPTION: Demonstrates how to initialize the Elysia OpenTelemetry plugin using `elysia.use()`. It configures the plugin with a `BatchSpanProcessor` sending traces via `OTLPTraceExporter` to a default endpoint. This setup is suitable for sending traces to standard OpenTelemetry collectors.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/opentelemetry.md#_snippet_0

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia';
import { opentelemetry } from '@elysiajs/opentelemetry';

import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';

new Elysia().use(
	opentelemetry({
		spanProcessors: [new BatchSpanProcessor(new OTLPTraceExporter())]
	})
);
```

----------------------------------------

TITLE: Defining Optional Path Parameters in Elysia (TypeScript)
DESCRIPTION: This code demonstrates how to create routes with optional path parameters in Elysia by appending `?` to the parameter name in the path string. It shows how to access these parameters using the `params` object in the handler function and illustrates that the value will be `undefined` if the parameter is not present in the request URL.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-11.md#_snippet_17

LANGUAGE: TypeScript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
	.get('/ok/:id?', ({ params: { id } }) => id)
	.get('/ok/:id/:name?', ({ params: { id, name } }) => name)
```

----------------------------------------

TITLE: Defining an Optional Path Parameter in ElysiaJS
DESCRIPTION: This snippet illustrates how to make a path parameter optional by appending a '?' after the parameter name. The handler function will be executed whether the optional segment is present or not, with the parameter value being `undefined` if the segment is missing.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/route.md#_snippet_4

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .get('/id/:id?', ({ params: { id } }) => `id ${id}`)
    .listen(3000)
```

----------------------------------------

TITLE: Default Descendant Hook Application in Elysia Plugins in TypeScript
DESCRIPTION: This example demonstrates the default behavior where hooks registered in a plugin (`onBeforeHandle`) apply to the plugin instance itself and its descendants (`/child`), but do not automatically apply to the parent instance (`/parent`) that uses the plugin.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/plugin.md#_snippet_17

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const plugin = new Elysia()
    .onBeforeHandle(() => {
        console.log('hi')
    })
    .get('/child', 'log hi')

const main = new Elysia()
    .use(plugin)
    .get('/parent', 'not log hi')
```

----------------------------------------

TITLE: Configuring ElysiaJS Route Handler in Next.js
DESCRIPTION: Sets up a basic ElysiaJS server within Next.js API route handler with GET and POST endpoints. Demonstrates route handling with path prefix '/api' and request body validation.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/nextjs.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
// app/api/[[...slugs]]/route.ts
import { Elysia, t } from 'elysia'

const app = new Elysia({ prefix: '/api' })
    .get('/', () => 'hello Next')
    .post('/', ({ body }) => body, {
        body: t.Object({
            name: t.String()
        })
    })

export const GET = app.handle
export const POST = app.handle
```

----------------------------------------

TITLE: Initializing ElysiaJS with Basic Apollo GraphQL Setup
DESCRIPTION: Demonstrates the basic setup of an ElysiaJS application using the `@elysiajs/apollo` plugin. It defines a simple GraphQL schema (`typeDefs`) with a `Book` type and a `books` query, along with corresponding resolvers (`resolvers`). The plugin is added via `.use()` and the server listens on port 3000.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/graphql-apollo.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { apollo, gql } from '@elysiajs/apollo'

const app = new Elysia()
	.use(
		apollo({
			typeDefs: gql`
				type Book {
					title: String
					author: String
				}

				type Query {
					books: [Book]
				}
			`,
			resolvers: {
				Query: {
					books: () => {
						return [
							{
								title: 'Elysia',
								author: 'saltyAom'
							}
						]
					}
				}
			}
		})
	)
	.listen(3000)
```

----------------------------------------

TITLE: CORS Domain Pattern Matching Example
DESCRIPTION: Example showing how to configure CORS to allow requests only from specific domain patterns using regex
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/cors.md#2025-04-23_snippet_3

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'

const app = new Elysia()
	.use(
		cors({
			origin: /.*\.saltyaom\.com$/
		})
	)
	.get('/', () => 'Hi')
	.listen(3000)
```

----------------------------------------

TITLE: Setting SameSite Cookie Attribute Elysia.js JavaScript
DESCRIPTION: This code snippet demonstrates how to set the SameSite attribute of a cookie, accepting either a boolean or a string in Elysia.js. Supported values: true (Strict), false (not set), 'lax', 'none', or 'strict'. No external dependencies are needed. Input: boolean or string; output: cookie with proper SameSite enforcement for cross-site requests. Some clients may not support all options.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/cookie.md#2025-04-23_snippet_9

LANGUAGE: JavaScript
CODE:
```
/*
Specifies the boolean or string to be the value for the [SameSite Set-Cookie attribute](https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-09#section-5.4.7).
`true` will set the SameSite attribute to Strict for strict same-site enforcement.
`false` will not set the SameSite attribute.
`'lax'` will set the SameSite attribute to Lax for lax same-site enforcement.
`'none'` will set the SameSite attribute to None for an explicit cross-site cookie.
`'strict'` will set the SameSite attribute to Strict for strict same-site enforcement.
*/
```

----------------------------------------

TITLE: Initializing Elysia with Basic Configuration (TypeScript)
DESCRIPTION: Demonstrates how to create a new Elysia instance and pass a configuration object to its constructor, setting basic options like a route prefix and normalization behavior.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/configuration.md#_snippet_0

LANGUAGE: TypeScript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia({
	prefix: '/v1',
	normalize: true
})
```

----------------------------------------

TITLE: Defining Cookie Schema with t.Cookie in ElysiaJS
DESCRIPTION: Shows how to use the special `t.Cookie` type in ElysiaJS to define the structure of expected cookies and set cookie-specific options like `secure` and `httpOnly`.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_20

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/cookie', ({ cookie }) => cookie.name.value, {
                      // ^?




		cookie: t.Cookie({
			name: t.String()
		}, {
			secure: true,
			httpOnly: true
		})
	})
```

----------------------------------------

TITLE: Using Elysia Client with Type Safety
DESCRIPTION: This snippet shows how to use the Elysia client with full type safety. It demonstrates making API calls, handling errors, and leveraging TypeScript's type inference for response data.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/midori.md#2025-04-23_snippet_4

LANGUAGE: typescript
CODE:
```
// client.ts
import { treaty } from '@elysiajs/eden'
import type { App } from './server'

const api = treaty<App>('localhost')

const { data, error } = await api.user.profile.patch({
    name: 'saltyaom',
    age: '21'
})

if(error)
    switch(error.status) {
        case 400:
            throw error.value
//                         ^?

        case 418:
            throw error.value
//                         ^?
}

data
// ^?
```

----------------------------------------

TITLE: Implementing Bearer Token Retrieval in ElysiaJS
DESCRIPTION: Example of using the Bearer plugin in an ElysiaJS application. It demonstrates how to set up a route that requires a Bearer token and handles unauthorized requests.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/bearer.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { bearer } from '@elysiajs/bearer'

const app = new Elysia()
    .use(bearer())
    .get('/sign', ({ bearer }) => bearer, {
        beforeHandle({ bearer, set, error }) {
            if (!bearer) {
                set.headers[
                    'WWW-Authenticate'
                ] = `Bearer realm='sign', error="invalid_request"`

                return error(400, 'Unauthorized')
            }
        }
    })
    .listen(3000)
```

----------------------------------------

TITLE: Custom Context Implementation
DESCRIPTION: Shows how to add custom variables and methods to the route context
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/cheat-sheet.md#2025-04-23_snippet_11

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .state('version', 1)
    .decorate('getDate', () => Date.now())
    .get('/version', ({
        getDate,
        store: { version }
    }) => `${version} ${getDate()}`)
    .listen(3000)
```

----------------------------------------

TITLE: Using Eden Fetch Client with Elysia Server (TypeScript)
DESCRIPTION: Illustrates how to use `edenFetch` from `@elysiajs/eden` as a type-safe alternative to the standard `fetch` API for interacting with an Elysia server, demonstrating how to pass parameters and body data.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/overview.md#_snippet_1

LANGUAGE: TypeScript
CODE:
```
import { edenFetch } from '@elysiajs/eden'
import type { App } from './server'

const fetch = edenFetch<App>('http://localhost:3000')

const { data } = await fetch('/name/:name', {
    method: 'POST',
    params: {
        name: 'Saori'
    },
    body: {
        branch: 'Arius',
        type: 'Striker'
    }
})
```

----------------------------------------

TITLE: Setting Secure Cookie Attribute Elysia.js JavaScript
DESCRIPTION: This snippet describes enabling or disabling the Secure cookie attribute using a boolean in Elysia.js. When true, cookies are transmitted only over HTTPS. There are no external dependencies. Input: boolean; output: cookie with the Secure attribute if true. Setting improperly may prevent cookies from being sent over HTTP.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/cookie.md#2025-04-23_snippet_10

LANGUAGE: JavaScript
CODE:
```
/*
Specifies the boolean value for the [Secure Set-Cookie attribute](https://tools.ietf.org/html/rfc6265#section-5.2.5). When truthy, the Secure attribute is set, otherwise, it is not. By default, the Secure attribute is not set.
*/
```

----------------------------------------

TITLE: Cookie Attribute Management
DESCRIPTION: Shows how to get and set cookie attributes like domain and httpOnly flags directly.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/cookie.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .get('/', ({ cookie: { name } }) => {
        // get
        name.domain

        // set
        name.domain = 'millennium.sh'
        name.httpOnly = true
    })
```

----------------------------------------

TITLE: Validating Query Parameters in ElysiaJS (TypeScript)
DESCRIPTION: Shows how to define a validation schema for URL query parameters of a GET route using `t.Object`. This ensures that requests to `/query` must include a `name` property in the query string, which will be parsed as a string.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_11

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/query', ({ query }) => query, {




		query: t.Object({
			name: t.String()
		})
	})
	.listen(3000)
```

----------------------------------------

TITLE: Proxying an External AI Stream Using Fetch in ElysiaJS - TypeScript
DESCRIPTION: This code creates an '/ai' route in ElysiaJS that proxies a streaming response from an external service (e.g., Cloudflare AI). It constructs an API endpoint using environment variables, performs an authenticated POST request with streamed JSON, and passes the fetch result directly—leveraging the plugin's support for Response/ReadableStream inputs. Assumes all dependencies and required environment variables are properly set.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/stream.md#2025-04-23_snippet_3

LANGUAGE: typescript
CODE:
```
const model = '@cf/meta/llama-2-7b-chat-int8'
const endpoint = `https://api.cloudflare.com/client/v4/accounts/${process.env.ACCOUNT_ID}/ai/run/${model}`

new Elysia()
    .get('/ai', ({ query: { prompt } }) =>
        fetch(endpoint, {
            method: 'POST',
            headers: {
                authorization: `Bearer ${API_TOKEN}`,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'You are a friendly assistant' },
                    { role: 'user', content: prompt }
                ]
            })
        })
    )
```

----------------------------------------

TITLE: Registering and Running Cron Job in ElysiaJS - TypeScript
DESCRIPTION: Demonstrates how to set up a recurring cron job within an ElysiaJS server using the @elysiajs/cron plugin. This snippet imports necessary modules, configures a job named 'heartbeat' that logs a message every 10 seconds using standard cron pattern syntax, and starts the server. It requires that you have previously installed both 'elysia' and '@elysiajs/cron'. Parameters include 'name' (for job identification), 'pattern' (cron schedule), and 'run' (callback function invoked each time the job fires). The server listens on port 3000 by default.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/cron.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { cron } from '@elysiajs/cron'

new Elysia()
	.use(
		cron({
			name: 'heartbeat',
			pattern: '*/10 * * * * *',
			run() {
				console.log('Heartbeat')
			}
		})
	)
	.listen(3000)
```

----------------------------------------

TITLE: Run Compiled Elysia Binary
DESCRIPTION: Executes the compiled ElysiaJS server binary generated by the `bun build --compile` command. This binary is portable and does not require Bun to be installed on the target machine.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/deploy.md#_snippet_1

LANGUAGE: bash
CODE:
```
./server
```

----------------------------------------

TITLE: Coercing Numeric Query Parameters Automatically (Elysia >= 1.1, TypeScript)
DESCRIPTION: Demonstrates the automatic data type coercion feature introduced in Elysia 1.1. With this update, you can use the standard `t.Number()` type for query parameters, and Elysia will automatically handle the coercion from string to number during the compilation phase, simplifying schema definitions.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-11.md#_snippet_7

LANGUAGE: TypeScript
CODE:
```
import { Elysia, t } from 'elysia'

const app = new Elysia()
	.get('/', ({ query }) => query, {
		query: t.Object({
			// ✅ page will be coerced into a number automatically
			page: t.Number()
		})
	})
```

----------------------------------------

TITLE: Defining and Handling Custom Errors in Elysia (TypeScript)
DESCRIPTION: Demonstrates how to create and handle a custom error class with Elysia's type-safe error classification system. Defines `MyError` extending `Error`, registers it in the Elysia instance via `.error({ MyError })`, and provides an `onError` switch for handling custom error codes. Inputs: requests that throw `MyError`; outputs: error handling based on custom types. Dependencies: `elysia` package.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/life-cycle.md#2025-04-23_snippet_16

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

class MyError extends Error {
    constructor(public message: string) {
        super(message)
    }
}

new Elysia()
    .error({
        MyError
    })
    .onError(({ code, error }) => {
        switch (code) {
            // With auto-completion
            case 'MyError':
                // With type narrowing
                // Hover to see error is typed as `CustomError`
                return error
        }
    })
    .get('/', () => {
        throw new MyError('Hello Error')
    })
```

----------------------------------------

TITLE: Basic Swagger Integration in ElysiaJS
DESCRIPTION: Basic setup to integrate Swagger documentation with an Elysia server, demonstrating route definition and server initialization
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/swagger.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'

new Elysia()
    .use(swagger())
    .get('/', () => 'hi')
    .post('/hello', () => 'world')
    .listen(3000)
```

----------------------------------------

TITLE: Compile Elysia to Binary using Bun
DESCRIPTION: Compiles the ElysiaJS application entry file (`./src/index.ts`) into a single portable binary named `server` using Bun. Includes options for compiling, minifying whitespace and syntax, and targeting the Bun platform.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/deploy.md#_snippet_0

LANGUAGE: bash
CODE:
```
bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--target bun \
	--outfile server \
	./src/index.ts
```

----------------------------------------

TITLE: Path Parameters with Type Inference in Elysia
DESCRIPTION: An example showing how Elysia automatically infers types for path parameters without explicit type declarations.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/at-glance.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .get('/user/:id', ({ params: { id } }) => id)
                        // ^?
    .listen(3000)
```

----------------------------------------

TITLE: Setting Custom Headers and Status Code in ElysiaJS
DESCRIPTION: Demonstrates how to set custom headers and return a custom status code using the context.set and context.error methods.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/handler.md#2025-04-23_snippet_3

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
	.get('/', ({ set, error }) => {
		set.headers = { 'X-Teapot': 'true' }

		return error(418, 'I am a teapot')
	})
	.listen(3000)
```

----------------------------------------

TITLE: Implementing Swagger Documentation in ElysiaJS
DESCRIPTION: Shows how to integrate Swagger documentation with ElysiaJS using the @elysiajs/swagger plugin. Includes response type definitions and field selection.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/with-prisma.md#2025-04-23_snippet_11

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'
import { PrismaClient } from '@prisma/client'
import { swagger } from '@elysiajs/swagger'

const db = new PrismaClient()

const app = new Elysia()
    .use(swagger())
    .post(
        '/',
        async ({ body }) =>
            db.user.create({
                data: body,
                select: {
                    id: true,
                    username: true
                }
            }),
        {
            error({ code }) {
                switch (code) {
                    case 'P2002':
                        return {
                            error: 'Username must be unique'
                        }
                }
            },
            body: t.Object({
                username: t.String(),
                password: t.String({
                    minLength: 8
                })
            }),
            response: t.Object({
                id: t.Number(),
                username: t.String()
            })
        }
    )
    .listen(3000)
```

----------------------------------------

TITLE: Implementing Response Compression with MapResponse in Elysia
DESCRIPTION: This code snippet shows how to use the new 'mapResponse' lifecycle method in Elysia 0.8 to implement response compression using gzip.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-08.md#2025-04-23_snippet_3

LANGUAGE: typescript
CODE:
```
import { Elysia, mapResponse } from 'elysia'
import { gzipSync } from 'bun'

new Elysia()
    .mapResponse(({ response }) => {
        return new Response(
            gzipSync(
                typeof response === 'object'
                    ? JSON.stringify(response)
                    : response.toString()
            )
        )
    })
    .listen(3000)
```

----------------------------------------

TITLE: Implementing Cookie Schema Validation in Elysia
DESCRIPTION: Demonstrates how to use Cookie Schema in Elysia 0.7 to validate cookie values, providing type safety and automatic encoding/decoding of structured data.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-07.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
app.get('/', ({ cookie: { name } }) => {
    // Set
    name.value = {
        id: 617,
        name: 'Summoning 101'
    }
}, {
    cookie: t.Cookie({
        value: t.Object({
            id: t.Numeric(),
            name: t.String()
        })
    })
})
```

----------------------------------------

TITLE: Cookie Schema Validation
DESCRIPTION: Shows how to implement type-safe cookie validation using t.Cookie schema.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/cookie.md#2025-04-23_snippet_3

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
    .get('/', ({ cookie: { name } }) => {
        // Set
        name.value = {
            id: 617,
            name: 'Summoning 101'
        }
    }, {
        cookie: t.Cookie({
            name: t.Object({
                id: t.Numeric(),
                name: t.String()
            })
        })
    })
```

----------------------------------------

TITLE: Handling Scoped/Local Errors in Route Lifecycle with Elysia (TypeScript)
DESCRIPTION: Shows how to provide local error handling within the route lifecycle using Elysia’s hook system. Demonstrates implementing a route with a local middleware (`beforeHandle`) that checks authentication and throws an error if it fails, plus a local error handler for the same route, enabling scoped error responses. Dependency: `elysia` and an external utility function `isSignIn`. Input: request headers; output: unauthorized error or handled response.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/life-cycle.md#2025-04-23_snippet_17

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .get('/', () => 'Hello', {
        beforeHandle({ set, request: { headers }, error }) {
            if (!isSignIn(headers)) throw error(401)
        },
        error({ error }) {
            return 'Handled'
        }
    })
    .listen(3000)
```

----------------------------------------

TITLE: Basic tRPC Router Configuration
DESCRIPTION: Example of a basic tRPC router setup with a mirror procedure using Zod validation
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/integrate-trpc-with-elysia.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
import { initTRPC } from '@trpc/server'
import { observable } from '@trpc/server/observable'

import { z } from 'zod'

const t = initTRPC.create()

export const router = t.router({
    mirror: t.procedure.input(z.string()).query(({ input }) => input),
})

export type Router = typeof router
```

----------------------------------------

TITLE: Implementing Request Interception in Eden Treaty
DESCRIPTION: Shows how to intercept and modify fetch requests before they are sent. This can be used to add custom headers or modify the request based on certain conditions.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/treaty/config.md#2025-04-23_snippet_5

LANGUAGE: typescript
CODE:
```
treaty<App>('localhost:3000', {
    onRequest(path, options) {
        if(path.startsWith('user'))
            return {
                headers: {
                    authorization: 'Bearer 12345'
                }
            }
    }
})
```

----------------------------------------

TITLE: Using Reference Schema in ElysiaJS
DESCRIPTION: Demonstrates how to use reference schemas to reduce code duplication and improve type management. Shows defining reusable validation schemas using the model method.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/with-prisma.md#2025-04-23_snippet_9

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const app = new Elysia()
    .model({
        'user.sign': t.Object({
            username: t.String(),
            password: t.String({
                minLength: 8
            })
        })
    })
    .post(
        '/',
        async ({ body }) => db.user.create({
            data: body
        }),
        {
            error({ code }) {
                switch (code) {
                    case 'P2002':
                        return {
                            error: 'Username must be unique'
                        }
                }
            },
            body: 'user.sign'
        }
    )
    .listen(3000)
```

----------------------------------------

TITLE: Configuring ElysiaJS with Prefix for Non-Root SvelteKit Routes
DESCRIPTION: This code snippet shows how to set up an Elysia server with a prefix for use in non-root SvelteKit routes. It demonstrates adding a '/api' prefix to the Elysia instance, which is necessary when the server is placed in a subdirectory of the app router.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/sveltekit.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
// src/routes/api/[...slugs]/+server.ts
import { Elysia, t } from 'elysia';

const app = new Elysia({ prefix: '/api' })
    .get('/', () => 'hi')
    .post('/', ({ body }) => body, {
        body: t.Object({
            name: t.String()
        })
    })

type RequestHandler = (v: { request: Request }) => Response | Promise<Response>

export const GET: RequestHandler = ({ request }) => app.handle(request)
export const POST: RequestHandler = ({ request }) => app.handle(request)
```

----------------------------------------

TITLE: Using Trace to Monitor Handle Performance in Elysia
DESCRIPTION: This snippet demonstrates how to use the trace API to measure the duration of the handle lifecycle event. It captures the execution time by registering listeners at the start and end of the event, then outputs the elapsed time in milliseconds.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/trace.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const app = new Elysia()
    .trace(async ({ onHandle }) => {
	    onHandle(({ begin, onStop }) => {
			onStop(({ end }) => {
        		console.log('handle took', end - begin, 'ms')
			})
	    })
    })
    .get('/', () => 'Hi')
    .listen(3000)
```

----------------------------------------

TITLE: Defining Number Schema with Range Attributes in ElysiaJS (TypeScript)
DESCRIPTION: This snippet demonstrates adding range constraints to a number schema using `Elysia.t.Number()`. The `minimum` and `maximum` attributes specify that the number must be greater than or equal to 10 and less than or equal to 100, based on JSON Schema specifications.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/type.md#_snippet_9

LANGUAGE: typescript
CODE:
```
t.Number({
    minimum: 10,
    maximum: 100
})
```

----------------------------------------

TITLE: Combined Group and Guard Syntax (ElysiaJS) - TypeScript
DESCRIPTION: Shows the concise syntax for applying a schema directly to a route group using `Elysia.group('/v1', schema, callback)`. This combines the functionality of grouping routes and applying a common schema/hook configuration in a single method call.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/plugin.md#_snippet_9

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
    .group(
        '/v1',
        {
            body: t.Literal('Rikuhachima Aru')
        },
        (app) => app.post('/student', ({ body }) => body)
    )
    .listen(3000)
```

----------------------------------------

TITLE: Define Elysia Model Plugin File
DESCRIPTION: Shows how to create a separate file ('auth.model.ts') that defines an Elysia plugin containing one or more named models using the '.model()' method, intended for reuse across multiple files.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_39

LANGUAGE: typescript
CODE:
```
// auth.model.ts
import { Elysia, t } from 'elysia'

export const authModel = new Elysia()
    .model({
        sign: t.Object({
            username: t.String(),
            password: t.String()
        })
    })
```

----------------------------------------

TITLE: Defining Single File Type in Elysia
DESCRIPTION: Uses Elysia's `t.File` for validating a single file upload, extending base schema attributes with file-specific properties like type and size constraints.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/type.md#_snippet_16

LANGUAGE: typescript
CODE:
```
t.File()
```

----------------------------------------

TITLE: Defining a Prefix for Elysia Routes (TypeScript)
DESCRIPTION: Demonstrates how to set a URL prefix for all routes defined within an Elysia instance using the `prefix` configuration option. All subsequent route paths will be prepended with this value.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/configuration.md#_snippet_10

LANGUAGE: TypeScript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia({
	prefix: '/v1'
})
```

----------------------------------------

TITLE: Global Cookie Configuration
DESCRIPTION: Demonstrates setting up global cookie configuration in the Elysia constructor.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/cookie.md#2025-04-23_snippet_6

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia({
    cookie: {
        secrets: 'Fischl von Luftschloss Narfidort',
        sign: ['profile']
    }
})
    .get('/', ({ cookie: { profile } }) => {
        profile.value = {
            id: 617,
            name: 'Summoning 101'
        }
    }, {
        cookie: t.Cookie({
            profile: t.Object({
                id: t.Numeric(),
                name: t.String()
            })
        })
    })
```

----------------------------------------

TITLE: Implementing Local Hook for HTML Content Type
DESCRIPTION: Example showing how to use a local hook to set Content-Type headers for HTML responses on specific routes.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/life-cycle.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { isHtml } from '@elysiajs/html'

new Elysia()
    .get('/', () => '<h1>Hello World</h1>', {
        afterHandle({ response, set }) {
            if (isHtml(response))
                set.headers['Content-Type'] = 'text/html; charset=utf8'
        }
    })
    .get('/hi', () => '<h1>Hello World</h1>')
    .listen(3000)
```

----------------------------------------

TITLE: Implementing Redirects in ElysiaJS Handlers
DESCRIPTION: Demonstrates how to use the redirect function to redirect requests to another resource, with optional custom status codes.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/handler.md#2025-04-23_snippet_7

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .get('/', ({ redirect }) => {
        return redirect('https://youtu.be/whpVWVWBW4U?&t=8')
    })
    .get('/custom-status', ({ redirect }) => {
        // You can also set custom status to redirect
        return redirect('https://youtu.be/whpVWVWBW4U?&t=8', 302)
    })
    .listen(3000)
```

----------------------------------------

TITLE: Defining Array Schema with Item Count Attributes in ElysiaJS (TypeScript)
DESCRIPTION: This snippet demonstrates adding constraints on the number of items in an array schema using `Elysia.t.Array()`. The `minItems` and `maxItems` attributes specify the minimum and maximum allowed number of elements in the array, based on JSON Schema specifications.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/type.md#_snippet_10

LANGUAGE: typescript
CODE:
```
t.Array(
    t.Number(),
    {
        /**
         * Minimum number of items
         */
        minItems: 1,
        /**
         * Maximum number of items
         */
        maxItems: 5
    }
)
```

----------------------------------------

TITLE: Converting Drizzle Schema to Elysia Validation Models
DESCRIPTION: TypeScript example showing how to convert a Drizzle user table schema into Elysia validation models using drizzle-typebox, enabling reuse of database schema for API validation.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/drizzle.md#2025-04-23_snippet_3

LANGUAGE: typescript
CODE:
```
import { createInsertSchema } from 'drizzle-typebox'
import { table } from './database/schema'

const _createUser = createInsertSchema(table.user, {
	// Replace email with Elysia's email type
	email: t.String({ format: 'email' })
})

new Elysia()
	.post('/sign-up', ({ body }) => {
		// Create a new user
	}, {
		body: t.Omit(
			_createUser,
			['id', 'salt', 'createdAt']
		)
	})
```

----------------------------------------

TITLE: Using Inline Values as Handlers in ElysiaJS
DESCRIPTION: Shows how to use literal values and file responses as inline handlers for improved performance with static resources.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/handler.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia, file } from 'elysia'

new Elysia()
    .get('/', 'Hello Elysia')
    .get('/video', file('kyuukurarin.mp4'))
    .listen(3000)
```

----------------------------------------

TITLE: Define Elysia Macro for Sign-In Check
DESCRIPTION: Implements an Elysia macro named `isSignIn` that checks for the presence and validity of a session token in cookies, returning an unauthorized error if missing or invalid. This macro can be used in route guards.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_58

LANGUAGE: TypeScript
CODE:
```
.macro({
        isSignIn(enabled: boolean) {
            if (!enabled) return

            return {
            	beforeHandle({ error, cookie: { token }, store: { session } }) {
                    if (!token.value)
                        return error(401, {
                            success: false,
                            message: 'Unauthorized'
                        })

                    const username = session[token.value as unknown as number]

                    if (!username)
                        return error(401, {
                            success: false,
                            message: 'Unauthorized'
                        })
                }
            }
        }
    })
```

----------------------------------------

TITLE: Reusing Named ElysiaJS Plugins with Automatic Deduplication (TypeScript)
DESCRIPTION: Illustrates how to create a named ElysiaJS plugin (`new Elysia({ name: 'my-plugin' })`) and apply it multiple times to an Elysia application using `.use()`. Elysia automatically handles deduplication of plugins based on their name (or an optional seed), preventing redundant processing and improving performance. Requires the 'elysia' package.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/best-practice.md#2025-04-23_snippet_15

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const plugin = new Elysia({ name: 'my-plugin' })
	.decorate("type", "plugin")

const app = new Elysia()
    .use(plugin)
    .use(plugin)
    .use(plugin)
    .use(plugin)
    .listen(3000)
```

----------------------------------------

TITLE: Creating Elysia Project with Bun
DESCRIPTION: Initializes a new Elysia project using Bun's create command. This sets up the basic structure for an Elysia server.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/with-prisma.md#2025-04-23_snippet_0

LANGUAGE: bash
CODE:
```
bun create elysia elysia-prisma
```

----------------------------------------

TITLE: Decorating ElysiaJS Context with Multiple Properties using Object Pattern (TypeScript)
DESCRIPTION: Shows how to use the `decorate` method with an object literal to add multiple properties (logger, trace, telemetry instances) to the ElysiaJS context simultaneously. This offers a less repetitive API compared to multiple key-value assignments.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/handler.md#2025-04-23_snippet_17

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

// Assuming Logger, Trace, and Telemetry classes are defined elsewhere
class Logger {}
class Trace {}
class Telemetry {}

new Elysia()
    .decorate({
        logger: new Logger(),
        trace: new Trace(),
        telemetry: new Telemetry()
    })
```

----------------------------------------

TITLE: Handling Empty Body with Required Query Parameters in Eden Treaty
DESCRIPTION: This snippet shows how to handle cases where the body is optional or not needed, but query parameters are required in Eden Treaty.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/treaty/parameters.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'
import { treaty } from '@elysiajs/eden'

const app = new Elysia()
    .post('/user', () => 'hi', {
        query: t.Object({
            name: t.String()
        })
    })
    .listen(3000)

const api = treaty<typeof app>('localhost:3000')

api.user.post(null, {
    query: {
        name: 'Ely'
    }
})
```

----------------------------------------

TITLE: Using Custom Parser in Elysia
DESCRIPTION: Shows how to define and use a custom parser with a specific name in Elysia 1.2 for decoding request bodies.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-12.md#2025-04-23_snippet_3

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
	.parser('custom', ({ contentType }) => {
		if(contentType === "application/kivotos")
			return 'nagisa'
	})
	.post('/', ({ body }) => body, {
		parse: 'custom'
	})
```

----------------------------------------

TITLE: Supabase Integration for Authentication
DESCRIPTION: Implementation of Supabase authentication methods for sign-up and sign-in functionality with error handling.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-supabase.md#2025-04-23_snippet_6

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { supabase } from '../../libs'

const authen = (app: Elysia) =>
    app.group('/auth', (app) =>
        app
            .post('/sign-up', async ({ body }) => {
                const { data, error } = await supabase.auth.signUp(body)

                if (error) return error

                return data.user
            })
            .post('/sign-in', async ({ body }) => {
                const { data, error } = await supabase.auth.signInWithPassword(
                    body
                )

                if (error) return error

                return data.user
            })
    )
```

----------------------------------------

TITLE: Creating Streaming Responses with Elysia Generator Functions (TypeScript)
DESCRIPTION: This snippet demonstrates how to implement server-side response streaming in Elysia using a generator function as the route handler. The `yield` keyword is used within the generator function to send individual data chunks to the client as they become available, providing a straightforward way to stream responses without external packages.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-11.md#_snippet_19

LANGUAGE: TypeScript
CODE:
```
import { Elysia } from 'elysia'

const app = new Elysia()
	.get('/ok', function* () {
		yield 1
		yield 2
		yield 3
	})
```

----------------------------------------

TITLE: Processing Stream Responses with Eden Treaty in TypeScript
DESCRIPTION: This snippet shows how to handle stream responses from an Elysia server using Eden Treaty. The example demonstrates that stream responses are interpreted as AsyncGenerators, allowing the use of 'for await' loops to process each chunk of the streamed data.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/treaty/response.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { treaty } from '@elysiajs/eden'

const app = new Elysia()
	.get('/ok', function* () {
		yield 1
		yield 2
		yield 3
	})

const { data, error } = await treaty(app).ok.get()
if (error) throw error

for await (const chunk of data)
	console.log(chunk)
               // ^?
```

----------------------------------------

TITLE: Consuming Elysia Generator Streams with Eden Client (TypeScript)
DESCRIPTION: This example illustrates how to consume a streaming response generated by an Elysia server using the Eden client. It shows how Eden infers the response type as `AsyncGenerator` and demonstrates iterating over the streamed data chunks asynchronously using a `for await...of` loop to process each piece of the stream as it arrives.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-11.md#_snippet_20

LANGUAGE: TypeScript
CODE:
```
import { Elysia } from 'elysia'
import { treaty } from '@elysiajs/eden'

const app = new Elysia()
	.get('/ok', function* () {
		yield 1
		yield 2
		yield 3
	})

const { data, error } = await treaty(app).ok.get()
if (error) throw error

for await (const chunk of data)
	console.log(chunk)
```

----------------------------------------

TITLE: Sending Emails with AWS SES in ElysiaJS
DESCRIPTION: Implementation for sending the OTP email using AWS SES as the email provider. It renders the React component to HTML and formats it according to the AWS SES API requirements.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/react-email.md#2025-04-23_snippet_7

LANGUAGE: tsx
CODE:
```
import { Elysia, t } from 'elysia'

import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import OTPEmail from './emails/otp'

import { type SendEmailCommandInput, SES } from '@aws-sdk/client-ses'
import { fromEnv } from '@aws-sdk/credential-providers'

const ses = new SES({
    credentials:
        process.env.NODE_ENV === 'production' ? fromEnv() : undefined
})

new Elysia()
	.get('/otp', ({ body }) => {
		// Random between 100,000 and 999,999
  		const otp = ~~(Math.random() * (900_000 - 1)) + 100_000

		const html = renderToStaticMarkup(<OTPEmail otp={otp} />)

        await ses.sendEmail({
            Source: 'ibuki@gehenna.sh',
            Destination: {
                ToAddresses: [body]
            },
            Message: {
                Body: {
                    Html: {
                        Charset: 'UTF-8',
                        Data: html
                    }
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: 'Verify your email address'
                }
            }
        } satisfies SendEmailCommandInput)

        return { success: true }
	}, {
		body: t.String({ format: 'email' })
	})
	.listen(3000)
```

----------------------------------------

TITLE: Handling API Responses with Error Checking in TypeScript using Eden Treaty
DESCRIPTION: This example demonstrates how to use Eden Treaty to make API calls to an Elysia server with proper error handling. It shows how the error() helper function works with type narrowing, allowing for more specific error handling based on HTTP status codes.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/treaty/response.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'
import { treaty } from '@elysiajs/eden'

const app = new Elysia()
    .post('/user', ({ body: { name }, error }) => {
        if(name === 'Otto')
            return error(400, 'Bad Request')

        return name
    }, {
        body: t.Object({
            name: t.String()
        })
    })
    .listen(3000)

const api = treaty<typeof app>('localhost:3000')

const submit = async (name: string) => {
    const { data, error } = await api.user.post({
        name
    })

    // type: string | null
    console.log(data)

    if (error)
        switch(error.status) {
            case 400:
                // Error type will be narrow down
                throw error.value

            default:
                throw error.value
        }

    // Once the error is handled, type will be unwrapped
    // type: string
    return data
}
```

----------------------------------------

TITLE: Configuring Streaming Endpoint in ElysiaJS - TypeScript
DESCRIPTION: This example demonstrates initializing an ElysiaJS server and enabling a streaming endpoint using the Stream plugin in manual/callback mode. It imports the necessary dependencies, creates a route that streams two messages (with artificial delay) to the client, and listens on port 3000. To use this snippet, the @elysiajs/stream plugin must be installed and imported.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/stream.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { Stream } from '@elysiajs/stream'

new Elysia()
    .get('/', () => new Stream(async (stream) => {
        stream.send('hello')

        await stream.wait(1000)
        stream.send('world')

        stream.close()
    }))
    .listen(3000)
```

----------------------------------------

TITLE: Configuring Eden Treaty with Custom Fetch Options in TypeScript
DESCRIPTION: Demonstrates how to add custom fetch options when initializing Eden Treaty. This example sets the credentials option to 'include'.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/treaty/config.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
export type App = typeof app // [!code ++]
import { treaty } from '@elysiajs/eden'
// ---cut---
treaty<App>('localhost:3000', {
    fetch: {
        credentials: 'include'
    }
})
```

----------------------------------------

TITLE: Error Handling with Eden Fetch
DESCRIPTION: Shows how to handle errors when making requests with Eden Fetch, including status code checking and error value handling.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/fetch.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
import { edenFetch } from '@elysiajs/eden'
import type { App } from './server'

const fetch = edenFetch<App>('http://localhost:3000')

// response type: { id: 1895, name: 'Skadi' }
const { data: nendoroid, error } = await fetch('/mirror', {
    method: 'POST',
    body: {
        id: 1895,
        name: 'Skadi'
    }
})

if(error) {
    switch(error.status) {
        case 400:
        case 401:
            throw error.value
            break

        case 500:
        case 502:
            throw error.value
            break

        default:
            throw error.value
            break
    }
}

const { id, name } = nendoroid
```

----------------------------------------

TITLE: Node.js ElysiaJS Setup
DESCRIPTION: Setup code for running Elysia with Node.js adapter.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/quick-start.md#2025-04-23_snippet_4

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { node } from '@elysiajs/node'

const app = new Elysia({ adapter: node() })
	.get('/', () => 'Hello Elysia')
	.listen(3000, ({ hostname, port }) => {
		console.log(
			`🦊 Elysia is running at ${hostname}:${port}`
		)
	})
```

----------------------------------------

TITLE: Elysia Macro Refactoring: Session Check
DESCRIPTION: This snippet shows the original imperative logic for checking session validity and extracting the username. This code is refactored into an Elysia macro (`isSignIn`) to promote reusability across multiple routes, avoiding code duplication for authentication checks.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_27

LANGUAGE: TypeScript
CODE:
```
if (!username)
    return error(401, {
        success: false,
        message: 'Unauthorized'
    })
```

----------------------------------------

TITLE: Defining Response Schemas per Status Code in ElysiaJS
DESCRIPTION: Shows how to define different response schemas for various HTTP status codes (e.g., 200 and 400) using an object mapping status codes to TypeBox types in the `response` option.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_22

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/response', ({ error }) => {
		if (Math.random() > 0.5)
			return error(400, {
				error: 'Something went wrong'
			})

		return {
			name: 'Jane Doe'
		}
	}, {
		response: {
			200: t.Object({
				name: t.String()
			}),
			400: t.Object({
				error: t.String()
			})
		}
	})
```

----------------------------------------

TITLE: Using Elysia Macro in Route Definition (TypeScript)
DESCRIPTION: Demonstrates how to use the previously defined `isSignIn` macro on an Elysia route. It shows the structure of an Elysia app (`user`) that uses the `userService` and defines routes for sign-up, sign-in, and profile, implying the macro would be applied to the profile route (indicated by the `---cut---` marker before the `/profile` route).
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_26

LANGUAGE: TypeScript
CODE:
```
// @errors: 2538
import { Elysia, t } from 'elysia'

export const userService = new Elysia({ name: 'user/service' })
    .state({
        user: {} as Record<string, string>,
        session: {} as Record<number, string>
    })
    .model({
        signIn: t.Object({
            username: t.String({ minLength: 1 }),
            password: t.String({ minLength: 8 })
        }),
        session: t.Cookie(
            {
                token: t.Number()
            },
            {
                secrets: 'seia'
            }
        ),
        optionalSession: t.Optional(t.Ref('session'))
    })
    .macro({
        isSignIn(enabled: boolean) {
            if (!enabled) return

            return {
            	beforeHandle({ error, cookie: { token }, store: { session } }) {
                    if (!token.value)
                        return error(401, {
                            success: false,
                            message: 'Unauthorized'
                        })

                    const username = session[token.value as unknown as number]

                    if (!username)
                        return error(401, {
                            success: false,
                            message: 'Unauthorized'
                        })
                }
            }
        }
    })

export const user = new Elysia({ prefix: '/user' })
    .use(userService)
    .put(
        '/sign-up',
        async ({ body: { username, password }, store, error }) => {
            if (store.user[username])
                return error(400, {
                    success: false,
                    message: 'User already exists'
                })

            store.user[username] = await Bun.password.hash(password)

            return {
                success: true,
                message: 'User created'
            }
        },
        {
            body: 'signIn'
        }
    )
    .post(
        '/sign-in',
        async ({
            store: { user, session },
            error,
            body: { username, password },
            cookie: { token }
        }) => {
            if (
                !user[username] ||
                !(await Bun.password.verify(password, user[username]))
            )
                return error(400, {
                    success: false,
                    message: 'Invalid username or password'
                })

            const key = crypto.getRandomValues(new Uint32Array(1))[0]
            session[key] = username
            token.value = key

            return {
                success: true,
                message: `Signed in as ${username}`
            }
        },
        {
            body: 'signIn',
            cookie: 'optionalSession'
        }
    )
    // ---cut---
    .get(
        '/profile',
        ({ cookie: { token }, store: { session }, error }) => {
```

----------------------------------------

TITLE: Return 404 Status Code in Elysia.js
DESCRIPTION: Demonstrates how to return a 404 Not Found status code in an Elysia.js route handler when a requested resource (array index) is not found. It uses the `error` function provided in the context.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_12

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'
import { swagger } from '@elysiajs/swagger'

class Note {
    constructor(public data: string[] = ['Moonhalo']) {}
}

const app = new Elysia()
    .use(swagger())
    .decorate('note', new Note())
    .get('/note', ({ note }) => note.data)
    .get(
        '/note/:index',
        ({ note, params: { index }, error }) => { // [!code ++]
            return note.data[index] ?? error(404) // [!code ++]
        },
        {
            params: t.Object({
                index: t.Number()
            })
        }
    )
    .listen(3000)
```

----------------------------------------

TITLE: WebSocket Implementation
DESCRIPTION: Demonstrates setting up WebSocket functionality
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/cheat-sheet.md#2025-04-23_snippet_14

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .ws('/ping', {
        message(ws, message) {
            ws.send('hello ' + message)
        }
    })
    .listen(3000)
```

----------------------------------------

TITLE: Using Universal File API in Elysia
DESCRIPTION: Shows how to use the new universal 'file' API in Elysia 1.2 for cross-runtime compatibility when returning file responses.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-12.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia, file } from 'elysia'

new Elysia()
	.get('/', () => file('./public/index.html'))
```

----------------------------------------

TITLE: Elysia User Route Group and Profile Endpoint (TypeScript)
DESCRIPTION: Creates an Elysia instance `user` with a `/user` prefix. It uses the `getUserId` instance to ensure authentication context is available and defines a GET route `/profile` that returns the authenticated username.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_47

LANGUAGE: TypeScript
CODE:
```
export const user = new Elysia({ prefix: '/user' })
	.use(getUserId)
	.get('/profile', ({ username }) => ({
        success: true,
        username
    }))
```

----------------------------------------

TITLE: Streaming Responses in Elysia
DESCRIPTION: Shows how to implement streaming responses using generator functions and handle headers in streams.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/handler.md#2025-04-23_snippet_13

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const app = new Elysia()
	.get('/ok', function* () {
		yield 1
		yield 2
		yield 3
	})
```

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const app = new Elysia()
	.get('/ok', function* ({ set }) {
		// This will set headers
		set.headers['x-name'] = 'Elysia'
		yield 1
		yield 2

		// This will do nothing
		set.headers['x-id'] = '1'
		yield 3
	})
```

----------------------------------------

TITLE: Defining Cookie Type in Elysia
DESCRIPTION: Uses Elysia's `t.Cookie` to represent and validate a cookie jar, extending the Object type and adding cookie-specific options like secrets for signing.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/type.md#_snippet_18

LANGUAGE: typescript
CODE:
```
t.Cookie({
    name: t.String()
})
```

----------------------------------------

TITLE: Setting Default Status Code in ElysiaJS Lifecycle
DESCRIPTION: Demonstrates how to set a default status code using onBeforeHandle lifecycle hook in ElysiaJS.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/handler.md#2025-04-23_snippet_5

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .onBeforeHandle(({ set }) => {
        set.status = 418

        return 'Kirifuji Nagisa'
    })
    .get('/', () => 'hi')
    .listen(3000)
```

----------------------------------------

TITLE: Implementing ElysiaJS Server in SvelteKit Route
DESCRIPTION: This snippet demonstrates how to create an Elysia server instance within a SvelteKit server route file. It sets up GET and POST handlers and exports them for SvelteKit to use. The code includes type definitions and request handling.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/sveltekit.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
// src/routes/[...slugs]/+server.ts
import { Elysia, t } from 'elysia';

const app = new Elysia()
    .get('/', () => 'hello SvelteKit')
    .post('/', ({ body }) => body, {
        body: t.Object({
            name: t.String()
        })
    })

type RequestHandler = (v: { request: Request }) => Response | Promise<Response>

export const GET: RequestHandler = ({ request }) => app.handle(request)
export const POST: RequestHandler = ({ request }) => app.handle(request)
```

----------------------------------------

TITLE: Defining and Merging Response Schemas with Elysia Guard (TypeScript)
DESCRIPTION: This snippet illustrates Elysia's response schema reconciliation feature introduced in version 1.1. It shows how response schemas defined in different `guard` scopes (global and local) are merged. The example highlights how a local scope can override a global schema and the implications for type safety and runtime behavior in nested applications.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-11.md#_snippet_16

LANGUAGE: TypeScript
CODE:
```
import { Elysia, t } from 'elysia'

const plugin = new Elysia()
	.guard({
		as: 'global',
		response: {
			200: t.Literal('ok'),
			418: t.Literal('Teapot')
		}
	})
	.get('/ok', ({ error }) => error(418, 'Teapot'))

const instance = new Elysia()
	.use(plugin)
	.guard({
		response: {
			418: t.String()
		}
	})
	// This is fine because local response override
	.get('/ok', ({ error }) => error(418, 'ok'))

const parent = new Elysia()
	.use(instance)
	// Error because global response
	.get('/not-ok', ({ error }) => error(418, 'ok'))
```

----------------------------------------

TITLE: Register Named Models with Elysia .model()
DESCRIPTION: Introduces the '.model()' method to register schema definitions with a specific name ('sign'), allowing them to be referenced by name string in route options and enabling auto-completion for registered models.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_38

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .model({
        sign: t.Object({
            username: t.String(),
            password: t.String()
        })
    })
    .post('/sign-in', ({ body }) => body, {
        // with auto-completion for existing model name
        body: 'sign',
        response: 'sign'
    })
```

----------------------------------------

TITLE: Conditionally Enabling Server Timing in ElysiaJS (TypeScript)
DESCRIPTION: Shows how to configure the Server Timing plugin to conditionally add timing headers based on the request. The 'allow' property takes a function that receives the request context (including the Request object) and returns true if timing should be enabled. In this example, timing is disabled for requests targeting the '/no-trace' path.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/server-timing.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { serverTiming } from '@elysiajs/server-timing'

new Elysia()
    .use(
        serverTiming({
            allow: ({ request }) => {
                return new URL(request.url).pathname !== '/no-trace'
            }
        })
    )
```

----------------------------------------

TITLE: Configuring CORS for Better Auth in ElysiaJS (TypeScript)
DESCRIPTION: Shows how to apply CORS middleware using `@elysiajs/cors` to the ElysiaJS application that mounts the Better Auth handler. This allows cross-origin requests to the authentication endpoints with specified origins, methods, headers, and credentials.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/better-auth.md#_snippet_5

LANGUAGE: TypeScript
CODE:
```
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'

import { auth } from './auth'

const app = new Elysia()
	.use(
		cors({
			origin: 'http://localhost:3001',
			methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
			credentials: true,
			allowedHeaders: ['Content-Type', 'Authorization']
		})
	)
	.mount(auth.handler)
	.listen(3000)

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
```

----------------------------------------

TITLE: Losing Reference When Assigning Primitive Property to New Variable
DESCRIPTION: Illustrates a common JavaScript pitfall where assigning a primitive property (like a number) from an object to a new variable creates a copy, not a reference. Modifying the new variable (`counter`) does not affect the original object's property (`store.counter`).
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/handler.md#2025-04-23_snippet_22

LANGUAGE: typescript
CODE:
```
const store = {
    counter: 0
}

let counter = store.counter

counter++
console.log(store.counter) // ❌ 0
console.log(counter) // ✅ 1
```

----------------------------------------

TITLE: Configuring Explicit Body Parser in Elysia.js
DESCRIPTION: Demonstrates how to explicitly specify the body parser type for handling different content types in POST requests
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/life-cycle.md#2025-04-23_snippet_6

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia().post('/', ({ body }) => body, {
    // Short form of application/json
    parse: 'json'
})
```

----------------------------------------

TITLE: Adding Swagger Documentation with Elysia Plugin
DESCRIPTION: Demonstrates how to integrate OpenAPI documentation using the Swagger plugin with minimal configuration.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/at-glance.md#2025-04-23_snippet_3

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'
import { swagger } from '@elysiajs/swagger'

new Elysia()
    .use(swagger())
    .get('/user/:id', ({ params: { id } }) => id, {
        params: t.Object({
            id: t.Number()
        })
    })
    .listen(3000)
```

----------------------------------------

TITLE: Running Type Safety Tests with TypeScript Compiler
DESCRIPTION: This command uses the TypeScript compiler to perform type safety tests on all test files without emitting JavaScript output. This approach helps ensure type integrity between client and server, especially during migrations.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/treaty/unit-test.md#2025-04-23_snippet_1

LANGUAGE: bash
CODE:
```
tsc --noEmit test/**/*.ts
```

----------------------------------------

TITLE: Implementing Response Interception in Eden Treaty
DESCRIPTION: Demonstrates how to intercept and modify fetch responses. This can be used to transform the response data or handle specific response conditions.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/treaty/config.md#2025-04-23_snippet_6

LANGUAGE: typescript
CODE:
```
treaty<App>('localhost:3000', {
    onResponse(response) {
        if(response.ok)
            return response.json()
    }
})
```

----------------------------------------

TITLE: Demonstrating Eden Treaty Parameters in TypeScript with ElysiaJS
DESCRIPTION: This snippet shows how to use Eden Treaty parameters for a POST request, including both body and additional parameters like headers and query.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/treaty/parameters.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'
import { treaty } from '@elysiajs/eden'

const app = new Elysia()
    .post('/user', ({ body }) => body, {
        body: t.Object({
            name: t.String()
        })
    })
    .listen(3000)

const api = treaty<typeof app>('localhost:3000')

// ✅ works
api.user.post({
    name: 'Elysia'
})

// ✅ also works
api.user.post({
    name: 'Elysia'
}, {
    // This is optional as not specified in schema
    headers: {
        authorization: 'Bearer 12345'
    },
    query: {
        id: 2
    }
})
```

----------------------------------------

TITLE: Compile Elysia to Binary with --minify using Bun
DESCRIPTION: Compiles the ElysiaJS application entry file (`./src/index.ts`) into a single portable binary using Bun, opting for the `--minify` flag instead of separate whitespace and syntax minification. Note that `--minify` can interfere with OpenTelemetry tracing.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/deploy.md#_snippet_2

LANGUAGE: bash
CODE:
```
bun build \
	--compile \
	--minify \
	--target bun \
	--outfile server \
	./src/index.ts
```

----------------------------------------

TITLE: Adding Custom Headers with Trace in Elysia
DESCRIPTION: This snippet demonstrates how to use the trace API to add a custom header that shows the elapsed time for the beforeHandle lifecycle event. It uses the onStop callback to capture the timing information and add it to the response headers.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/trace.md#2025-04-23_snippet_4

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const app = new Elysia()
	.trace(({ onBeforeHandle, set }) => {
		onBeforeHandle(({ onStop }) => {
			onStop(({ elapsed }) => {
				set.headers['X-Elapsed'] = elapsed.toString()
			})
		})
	})
	.get('/', () => 'Hi')
	.listen(3000)
```

----------------------------------------

TITLE: Nullable Cookie Implementation
DESCRIPTION: Demonstrates how to handle nullable cookie values using t.Optional.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/cookie.md#2025-04-23_snippet_4

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
    .get('/', ({ cookie: { name } }) => {
        // Set
        name.value = {
            id: 617,
            name: 'Summoning 101'
        }
    }, {
        cookie: t.Cookie({
            name: t.Optional(
                t.Object({
                    id: t.Numeric(),
                    name: t.String()
                })
            )
        })
    })
```

----------------------------------------

TITLE: Define Inline Models in Elysia Route
DESCRIPTION: Shows an initial Elysia setup where request body and response schemas are defined directly within the route options using 't.Object', which can lead to duplication.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_36

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .post('/sign-in', ({ body }) => body, {
        body: t.Object({
            username: t.String(),
            password: t.String()
        }),
        response: t.Object({
            username: t.String(),
            password: t.String()
        })
    })
```

----------------------------------------

TITLE: Defining Union Enum Type in Elysia
DESCRIPTION: Uses Elysia's `t.UnionEnum` to define a type where the value must be one of the specified literal values.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/type.md#_snippet_15

LANGUAGE: typescript
CODE:
```
t.UnionEnum(['rapi', 'anis', 1, true, false])
```

----------------------------------------

TITLE: Incorrect Request-Dependent Service Pattern in ElysiaJS (TypeScript)
DESCRIPTION: Demonstrates an anti-pattern for implementing request-dependent services in ElysiaJS by passing the entire Context object. This approach reduces type integrity and makes code harder to maintain.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/best-practice.md#2025-04-23_snippet_6

LANGUAGE: typescript
CODE:
```
import type { Context } from 'elysia'

class AuthService {
	constructor() {}

	// ❌ Don't do this
	isSignIn({ cookie: { session } }: Context) {
		if (session.value)
			return error(401)
	}
}
```

----------------------------------------

TITLE: Implementing Role-Based Access Control with Macro API in Elysia
DESCRIPTION: This snippet demonstrates how to use the new Macro API in Elysia 0.8 to implement role-based access control. It shows the usage of a custom 'role' field in route configuration.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-08.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { auth } from '@services/auth'

const app = new Elysia()
    .use(auth)
    .get('/', ({ user }) => user.profile, {
        role: 'admin'
    })
```

----------------------------------------

TITLE: Incorrect Controller Pattern for ElysiaJS (TypeScript)
DESCRIPTION: Demonstrates an anti-pattern for ElysiaJS controllers by creating a separate controller class and passing its methods to Elysia routes. This approach reduces type integrity and doesn't align with the framework's design.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/best-practice.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
import { Elysia, t, type Context } from 'elysia'

abstract class Controller {
    static root(context: Context) {
        return Service.doStuff(context.stuff)
    }
}

// ❌ Don't
new Elysia()
    .get('/', Controller.hi)
```

----------------------------------------

TITLE: TypeScript Configuration
DESCRIPTION: Basic TypeScript configuration for an Elysia project with strict mode enabled.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/quick-start.md#2025-04-23_snippet_3

LANGUAGE: json
CODE:
```
{
   	"compilerOptions": {
  		"strict": true
   	}
}
```

----------------------------------------

TITLE: State, Decorate, and Model Configuration in Elysia
DESCRIPTION: Example demonstrating the new unified API for setting state, decorators, and models with both single and multiple value support
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-05.md#2025-04-23_snippet_9

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

const app = new Elysia()
	// ? set model using label
	.model('string', t.String())
	.model({
		number: t.Number()
	})
	.state('visitor', 1)
	// ? set model using object
	.state({
		multiple: 'value',
		are: 'now supported!'
	})
	.decorate('visitor', 1)
	// ? set model using object
	.decorate({
		name: 'world',
		number: 2
	})
```

----------------------------------------

TITLE: Bundle Elysia to JavaScript using Bun
DESCRIPTION: Bundles the ElysiaJS application entry file (`./src/index.ts`) into a single portable JavaScript file (`./dist/index.js`) using Bun. This method is an alternative to compiling to binary, suitable for environments like Windows or machines without AVX2 support. It includes minification options.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/deploy.md#_snippet_4

LANGUAGE: bash
CODE:
```
bun build \
	--minify-whitespace \
	--minify-syntax \
	--target bun \
	--outfile ./dist/index.js \
	./src/index.ts
```

----------------------------------------

TITLE: Defining TypeBox Object Schema with Object and Field Errors (TypeScript)
DESCRIPTION: Defines a TypeBox object schema with a number property 'x' having a custom field error. It also includes a custom error function at the object level, which is triggered if the validated value is not an object.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_31

LANGUAGE: typescript
CODE:
```
t.Object(
    {
        x: t.Number({
            error() {
                return 'Expected x to be a number'
            }
        })
    }, {
        error() {
            return 'Expected value to be an object'
        }
    }
)
```

----------------------------------------

TITLE: Optimizing Static Content Serving in Elysia
DESCRIPTION: This code snippet shows how to use the new static content optimization feature in Elysia 0.8, which improves performance for serving static files by determining the Response Ahead of Time.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-08.md#2025-04-23_snippet_5

LANGUAGE: typescript
CODE:
```
new Elysia()
    .get('/', Bun.file('video/kyuukurarin.mp4'))
    .listen(3000)
```

----------------------------------------

TITLE: Implementing Guards for Route Groups in ElysiaJS
DESCRIPTION: Shows how to use guards to add additional information to a group of routes in the API documentation.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/openapi.md#2025-04-23_snippet_5

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
	.guard({
		detail: {
			description: 'Require user to be logged in'
		}
	})
	.get('/user', 'user')
	.get('/admin', 'admin')
```

----------------------------------------

TITLE: Configuring ElysiaJS with Custom User Route Prefix
DESCRIPTION: Demonstrates how to configure ElysiaJS with a custom prefix for nested routes within Next.js app directory structure. Shows setup for '/user' prefix with GET and POST handlers.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/nextjs.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
// app/user/[[...slugs]]/route.ts
import { Elysia, t } from 'elysia'

const app = new Elysia({ prefix: '/user' })
    .get('/', () => 'hi')
    .post('/', ({ body }) => body, {
        body: t.Object({
            name: t.String()
        })
    })

export const GET = app.handle
export const POST = app.handle
```

----------------------------------------

TITLE: Service Locator: Accessing Decorated Properties Across Instances
DESCRIPTION: Shows how to use the Service Locator pattern in Elysia to access decorated properties defined in one plugin instance ('setup') from another instance ('main'). By using `.use(setup)`, the 'main' instance gains access to the properties decorated in 'setup'.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/plugin.md#_snippet_4

LANGUAGE: typescript
CODE:
```
// @errors: 2339
import { Elysia } from 'elysia'

// setup.ts
const setup = new Elysia({ name: 'setup' })
    .decorate('a', 'a')

// index.ts
const error = new Elysia()
    .get('/', ({ a }) => a)

const main = new Elysia()
    .use(setup)
    .get('/', ({ a }) => a)
    //           ^?
```

----------------------------------------

TITLE: Stopping Named Cron Jobs Dynamically - ElysiaJS in TypeScript
DESCRIPTION: Shows how to manually stop a running cron job by referencing it from the ElysiaJS store API. After registering a job named 'heartbeat', a GET endpoint '/stop' is defined. When '/stop' is requested, it stops the 'heartbeat' job using its name from the store and returns a confirmation message. Requires both 'elysia' and '@elysiajs/cron'. Key parameters are the cron configuration for registration and the endpoint handler for dynamic job management.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/cron.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { cron } from '@elysiajs/cron'

const app = new Elysia()
	.use(
		cron({
			name: 'heartbeat',
			pattern: '*/1 * * * * *',
			run() {
				console.log('Heartbeat')
			}
		})
	)
	.get(
		'/stop',
		({
			store: {
				cron: { heartbeat }
			}
		}) => {
			heartbeat.stop()

			return 'Stop heartbeat'
		}
	)
	.listen(3000)
```

----------------------------------------

TITLE: Setting Up Elysia Routes in Astro
DESCRIPTION: Creates an Elysia server instance in an Astro catch-all route file, defining API endpoints and exporting request handlers for different HTTP methods. This allows Elysia to handle API requests within the Astro application.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/astro.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
// pages/[...slugs].ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/api', () => 'hi')
    .post('/api', ({ body }) => body, {
        body: t.Object({
            name: t.String()
        })
    })

const handle = ({ request }: { request: Request }) => app.handle(request) // [!code ++]

export const GET = handle // [!code ++]
export const POST = handle // [!code ++]
```

----------------------------------------

TITLE: Setting Default Headers in Eden Treaty Configuration
DESCRIPTION: Shows how to set default headers when initializing Eden Treaty. This can be done using an object or a function that returns headers based on conditions.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/treaty/config.md#2025-04-23_snippet_3

LANGUAGE: typescript
CODE:
```
treaty<App>('localhost:3000', {
    headers: {
        'X-Custom': 'Griseo'
    }
})
```

LANGUAGE: typescript
CODE:
```
treaty<App>('localhost:3000', {
    headers(path, options) {
        if(path.startsWith('user'))
            return {
                authorization: 'Bearer 12345'
            }
    }
})
```

----------------------------------------

TITLE: GraphQL Context Configuration
DESCRIPTION: Example showing how to add custom context to GraphQL resolvers and use it within resolver functions.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/graphql-yoga.md#2025-04-23_snippet_3

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { yoga } from '@elysiajs/graphql-yoga'

const app = new Elysia()
	.use(
		yoga({
			typeDefs: /* GraphQL */ `
				type Query {
					hi: String
				}
			`,
			context: {
				name: 'Mobius'
			},
			useContext(_) {},
			resolvers: {
				Query: {
					hi: async (parent, args, context) => context.name
				}
			}
		})
	)
	.listen(3000)
```

----------------------------------------

TITLE: Configuring Apollo Context in ElysiaJS
DESCRIPTION: Illustrates how to customize the Apollo GraphQL context within an ElysiaJS application. It defines an asynchronous `context` function that receives the Elysia context object (containing the standard `request`). This example extracts the 'Authorization' header from the incoming request and makes it available within the GraphQL resolver context.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/graphql-apollo.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
const app = new Elysia()
	.use(
		apollo({
			typeDefs,
			resolvers,
			context: async ({ request }) => {
				const authorization = request.headers.get('Authorization')

				return {
					authorization
				}
			}
		})
	)
	.listen(3000)
```

----------------------------------------

TITLE: Type-Safe Error Handling with Status-Based Error Types
DESCRIPTION: This code demonstrates how to use status-based error types on the client side. It shows how TypeScript can narrow down error types based on the status code, providing better type safety when handling specific errors.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/treaty/legacy.md#2025-04-23_snippet_5

LANGUAGE: typescript
CODE:
```
const { data: nendoroid, error } = app.mirror.post({
    id: 1895,
    name: 'Skadi'
})

if(error) {
    switch(error.status) {
        case 400:
        case 401:
            // narrow down to type 'error' described in the server
            warnUser(error.value)
            break

        default:
            // typed as unknown
            reportError(error.value)
            break
    }

    throw error
}
```

----------------------------------------

TITLE: Setting up Eden Treaty Test with ElysiaJS
DESCRIPTION: Example of creating a basic integration test using Eden Treaty and Bun test runner. This setup demonstrates testing a simple GET endpoint with type safety and auto-completion support.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/test.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
// test/index.test.ts
import { describe, expect, it } from 'bun:test'

import { edenTreaty } from '@elysiajs/eden'

const app = new Elysia()
    .get('/', () => 'hi')
    .listen(3000)

const api = edenTreaty<typeof app>('http://localhost:3000')

describe('Elysia', () => {
    it('return a response', async () => {
        const { data } = await api.get()

        expect(data).toBe('hi')
    })
})
```

----------------------------------------

TITLE: Overriding WebSocket Configuration in Elysia (TypeScript)
DESCRIPTION: This example shows how to override the default WebSocket configuration for an Elysia instance. It extends Bun's WebSocket API options, allowing customization like enabling message compression (`perMessageDeflate`). It's generally recommended to use the default configuration unless specific needs arise.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/configuration.md#_snippet_14

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia({
	websocket: {
		// enable compression and decompression
    	perMessageDeflate: true
	}
})
```

----------------------------------------

TITLE: Recording Database Query Span using Record Utility - TypeScript
DESCRIPTION: Shows how to use the `record` utility provided by the `@elysiajs/opentelemetry` plugin. This utility wraps an asynchronous function (like a database query) and automatically creates, starts, and ends an OpenTelemetry span with a specified name (`database.query`), capturing the execution time and any exceptions.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/opentelemetry.md#_snippet_8

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia';
import { record } from '@elysiajs/opentelemetry';

export const plugin = new Elysia().get('', () => {
	return record('database.query', () => {
		return db.query('SELECT * FROM users');
	});
});
```

----------------------------------------

TITLE: Group and Guard Pattern in Elysia
DESCRIPTION: Examples showing both old and new syntax for combining group and guard functionality
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-05.md#2025-04-23_snippet_11

LANGUAGE: typescript
CODE:
```
// ✅ previously, you need to nest guard inside a group
app.group('/v1', (app) =>
    app.guard(
        {
            body: t.Literal()
        },
        (app) => app.get('/student', () => 'Rikuhachima Aru')
    )
)

// ✅ new, compatible with old syntax
app.group(
    '/v1', {
        body: t.Literal('Rikuhachima Aru')
    },
    app => app.get('/student', () => 'Rikuhachima Aru')
)

// ✅ compatible with function overload
app.group('/v1', app => app.get('/student', () => 'Rikuhachima Aru'))
```

----------------------------------------

TITLE: Defining Object Schema with Additional Properties Attribute in ElysiaJS (TypeScript)
DESCRIPTION: This snippet demonstrates adding the `additionalProperties` attribute to an object schema using `Elysia.t.Object()`. Setting `additionalProperties: true` allows the object to contain properties not explicitly defined in the schema, as long as they match the specified type (if any, though not specified here, it defaults to any type if not restricted further), based on JSON Schema specifications.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/type.md#_snippet_11

LANGUAGE: typescript
CODE:
```
t.Object(
    {
        x: t.Number()
    },
    {
        /**
         * @default false
         * Accept additional properties
         * that not specified in schema
         * but still match the type
         */
        additionalProperties: true
    }
)
```

----------------------------------------

TITLE: Using Resolve Lifecycle Method for Bearer Token Extraction in Elysia
DESCRIPTION: This snippet demonstrates the usage of the new 'resolve' lifecycle method in Elysia 0.8. It shows how to extract a bearer token from the Authorization header after validation.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-08.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .guard(
        {
            headers: t.Object({
                authorization: t.TemplateLiteral('Bearer ${string}')
            })
        },
        (app) =>
            app
                .resolve(({ headers: { authorization } }) => {
                    return {
                        bearer: authorization.split(' ')[1]
                    }
                })
                .get('/', ({ bearer }) => bearer)
    )
    .listen(3000)
```

----------------------------------------

TITLE: Implementing Security with Bearer Authentication
DESCRIPTION: Configuration example for implementing JWT-based Bearer Authentication in Swagger documentation
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/swagger.md#2025-04-23_snippet_5

LANGUAGE: typescript
CODE:
```
app.use(
    swagger({
        documentation: {
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT'
                    }
                }
            }
        }
    })
)

export const addressController = new Elysia({
    prefix: '/address',
    detail: {
        tags: ['Address'],
        security: [
            {
                bearerAuth: []
            }
        ]
    }
})
```

----------------------------------------

TITLE: Using ObjectString Type with Multipart Form Data
DESCRIPTION: Shows how to handle JSON objects in multipart/form-data using the new ObjectString type for file uploads with structured data
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-07.md#2025-04-23_snippet_5

LANGUAGE: typescript
CODE:
```
new Elysia({
    cookie: {
        secret: 'Fischl von Luftschloss Narfidort'
    }
})
    .post('/', ({ body: { data: { name } } }) => name, {
        body: t.Object({
            image: t.File(),
            data: t.ObjectString({
                name: t.String()
            })
        })
    })
```

----------------------------------------

TITLE: Configuring Elysia Server with Prefix for Nested Routes
DESCRIPTION: Example of setting up an Elysia server with a prefix for use in nested Expo API routes.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/expo.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
// app/api/[...slugs]+api.ts
import { Elysia, t } from 'elysia'

const app = new Elysia({ prefix: '/api' })
    .get('/', () => 'hi')
    .post('/', ({ body }) => body, {
        body: t.Object({
            name: t.String()
        })
    })

export const GET = app.handle
export const POST = app.handle
```

----------------------------------------

TITLE: Using Standalone Schema Guard in Elysia TypeScript
DESCRIPTION: This snippet illustrates how to define a schema within a `.guard()` using the new 'standalone' option. Setting `schema: 'standalone'` tells Elysia to merge this schema with any existing schemas from parent guards or routes, rather than overriding them. This allows for combining multiple schema definitions.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-13.md#_snippet_1

LANGUAGE: TypeScript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
	.guard({
		schema: 'standalone', // [!code ++]
		response: t.Object({
			title: t.String()
		})
	})
```

----------------------------------------

TITLE: Custom JWT Namespace Configuration
DESCRIPTION: Example showing how to configure JWT with a custom namespace name for multiple JWT configurations
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/jwt.md#2025-04-23_snippet_3

LANGUAGE: typescript
CODE:
```
app
    .use(
        jwt({
            name: 'myJWTNamespace',
            secret: process.env.JWT_SECRETS!
        })
    )
    .get('/sign/:name', ({ myJWTNamespace, params }) => {
        return myJWTNamespace.sign(params)
    })
```

----------------------------------------

TITLE: Implementing Swagger Tags Configuration
DESCRIPTION: Example demonstrating how to configure and use Swagger tags for grouping API endpoints
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/swagger.md#2025-04-23_snippet_4

LANGUAGE: typescript
CODE:
```
app.use(
    swagger({
        documentation: {
            tags: [
                { name: 'App', description: 'General endpoints' },
                { name: 'Auth', description: 'Authentication endpoints' }
            ]
        }
    })
)
```

----------------------------------------

TITLE: Extract Models to Variables in Elysia
DESCRIPTION: Demonstrates refactoring by extracting a schema definition into a constant variable ('SignDTO') and reusing it in route options, improving readability and reducing duplication compared to inline definitions.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_37

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

// Maybe in a different file eg. models.ts
const SignDTO = t.Object({
    username: t.String(),
    password: t.String()
})

const app = new Elysia()
    .post('/sign-in', ({ body }) => body, {
        body: SignDTO,
        response: SignDTO
    })
```

----------------------------------------

TITLE: Install Production Dependencies with Bun
DESCRIPTION: Run this command on your production server after building to install only the packages listed under the 'dependencies' section in your package.json. This ensures that external modules required by OpenTelemetry are installed in node_modules.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/deploy.md#_snippet_9

LANGUAGE: bash
CODE:
```
bun install --production
```

----------------------------------------

TITLE: Error Handling with Eden Treaty
DESCRIPTION: This code shows how to handle errors with Eden Treaty, which returns both data and error properties. It demonstrates error status code checking and type narrowing with appropriate error handling based on different HTTP status codes.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/treaty/legacy.md#2025-04-23_snippet_3

LANGUAGE: typescript
CODE:
```
// response type: { id: 1895, name: 'Skadi' }
const { data: nendoroid, error } = app.mirror.post({
    id: 1895,
    name: 'Skadi'
})

if(error) {
    switch(error.status) {
        case 400:
        case 401:
            warnUser(error.value)
            break

        case 500:
        case 502:
            emergencyCallDev(error.value)
            break

        default:
            reportError(error.value)
            break
    }

    throw error
}

const { id, name } = nendoroid
```

----------------------------------------

TITLE: Defining a Deferred Elysia Plugin (TypeScript)
DESCRIPTION: This TypeScript code defines an asynchronous Elysia plugin intended for deferred loading. It demonstrates loading external files asynchronously and registering routes for each file. This type of plugin is automatically treated as deferred if not awaited during application setup.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/plugin.md#_snippet_19

LANGUAGE: typescript
CODE:
```
// plugin.ts
import { Elysia, file } from 'elysia'
import { loadAllFiles } from './files'

export const loadStatic = async (app: Elysia) => {
    const files = await loadAllFiles()

    files.forEach((asset) => app
        .get(asset, file(file))
    )

    return app
}
```

----------------------------------------

TITLE: Applying Guard Scope to Elysia Hooks in TypeScript
DESCRIPTION: This snippet shows how to use the 'guard as' method by setting `as: 'scoped'` on a `guard` block. This applies the specified scope to all hooks (like `beforeHandle`) and schemas (`response`) defined within that guard, making them available to the parent instance that uses the plugin.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/plugin.md#_snippet_14

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

const plugin = new Elysia()
	.guard({
		as: 'scoped', // [!code ++]
		response: t.String(),
		beforeHandle() {
			console.log('ok')
		}
	})
    .get('/child', 'ok')

const main = new Elysia()
    .use(plugin)
    .get('/parent', 'hello')
```

----------------------------------------

TITLE: Using Predefined Patterns for Cron Scheduling - ElysiaJS in TypeScript
DESCRIPTION: Illustrates advanced scheduling by importing time interval patterns from '@elysiajs/cron/schedule' via the 'Patterns' export. Instead of using raw cron syntax, the job schedule is defined by 'Patterns.everySecond()', providing increased readability and maintenance. The code also shows how to combine this with manual job management via the '/stop' endpoint. Requires both 'elysia' and '@elysiajs/cron', plus '@elysiajs/cron/schedule' for pattern constants and functions.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/cron.md#2025-04-23_snippet_3

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { cron, Patterns } from '@elysiajs/cron'

const app = new Elysia()
	.use(
		cron({
			name: 'heartbeat',
			pattern: Patterns.everySecond(),
			run() {
				console.log('Heartbeat')
			}
		})
	)
	.get(
		'/stop',
		({
			store: {
				cron: { heartbeat }
			}
		}) => {
			heartbeat.stop()

			return 'Stop heartbeat'
		}
	)
	.listen(3000)
```

----------------------------------------

TITLE: Validation Error Response Format in Elysia
DESCRIPTION: Example of the new JSON validation error format that includes detailed error information, expected values, and found values to help identify validation issues.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-08.md#2025-04-23_snippet_8

LANGUAGE: json
CODE:
```
{
  "type": "query",
  "at": "password",
  "message": "Required property",
  "expected": {
    "email": "eden@elysiajs.com",
    "password": ""
  },
  "found": {
    "email": "eden@elysiajs.com"
  },
  "errors": [
    {
      "type": 45,
      "schema": {
        "type": "string"
      },
      "path": "/password",
      "message": "Required property"
    },
    {
      "type": 54,
      "schema": {
        "type": "string"
      },
      "path": "/password",
      "message": "Expected string"
    }
  ]
}
```

----------------------------------------

TITLE: Initializing Eden Treaty with URL Endpoint in TypeScript
DESCRIPTION: Creates an Eden Treaty instance using a URL endpoint. This approach uses fetch or a custom fetcher to make network requests to an Elysia instance.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/treaty/config.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
import { treaty } from '@elysiajs/eden'
import type { App } from './server'

const api = treaty<App>('localhost:3000')
```

----------------------------------------

TITLE: Recording Custom Spans with record Utility in ElysiaJS
DESCRIPTION: Illustrates the use of the `record` utility provided by `@elysiajs/opentelemetry` to create custom spans around specific code blocks, such as database queries, automatically handling span lifecycle and exceptions.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-11.md#_snippet_2

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { record } from '@elysiajs/opentelemetry'

export const plugin = new Elysia()
	.get('', () => {
		return record('database.query', () => {
			return db.query('SELECT * FROM users')
		})
	})
```

----------------------------------------

TITLE: Adding Tags to Route Groups in ElysiaJS
DESCRIPTION: Demonstrates how to add tags to a group of routes for better organization in the API documentation.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/openapi.md#2025-04-23_snippet_4

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia({
	tags: ['user']
})
	.get('/user', 'user')
	.get('/admin', 'admin')
```

----------------------------------------

TITLE: Default Path Parameter Type Inference in Elysia
DESCRIPTION: When no explicit schema is provided for path parameters in Elysia, the framework automatically infers the type of the parameter (e.g., `:id`) as a string. This snippet shows a route definition where the `id` parameter will be treated as a string by default.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_16

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/id/:id', ({ params }) => params)
                      // ^?
```

----------------------------------------

TITLE: Basic Authentication Routes Setup in ElysiaJS
DESCRIPTION: Initial setup of authentication routes with basic sign-up and sign-in endpoints using ElysiaJS group routing.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-supabase.md#2025-04-23_snippet_5

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const authen = (app: Elysia) =>
    app.group('/auth', (app) =>
        app
            .post('/sign-up', () => {
                return 'This route is expected to sign up a user'
            })
            .post('/sign-in', () => {
                return 'This route is expected to sign in a user'
            })
    )
```

----------------------------------------

TITLE: Route Response Type Guarding
DESCRIPTION: Demonstrates type enforcement for route responses using guards
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/cheat-sheet.md#2025-04-23_snippet_10

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
    .guard({
        response: t.String()
    }, (app) => app
        .get('/', () => 'Hi')
        // Invalid: will throws error, and TypeScript will report error
        .get('/invalid', () => 1)
    )
    .listen(3000)
```

----------------------------------------

TITLE: Configuring Custom Swagger Endpoint
DESCRIPTION: Example showing how to customize the Swagger documentation endpoint path
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/swagger.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'

new Elysia()
    .use(
        swagger({
            path: '/v2/swagger'
        })
    )
    .listen(3000)
```

----------------------------------------

TITLE: Configuring Cookie Signatures with Secret Keys in Elysia
DESCRIPTION: Shows how to implement cookie signatures in Elysia 0.7 to verify cookie authenticity using a secret key, with automatic signing and verification.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-07.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
new Elysia({
    cookie: {
        secret: 'Fischl von Luftschloss Narfidort'
    }
})
    .get('/', ({ cookie: { profile } }) => {
        profile.value = {
            id: 617,
            name: 'Summoning 101'
        }
    }, {
        cookie: t.Cookie({
            profile: t.Object({
                id: t.Numeric(),
                name: t.String()
            })
        }, {
            sign: ['profile']
        })
    })
```

----------------------------------------

TITLE: Custom Function Error Message for t.Number Validation in ElysiaJS
DESCRIPTION: Demonstrates using the `error` property with a function on a TypeBox `t.Number` definition within a body schema to programmatically generate a custom validation failure message, showing the function signature.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_28

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
    .post('/', () => 'Hello World!', {
        body: t.Object({
            x: t.Number({
                error() {
                    return 'Expected x to be a number'
                }
            })
        })
    })
    .listen(3000)
```

----------------------------------------

TITLE: Cookie Secret Rotation
DESCRIPTION: Shows how to implement cookie secret rotation for enhanced security.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/cookie.md#2025-04-23_snippet_7

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia({
    cookie: {
        secrets: ['Vengeance will be mine', 'Fischl von Luftschloss Narfidort']
    }
})
```

----------------------------------------

TITLE: Demonstrating Default Elysia Lifecycle Encapsulation (TypeScript)
DESCRIPTION: This snippet shows the default behavior of Elysia.js lifecycle encapsulation, where properties defined in a plugin's `.resolve()` or `.guard()` are not automatically available in the parent application that uses the plugin. It defines a `userService` with state, models, and a macro, and then a `getUserId` plugin and a `user` app that uses it, illustrating that the `username` property from `getUserId` is not accessible in the `/profile` handler.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_29

LANGUAGE: TypeScript
CODE:
```
// @errors: 2339
import { Elysia, t } from 'elysia'

export const userService = new Elysia({ name: 'user/service' })
    .state({
        user: {} as Record<string, string>,
        session: {} as Record<number, string>
    })
    .model({
        signIn: t.Object({
            username: t.String({ minLength: 1 }),
            password: t.String({ minLength: 8 })
        }),
        session: t.Cookie(
            {
                token: t.Number()
            },
            {
                secrets: 'seia'
            }
        ),
        optionalSession: t.Optional(t.Ref('session'))
    })
    .macro({
        isSignIn(enabled: boolean) {
            if (!enabled) return

            return {
            	beforeHandle({ error, cookie: { token }, store: { session } }) {
                    if (!token.value)
                        return error(401, {
                            success: false,
                            message: 'Unauthorized'
                        })

                    const username = session[token.value as unknown as number]

                    if (!username)
                        return error(401, {
                            success: false,
                            message: 'Unauthorized'
                        })
                }
            }
        }
    })
// ---cut---
export const getUserId = new Elysia()
    .use(userService)
    .guard({
       	isSignIn: true,
        cookie: 'session'
    })
    .resolve(({ store: { session }, cookie: { token } }) => ({
        username: session[token.value]
    }))

export const user = new Elysia({ prefix: '/user' })
	.use(getUserId)
	.get('/profile', ({ username }) => ({
        success: true,
        username
    }))
```

----------------------------------------

TITLE: Setting Up PostgreSQL Database with Docker
DESCRIPTION: Runs a PostgreSQL database instance using Docker, exposing it on port 5432 with a specified password.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/with-prisma.md#2025-04-23_snippet_4

LANGUAGE: bash
CODE:
```
docker run -p 5432:5432 -e POSTGRES_PASSWORD=12345678 -d postgres
```

----------------------------------------

TITLE: Apply Swagger Plugin to Elysia App
DESCRIPTION: Imports and applies the swagger plugin to the Elysia application instance using the .use() method. This enables the /swagger endpoint for viewing API documentation and testing routes.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_8

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'

const app = new Elysia()
    // Apply the swagger plugin
    .use(swagger()) // [!code ++]
    .get('/', ({ path }) => path)
    .post('/hello', 'Do you miss me?')
    .listen(3000)
```

----------------------------------------

TITLE: Correcting Path Alias Resolution in tsconfig.json
DESCRIPTION: Provides a corrected tsconfig.json configuration where the @/* alias explicitly points to the backend source directory relative to the monorepo root, ensuring consistent resolution for shared modules.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/installation.md#_snippet_10

LANGUAGE: json
CODE:
```
{
  "compilerOptions": {
  	"baseUrl": ".",
	"paths": {
	  "@/*": ["../apps/backend/src/*"]
	}
  }
}
```

----------------------------------------

TITLE: Sending Messages with Updated Elysia WebSocket API - TypeScript
DESCRIPTION: Explains the migration in Elysia 1.2 where WebSocket methods now return their respective values rather than allowing method chaining, in line with compatibility goals with Bun's API. The snippet displays old versus new usage for the `send` method inside a WebSocket endpoint. Requires the `elysia` package. The `ws` handler accepts a client connection, with key changes highlighted between chained and unchained invocations. Outputs direct message sends to the client socket without chained calls. Users should migrate off chaining for future compatibility.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-12.md#2025-04-23_snippet_9

LANGUAGE: TypeScript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
	.ws('/', {
		message(ws) {
			ws // [!code --]
				.send('hello') // [!code --]
				.send('world') // [!code --]

			ws.send('hello') // [!code ++]
			ws.send('world') // [!code ++]
		}
	})
```

----------------------------------------

TITLE: Creating a Basic Macro in ElysiaJS v1
DESCRIPTION: Demonstrates creating a basic macro that logs a word using the onBeforeHandle lifecycle event. When the route is accessed, it logs "Elysia" to the console.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/macro.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const plugin = new Elysia({ name: 'plugin' })
    .macro(({ onBeforeHandle }) => ({
        hi(word: string) {
            onBeforeHandle(() => {
                console.log(word)
            })
        }
    }))

const app = new Elysia()
    .use(plugin)
    .get('/', () => 'hi', {
        hi: 'Elysia'
    })
```

----------------------------------------

TITLE: Integrating Better Auth OpenAPI with ElysiaJS Swagger (TypeScript)
DESCRIPTION: Demonstrates how to use the extracted OpenAPI schema from Better Auth (via the `OpenAPI` utility) to configure the `@elysiajs/swagger` plugin in an ElysiaJS application, providing API documentation for the authentication endpoints.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/better-auth.md#_snippet_4

LANGUAGE: TypeScript
CODE:
```
import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'

import { OpenAPI } from './auth'

const app = new Elysia().use(
	swagger({
		documentation: {
			components: await OpenAPI.components,
			paths: await OpenAPI.getPaths()
		}
	})
)
```

----------------------------------------

TITLE: OpenAPI Documentation Setup
DESCRIPTION: Shows how to integrate Swagger documentation
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/cheat-sheet.md#2025-04-23_snippet_15

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'

const app = new Elysia()
    .use(swagger())
    .listen(3000)

console.log(`View documentation at "${app.server!.url}swagger" in your browser`);
```

----------------------------------------

TITLE: Implementing Conditional Routes in Elysia
DESCRIPTION: Shows how to use the new .if method to create conditional routes or apply plugins based on specific conditions. This example demonstrates excluding Swagger documentation in a production environment.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-04.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
const isProduction = process.env.NODE_ENV === 'production'

const app = new Elysia().if(!isProduction, (app) =>
    app.use(swagger())
)
```

----------------------------------------

TITLE: Using WebSocket in Elysia
DESCRIPTION: Shows the updated WebSocket API in Elysia 1.2 with ping and pong handlers.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-12.md#2025-04-23_snippet_5

LANGUAGE: typescript
CODE:
```
new Elysia()
	.ws('/ws', {
		ping: (message) => message,
		pong: (message) => message
	})
```

----------------------------------------

TITLE: Implementing Elysia Server in Expo API Route
DESCRIPTION: Example of creating an Elysia server in an Expo API route file, defining GET and POST handlers.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/expo.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
// app/[...slugs]+api.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/', () => 'hello Next')
    .post('/', ({ body }) => body, {
        body: t.Object({
            name: t.String()
        })
    })

export const GET = app.handle // [!code ++]
export const POST = app.handle // [!code ++]
```

----------------------------------------

TITLE: Defining Array of Numbers Schema in ElysiaJS (TypeScript)
DESCRIPTION: This snippet shows how to define a schema for an array where all elements must be numbers using `Elysia.t.Array()` combined with `Elysia.t.Number()`. This corresponds to the TypeScript `number[]` type for validation.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/type.md#_snippet_4

LANGUAGE: typescript
CODE:
```
t.Array(
    t.Number()
)
```

----------------------------------------

TITLE: Applying Instance Scope to Elysia Plugin in TypeScript
DESCRIPTION: This example demonstrates the 'instance as' method by calling `as('scoped')` on the entire plugin instance. This lifts the scope of all hooks and schemas defined within that plugin, making them available to the parent instance that uses the plugin.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/plugin.md#_snippet_15

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const plugin = new Elysia()
    .derive(() => {
        return { hi: 'ok' }
    })
    .get('/child', ({ hi }) => hi)
    .as('scoped') // [!code ++]

const main = new Elysia()
    .use(plugin)
    // ✅ Hi is now available
    .get('/parent', ({ hi }) => hi)
```

----------------------------------------

TITLE: Defining Null Type Schema in ElysiaJS (TypeScript)
DESCRIPTION: This snippet shows the basic TypeBox syntax used in ElysiaJS (`Elysia.t.Null()`) to define a schema that validates a value as `null`. This corresponds directly to the TypeScript `null` type for validation purposes.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/type.md#_snippet_6

LANGUAGE: typescript
CODE:
```
t.Null()
```

----------------------------------------

TITLE: Defining Boolean Type Schema in ElysiaJS (TypeScript)
DESCRIPTION: This snippet shows the basic TypeBox syntax used in ElysiaJS (`Elysia.t.Boolean()`) to define a schema that validates a value as a boolean. This corresponds directly to the TypeScript `boolean` type for validation purposes.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/type.md#_snippet_3

LANGUAGE: typescript
CODE:
```
t.Boolean()
```

----------------------------------------

TITLE: WebSocket Message Validation in ElysiaJS
DESCRIPTION: Shows how to implement message validation for WebSocket connections using schemas, including query parameters and message body validation.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/websocket.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .ws('/ws', {
        // validate incoming message
        body: t.Object({
            message: t.String()
        }),
        query: t.Object({
            id: t.String()
        }),
        message(ws, { message }) {
            // Get schema from `ws.data`
            const { id } = ws.data.query
            ws.send({
                id,
                message,
                time: Date.now()
            })
        }
    })
    .listen(3000)
```

----------------------------------------

TITLE: Customizing Swagger Documentation Info
DESCRIPTION: Configuration example for customizing Swagger documentation metadata including title and version
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/swagger.md#2025-04-23_snippet_3

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'

new Elysia()
    .use(
        swagger({
            documentation: {
                info: {
                    title: 'Elysia Documentation',
                    version: '1.0.0'
                }
            }
        })
    )
    .listen(3000)
```

----------------------------------------

TITLE: State Remapping Example in Elysia
DESCRIPTION: Demonstrates how to remap state properties to prevent name collisions using state transformation function
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-07.md#2025-04-23_snippet_6

LANGUAGE: typescript
CODE:
```
new Elysia()
    .state({
        a: "a",
        b: "b"
    })
    // Exclude b state
    .state(({ b, ...rest }) => rest)
```

----------------------------------------

TITLE: Demonstrating Explicit Validation Error (demo2)
DESCRIPTION: This snippet defines an Elysia instance (`demo2`) demonstrating how validation errors can be explicitly thrown. It shows a route `/id/a` that throws a `ValidationError` for invalid parameters, specifically when the `id` is not numeric.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_1

LANGUAGE: TypeScript
CODE:
```
const demo2 = new Elysia()
    .get('/id/1', '1')
    .get('/id/a', () => {
        throw new ValidationError(
            'params',
            t.Object({
                id: t.Numeric()
            }),
            {
                id: 'a'
            }
        )
    })
```

----------------------------------------

TITLE: Using Reactive Cookie API in Elysia
DESCRIPTION: Example of using the new reactive cookie API in Elysia 0.7, where cookies are handled as reactive objects with automatic synchronization with headers.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-07.md#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```
app.get('/', ({ cookie: { name } }) => {
    // Get
    name.value

    // Set
    name.value = "New Value"
})
```

----------------------------------------

TITLE: Namespace Models with Naming Convention (User)
DESCRIPTION: Provides another example of the naming convention using dot notation ('user.auth') for models related to a different domain (user), reinforcing the pattern for preventing name clashes when integrating multiple model plugins.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_43

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

// user.model.ts
export const userModels = new Elysia()
    .model({
        'user.auth': t.Object({
            username: t.String(),
            password: t.String()
        })
    })
```

----------------------------------------

TITLE: Integrate OpenTelemetry Plugin in Elysia App
DESCRIPTION: Demonstrates how to apply the @elysiajs/opentelemetry plugin to an Elysia application. It shows the necessary imports and plugin usage in the main application file (index.ts), alongside example service files (note.ts, user.ts) for context.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_51

LANGUAGE: typescript
CODE:
```
// @errors: 2538
// @filename: note.ts
import { Elysia, t } from 'elysia'

class Note {
    constructor(public data: string[] = ['Moonhalo']) {}
}

export const note = new Elysia()
    .decorate('note', new Note())
    .get('/note', ({ note }) => note.data)
    .get(
        '/note/:index',
        ({ note, params: { index }, error }) => {
            return note.data[index] ?? error(404, 'oh no :(')
        },
        {
            params: t.Object({
                index: t.Number()
            })
        }
    )
```

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

export const userService = new Elysia({ name: 'user/service' })
    .state({
        user: {} as Record<string, string>,
        session: {} as Record<number, string>
    })
    .model({
        signIn: t.Object({
            username: t.String({ minLength: 1 }),
            password: t.String({ minLength: 8 })
        }),
        session: t.Cookie(
            {
                token: t.Number()
            },
            {
                secrets: 'seia'
            }
        ),
        optionalSession: t.Optional(t.Ref('session'))
    })
    .macro({
        isSignIn(enabled: boolean) {
            if (!enabled) return

            return {
            	beforeHandle({ error, cookie: { token }, store: { session } }) {
                            if (!token.value)
                                return error(401, {
                                    success: false,
                                    message: 'Unauthorized'
                                })

                            const username = session[token.value as unknown as number]

                            if (!username)
                                return error(401, {
                                    success: false,
                                    message: 'Unauthorized'
                                })
                        }
                    }
                }
            })

export const getUserId = new Elysia()
    .use(userService)
    .guard({
    	isSignIn: true,
        cookie: 'session'
    })
    .resolve(
    	({ store: { session }, cookie: { token } }) => ({
    	   	username: session[token.value]
    	})
    )
    .as('scoped')

export const user = new Elysia({ prefix: '/user' })
	.use(getUserId)
	.get('/profile', ({ username }) => ({
        success: true,
        username
    }))
```

LANGUAGE: typescript
CODE:
```
// ---cut---
import { Elysia, t } from 'elysia'
import { opentelemetry } from '@elysiajs/opentelemetry' // [!code ++]
import { swagger } from '@elysiajs/swagger'

import { note } from './note'
import { user } from './user'

const app = new Elysia()
    .use(opentelemetry()) // [!code ++]
    .use(swagger())
    .onError(({ error, code }) => {
        if (code === 'NOT_FOUND') return 'Not Found :('

        console.error(error)
    })
    .use(note)
    .use(user)
    .listen(3000)
```

----------------------------------------

TITLE: Configuring Astro for Server Output
DESCRIPTION: Sets up Astro configuration to enable server-side rendering by modifying the astro.config.mjs file to use 'server' as the output mode, which is required for running Elysia.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/astro.md#2025-04-23_snippet_0

LANGUAGE: javascript
CODE:
```
// astro.config.mjs
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
    output: 'server' // [!code ++]
})
```

----------------------------------------

TITLE: Implementing Default Query Parameters in Elysia
DESCRIPTION: Demonstrates how to set default values for query parameters using TypeBox's new default field support. The example shows setting a default value 'Elysia' for the name query parameter.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-08.md#2025-04-23_snippet_6

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .get('/', ({ query: { name } }) => name, {
        query: t.Object({
            name: t.String({
                default: 'Elysia'
            })
        })
    })
    .listen(3000)
```

----------------------------------------

TITLE: Elysia Automatic Boolean to BooleanString Conversion in Route Schemas
DESCRIPTION: Shows how Elysia automatically converts `t.Boolean` to `t.BooleanString` when used in route schemas (params, query, headers) but not in nested objects or standalone types. This handles string inputs like "true" or "false" from HTTP requests.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/type.md#_snippet_25

LANGUAGE: TypeScript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/:id', ({ id }) => id, {
		params: t.Object({
			// Converted to t.Boolean()
			id: t.Boolean()
		}),
		body: t.Object({
			// NOT converted to t.Boolean()
			id: t.Boolean()
		})
	})

// NOT converted to t.BooleanString()
t.Boolean()
```

----------------------------------------

TITLE: Setting Up Reference Models in Elysia
DESCRIPTION: Demonstrates how to use setModel to create reusable schema definitions with type inference and validation
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-02.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
const app = new Elysia()
    .setModel({
        sign: t.Object({
            username: t.String(),
            password: t.String()
        })
    })
    .post('/sign', ({ body }) => body, {
        schema: {
            body: 'sign',
            response: 'sign'
        }
    })
```

----------------------------------------

TITLE: Tracing Lifecycle Events with Elysia Trace v2 (TypeScript)
DESCRIPTION: Demonstrates how to use the `trace` plugin in Elysia v1.1+ to listen to lifecycle events like `onBeforeHandle`. It shows how to use nested `onEvent` and `onStop` callbacks to measure the duration of specific operations and synchronously modify response headers based on trace results.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-11.md#_snippet_4

LANGUAGE: TypeScript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
	.trace(({ onBeforeHandle, set }) => {
		// Listen to before handle event
		onBeforeHandle(({ onEvent }) => {
			// Listen to all child event in order
			onEvent(({ onStop, name }) => {
				// Execute something after a child event is finished
				onStop(({ elapsed }) => {
					console.log(name, 'took', elapsed, 'ms')

					// callback is executed synchronously before next event
					set.headers['x-trace'] = 'true'
				})
			})
		})
	})
```

----------------------------------------

TITLE: Configuring Custom Fetcher in Eden Treaty
DESCRIPTION: Demonstrates how to provide a custom fetcher function instead of using the default fetch. This is useful when integrating with other HTTP clients like Axios or unfetch.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/treaty/config.md#2025-04-23_snippet_4

LANGUAGE: typescript
CODE:
```
treaty<App>('localhost:3000', {
    fetcher(url, options) {
        return fetch(url, options)
    }
})
```

----------------------------------------

TITLE: Defining OpenAPI Tags for Elysia Instance (TypeScript)
DESCRIPTION: This snippet demonstrates how to define global OpenAPI tags for all routes within an Elysia instance using the `tags` configuration option. This helps categorize routes in the generated OpenAPI documentation.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/configuration.md#_snippet_13

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia({
	tags: ['elysia']
})
```

----------------------------------------

TITLE: Defining OpenAPI Details for Elysia Instance (TypeScript)
DESCRIPTION: Explains how to provide default OpenAPI schema details for all routes within an Elysia instance by configuring the `detail` property in the constructor. This can include options like hiding the instance or adding tags.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/configuration.md#_snippet_3

LANGUAGE: TypeScript
CODE:
```
import { Elysia } from 'elysia'

new Elysia({
	detail: {
		hide: true,
		tags: ['elysia']
	}
})
```

----------------------------------------

TITLE: Cookie Signature Implementation
DESCRIPTION: Shows how to implement cookie signing for secure cookie handling.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/cookie.md#2025-04-23_snippet_5

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
    .get('/', ({ cookie: { profile } }) => {
        profile.value = {
            id: 617,
            name: 'Summoning 101'
        }
    }, {
        cookie: t.Cookie({
            profile: t.Object({
                id: t.Numeric(),
                name: t.String()
            })
        }, {
            secrets: 'Fischl von Luftschloss Narfidort',
            sign: ['profile']
        })
    })
```

----------------------------------------

TITLE: Use Elysia Model Plugin in Application
DESCRIPTION: Illustrates how to import and register a model plugin ('authModel') defined in a separate file using '.use()', making the named models available for use by name string in routes within the main application instance.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_40

LANGUAGE: typescript
CODE:
```
// @filename: auth.model.ts
import { Elysia, t } from 'elysia'

export const authModel = new Elysia()
    .model({
        sign: t.Object({
            username: t.String(),
            password: t.String()
        })
    })

// @filename: index.ts
// ---cut---
// index.ts
import { Elysia } from 'elysia'
import { authModel } from './auth.model'

const app = new Elysia()
    .use(authModel)
    .post('/sign-in', ({ body }) => body, {
        // with auto-completion for existing model name
        body: 'sign',
        response: 'sign'
    })
```

----------------------------------------

TITLE: WebSocket Subscription Implementation
DESCRIPTION: Setting up tRPC subscriptions using WebSocket with event emitter pattern
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/integrate-trpc-with-elysia.md#2025-04-23_snippet_5

LANGUAGE: typescript
CODE:
```
import { initTRPC } from '@trpc/server'
import { observable } from '@trpc/server/observable'
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { EventEmitter } from 'stream'
import { zod } from 'zod'

export const createContext = async (opts: FetchCreateContextFnOptions) => {
    return {
        name: 'elysia'
    }
}

const t = initTRPC.context<Awaited<ReturnType<typeof createContext>>>().create()
const ee = new EventEmitter()

export const router = t.router({
    mirror: t.procedure.input(z.string()).query(({ input }) => {
        ee.emit('listen', input)
        return input
    }),
    listen: t.procedure.subscription(() =>
        observable<string>((emit) => {
            ee.on('listen', (input) => {
                emit.next(input)
            })
        })
    )
})

export type Router = typeof router
```

----------------------------------------

TITLE: Basic GraphQL Server Setup
DESCRIPTION: Example of setting up a basic GraphQL server with Elysia and GraphQL Yoga plugin, including type definitions and resolvers.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/graphql-yoga.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { yoga } from '@elysiajs/graphql-yoga'

const app = new Elysia()
	.use(
		yoga({
			typeDefs: /* GraphQL */ `
				type Query {
					hi: String
				}
			`,
			resolvers: {
				Query: {
					hi: () => 'Hello from Elysia'
				}
			}
		})
	)
	.listen(3000)
```

----------------------------------------

TITLE: Installing Cron Plugin with Bun - Bash
DESCRIPTION: Installs the @elysiajs/cron package into your project using the Bun package manager. Required as a prerequisite for all cron-related usage within ElysiaJS. No parameters are needed; simply execute the command in your project root. This will update your package manifest and install dependencies accordingly.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/cron.md#2025-04-23_snippet_0

LANGUAGE: bash
CODE:
```
bun add @elysiajs/cron
```

----------------------------------------

TITLE: Lazy Loading Module Implementation
DESCRIPTION: Shows how to implement lazy loading of modules using dynamic imports in Elysia 0.2
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-02.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
app.use(import('./some-heavy-module'))
```

----------------------------------------

TITLE: Implementing Interceptor Hook for HTML Content Type
DESCRIPTION: Demonstrates how to use an interceptor hook to automatically set Content-Type headers for HTML responses across multiple routes.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/life-cycle.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { isHtml } from '@elysiajs/html'

new Elysia()
    .get('/none', () => '<h1>Hello World</h1>')
    .onAfterHandle(({ response, set }) => {
        if (isHtml(response))
            set.headers['Content-Type'] = 'text/html; charset=utf8'
    })
    .get('/', () => '<h1>Hello World</h1>')
    .get('/hi', () => '<h1>Hello World</h1>')
    .listen(3000)
```

----------------------------------------

TITLE: Initializing Eden Treaty with Elysia Instance in TypeScript
DESCRIPTION: Creates an Eden Treaty instance using an Elysia instance directly. This approach allows interaction with the Elysia server without network requests, useful for testing or creating type-safe reverse proxies.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/treaty/config.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { treaty } from '@elysiajs/eden'

const app = new Elysia()
    .get('/hi', 'Hi Elysia')
    .listen(3000)

const api = treaty(app)
```

----------------------------------------

TITLE: File Response Handling
DESCRIPTION: Demonstrates returning files as part of the response using formdata
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/cheat-sheet.md#2025-04-23_snippet_4

LANGUAGE: typescript
CODE:
```
import { Elysia, file } from 'elysia'

new Elysia()
    .get('/json', () => {
        return {
            hello: 'Elysia',
            image: file('public/cat.jpg')
        }
    })
    .listen(3000)
```

----------------------------------------

TITLE: GraphQL Integration
DESCRIPTION: Demonstrates integration with GraphQL Yoga for GraphQL server functionality
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/cheat-sheet.md#2025-04-23_snippet_18

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { yoga } from '@elysiajs/graphql-yoga'

const app = new Elysia()
    .use(
        yoga({
            typeDefs: /* GraphQL */`
                type Query {
                    hi: String
                }
            `,
            resolvers: {
                Query: {
                    hi: () => 'Hello from Elysia'
                }
            }
        })
    )
    .listen(3000)
```

----------------------------------------

TITLE: Using a Lazy Load Elysia Module (TypeScript)
DESCRIPTION: This example demonstrates how to lazy-load an entire module using a dynamic `import()` within the `.use()` method. Elysia recognizes the dynamic import and defers the registration of the module's contents until after the server starts, regardless of whether the imported module is sync or async.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/plugin.md#_snippet_21

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const app = new Elysia()
    .use(import('./plugin'))
```

----------------------------------------

TITLE: Elysia Server with tRPC Integration
DESCRIPTION: Integration of tRPC router with Elysia server including CORS support
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/integrate-trpc-with-elysia.md#2025-04-23_snippet_3

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { trpc } from '@elysiajs/trpc'

import { router } from './trpc'

const app = new Elysia()
    .use(cors())
    .get('/', () => 'Hello Elysia')
    .use(
        trpc(router)
    )
    .listen(3000)

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
```

----------------------------------------

TITLE: Request Handling with Elysia.handle
DESCRIPTION: Demonstrates programmatic request handling using Elysia.handle for testing and simulation.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/handler.md#2025-04-23_snippet_12

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const app = new Elysia()
    .get('/', () => 'hello')
    .post('/hi', () => 'hi')
    .listen(3000)

app.handle(new Request('http://localhost/')).then(console.log)
```

----------------------------------------

TITLE: Installing tRPC Dependencies
DESCRIPTION: Command to install required dependencies for tRPC integration with Elysia
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/integrate-trpc-with-elysia.md#2025-04-23_snippet_1

LANGUAGE: bash
CODE:
```
bun add @trpc/server zod @elysiajs/trpc @elysiajs/cors
```

----------------------------------------

TITLE: Non-Request Dependent Service Implementation
DESCRIPTION: Example of implementing a service that doesn't depend on request context using static methods.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/structure.md#2025-04-23_snippet_4

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

abstract class Service {
    static fibo(number: number): number {
        if(number < 2)
            return number

        return Service.fibo(number - 1) + Service.fibo(number - 2)
    }
}

new Elysia()
    .get('/fibo', ({ body }) => {
        return Service.fibo(body)
    }, {
        body: t.Numeric()
    })
```

----------------------------------------

TITLE: Using Macro with Resolve in Elysia
DESCRIPTION: Demonstrates the new macro object syntax in Elysia 1.2 that allows using 'resolve' within macros for more concise code.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-12.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
	.macro({
		user: (enabled: true) => ({
			resolve: ({ cookie: { session } }) => ({
				user: session.value!
			})
		})
	})
	.get('/', ({ user }) => user, {
		user: true
	})
```

----------------------------------------

TITLE: Scoped Plugin Implementation in Elysia
DESCRIPTION: Shows how to create truly encapsulated plugin instances using the new scoped functionality
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-07.md#2025-04-23_snippet_9

LANGUAGE: typescript
CODE:
```
const plugin = new Elysia({ scoped: true, prefix: '/hello' })
    .onRequest(() => {
        console.log('In Scoped')
    })
    .get('/', () => 'hello')

const app = new Elysia()
    .use(plugin)
    // 'In Scoped' will not log
    .get('/', () => 'Hello World')
```

----------------------------------------

TITLE: Custom String Error Message for t.Number Validation in ElysiaJS
DESCRIPTION: Demonstrates using the `error` property with a string value directly on a TypeBox `t.Number` definition within a body schema to provide a custom validation failure message.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_23

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
    .post('/', () => 'Hello World!', {
        body: t.Object({
            x: t.Number({
               	error: 'x must be a number'
            })
        })
    })
    .listen(3000)
```

----------------------------------------

TITLE: Dockerfile for Elysia App in Turborepo Monorepo
DESCRIPTION: A multi-stage Dockerfile example for building and running an Elysia application within a Turborepo monorepo. It includes steps for caching dependencies, copying necessary app and package files, building the application, and creating a minimal final image.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/deploy.md#_snippet_11

LANGUAGE: dockerfile
CODE:
```
FROM oven/bun:1 AS build

WORKDIR /app

# Cache packages
COPY package.json package.json
COPY bun.lock bun.lock

COPY /apps/server/package.json ./apps/server/package.json
COPY /packages/config/package.json ./packages/config/package.json

RUN bun install

COPY /apps/server ./apps/server
COPY /packages/config ./packages/config

ENV NODE_ENV=production

RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--target bun \
	--outfile server \
	./src/index.ts

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/server server

ENV NODE_ENV=production

CMD ["./server"]

EXPOSE 3000
```

----------------------------------------

TITLE: Installing ElysiaJS HTML Plugin
DESCRIPTION: Command to install the HTML plugin using Bun package manager
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/html.md#2025-04-23_snippet_0

LANGUAGE: bash
CODE:
```
bun add @elysiajs/html
```

----------------------------------------

TITLE: Defining Multiple Files Type in Elysia
DESCRIPTION: Uses Elysia's `t.Files` to validate an array of files in a single field, building upon the `t.File` type.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/type.md#_snippet_17

LANGUAGE: typescript
CODE:
```
t.Files()
```

----------------------------------------

TITLE: Creating a Basic Post Endpoint with Elysia and Supabase - TypeScript
DESCRIPTION: Implements a '/post/create' endpoint for inserting new blog posts into a Postgres 'post' table, using Supabase for database access. The endpoint expects a 'detail' string in the request body and inserts it into the table, returning the created row's ID. Dependencies include Elysia, type definitions ('t'), and the Supabase client. Inputs are properly shaped bodies matching the schema; outputs are the new post's database identifier or an error. Limitation: user_id association is noted as a TODO and not yet implemented.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-supabase.md#2025-04-23_snippet_11

LANGUAGE: TypeScript
CODE:
```
// src/modules/post/index.ts
import { Elysia, t } from 'elysia'

import { supabase } from '../../libs'

export const post = (app: Elysia) =>
    app.group('/post', (app) =>
        app.put(
            '/create',
            async ({ body }) => {
                const { data, error } = await supabase
                    .from('post')
                    .insert({
                        // Add user_id somehow
                        // user_id: userId,
                        ...body
                    })
                    .select('id')

                if (error) throw error

                return data[0]
            },
            {
                schema: {
                    body: t.Object({
                        detail: t.String()
                    })
                }
            }
        )
    )
```

----------------------------------------

TITLE: Default Local Scope (ElysiaJS) - TypeScript
DESCRIPTION: Illustrates that hooks or derives defined within a plugin instance (`.derive`) are local to that plugin by default. Properties like `hi` derived in the plugin are not automatically available on the parent Elysia instance that uses the plugin.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/plugin.md#_snippet_10

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const plugin = new Elysia()
    .derive(() => {
        return { hi: 'ok' }
    })
    .get('/child', ({ hi }) => hi)

const main = new Elysia()
    .use(plugin)
    // ⚠️ Hi is missing
    .get('/parent', ({ hi }) => hi)
```

----------------------------------------

TITLE: Implementing Eden Client with Type Safety
DESCRIPTION: Demonstrates how to set up an Eden client with full type inference from the server, enabling type-safe API calls.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/integrate-trpc-with-elysia.md#2025-04-23_snippet_8

LANGUAGE: typescript
CODE:
```
import { edenTreaty } from '@elysiajs/eden'
import type { App } from '../server'

// This now has all type inference from the server
const app = edenTreaty<App>('http://localhost:3000')

// data will have a value of 'Hello Elysia' and has a type of 'string'
const data = await app.index.get()
```

----------------------------------------

TITLE: Sending Emails with Resend in ElysiaJS
DESCRIPTION: Implementation for sending the OTP email using Resend as the email provider. It passes the React component directly to Resend's API.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/react-email.md#2025-04-23_snippet_6

LANGUAGE: tsx
CODE:
```
import { Elysia, t } from 'elysia'

import OTPEmail from './emails/otp'

import Resend from 'resend'

const resend = new Resend('re_123456789')

new Elysia()
	.get('/otp', ({ body }) => {
		// Random between 100,000 and 999,999
  		const otp = ~~(Math.random() * (900_000 - 1)) + 100_000

        await resend.emails.send({
        	from: 'ibuki@gehenna.sh',
           	to: body,
           	subject: 'Verify your email address',
            html: <OTPEmail otp={otp} />,
        })

        return { success: true }
	}, {
		body: t.String({ format: 'email' })
	})
	.listen(3000)
```

----------------------------------------

TITLE: Installing Eden Dependencies
DESCRIPTION: Command to install Eden and Elysia dependencies for client-side type-safe API consumption.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/integrate-trpc-with-elysia.md#2025-04-23_snippet_7

LANGUAGE: bash
CODE:
```
bun add @elysia/eden && bun add -d elysia
```

----------------------------------------

TITLE: Accessing TypeBox Validator in onError Hook (TypeScript)
DESCRIPTION: Shows how to access the underlying TypeBox `validator` property from the `ValidationError` object within the Elysia `onError` hook. It uses the validator to get the first validation error message.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/validation.md#_snippet_34

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'

new Elysia()
    .onError(({ code, error }) => {
        if (code === 'VALIDATION')
            return error.validator.Errors(error.value).First().message
    })
    .listen(3000)
```

----------------------------------------

TITLE: Handling All HTTP Methods for a Path with Elysia.all
DESCRIPTION: Demonstrates using Elysia.all to define a single route handler that responds to any HTTP method (GET, POST, DELETE, etc.) for a specified path (/).
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/route.md#_snippet_8

LANGUAGE: TypeScript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .all('/', 'hi')
    .listen(3000)
```

----------------------------------------

TITLE: Applying Preloaded Instrumentation to Elysia Instance - TypeScript
DESCRIPTION: Demonstrates how to import and apply the OpenTelemetry plugin instance defined in a separate instrumentation file (`./src/instrumentation.ts`) to the main Elysia application. This relies on the instrumentation file being preloaded by the runtime.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/opentelemetry.md#_snippet_3

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia';
import { instrumentation } from './instrumentation.ts';

new Elysia().use(instrumentation).listen(3000);
```

----------------------------------------

TITLE: Prefixing All Properties from an ElysiaJS Plugin (TypeScript)
DESCRIPTION: Shows how to use `prefix('all', 'prefixName')` to apply a prefix to all properties (state, decorators, derived values) provided by an ElysiaJS plugin. This allows bulk remapping to avoid naming conflicts when integrating plugins.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/handler.md#2025-04-23_snippet_20

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const setup = new Elysia({ name: 'setup' })
    .decorate({
        argon: 'a',
        boron: 'b',
        carbon: 'c'
    })

const app = new Elysia()
    .use(setup.prefix('all', 'setup')) // [!code ++]
    .get('/', ({ setupCarbon, ...rest }) => setupCarbon)
```

----------------------------------------

TITLE: Running the Compiled Elysia Server Binary
DESCRIPTION: Executes the compiled server binary generated by the `bun build --compile` command. This starts the production server, typically listening on port 3000, similar to the development server.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_65

LANGUAGE: bash
CODE:
```
./server
```

----------------------------------------

TITLE: Cookie Removal Methods
DESCRIPTION: Demonstrates two methods for removing cookies in ElysiaJS.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/cookie.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .get('/', ({ cookie, cookie: { name } }) => {
        name.remove()

        delete cookie.name
    })
```

----------------------------------------

TITLE: Elysia Simple Note Service (TypeScript)
DESCRIPTION: Creates a basic Elysia plugin that decorates the app with an instance of a `Note` class. It exposes the `data` property of the `Note` instance via a GET request to the `/note` path.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_35

LANGUAGE: TypeScript
CODE:
```
// @filename: note.ts
import { Elysia, t } from 'elysia'

class Note {
    constructor(public data: string[] = ['Moonhalo']) {}
}

export const note = new Elysia()
    .decorate('note', new Note())
    .get('/note', ({ note }) => note.data)
    .get(
```

----------------------------------------

TITLE: Serving a Single Static File using ElysiaJS file function
DESCRIPTION: This TypeScript snippet shows an alternative method to serve a specific static file without using the full static plugin. It uses the built-in `file` function from ElysiaJS within a GET route handler to directly serve the 'public/takodachi.png' file when the '/file' endpoint is requested. This is useful for serving individual files without configuring the entire static directory.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/static.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
import { Elysia, file } from 'elysia'

new Elysia()
    .get('/file', file('public/takodachi.png'))
```

----------------------------------------

TITLE: Initializing OpenTelemetry with ElysiaJS
DESCRIPTION: Demonstrates the basic setup for integrating OpenTelemetry into an Elysia application by installing and applying the `@elysiajs/opentelemetry` plugin with a standard BatchSpanProcessor and OTLPTraceExporter.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-11.md#_snippet_0

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'
import { opentelemetry } from '@elysiajs/opentelemetry'

import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'

new Elysia()
	.use(
		opentelemetry({
			spanProcessors: [
				new BatchSpanProcessor(
					new OTLPTraceExporter()
				)
			]
		})
	)
```

----------------------------------------

TITLE: Basic JSX Implementation
DESCRIPTION: Example of using JSX as a template engine in ElysiaJS
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/html.md#2025-04-23_snippet_3

LANGUAGE: tsx
CODE:
```
import { Elysia } from 'elysia'
import { html, Html } from '@elysiajs/html'

new Elysia()
	.use(html())
	.get('/', () => (
		<html lang="en">
			<head>
				<title>Hello World</title>
			</head>
			<body>
				<h1>Hello World</h1>
			</body>
		</html>
	))
	.listen(3000)
```

----------------------------------------

TITLE: Define GET /profile Route (ElysiaJS)
DESCRIPTION: Defines a simple GET route at '/profile' that returns a success status and the username extracted from the context.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/tutorial.md#_snippet_40

LANGUAGE: TypeScript
CODE:
```
.get('/profile', ({ username }) => ({
    success: true,
    username
}))
```

----------------------------------------

TITLE: Elysia Plugin Deduplication with Name and Seed
DESCRIPTION: Illustrates how to define an Elysia plugin with a 'name' and 'seed' configuration. Elysia uses these properties to generate a checksum and prevent the plugin from being registered multiple times if called with the same name and seed.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/plugin.md#_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const plugin = <T extends string>(config: { prefix: T }) =>
    new Elysia({
        name: 'my-plugin', // [!code ++]
        seed: config, // [!code ++]
    })
    .get(`${config.prefix}/hi`, () => 'Hi')

const app = new Elysia()
    .use(
        plugin({
            prefix: '/v2'
        })
    )
    .listen(3000)
```

----------------------------------------

TITLE: Enabling Precompilation of Routes in Elysia (TypeScript)
DESCRIPTION: Shows how to enable the precompilation of all routes before the server starts by setting the `precompile` option to `true`. This runs the JIT compiler on all routes upfront.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/configuration.md#_snippet_9

LANGUAGE: TypeScript
CODE:
```
import { Elysia } from 'elysia'

new Elysia({
	precompile: true
})
```

----------------------------------------

TITLE: Custom HTTP Methods Implementation
DESCRIPTION: Demonstrates defining routes with different HTTP methods including custom verbs
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/cheat-sheet.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
    .get('/hi', () => 'Hi')
    .post('/hi', () => 'From Post')
    .put('/hi', () => 'From Put')
    .route('M-SEARCH', '/hi', () => 'Custom Method')
    .listen(3000)
```

----------------------------------------

TITLE: JWT with Expiration Configuration
DESCRIPTION: Example demonstrating how to set JWT expiration time in the configuration
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/plugins/jwt.md#2025-04-23_snippet_4

LANGUAGE: typescript
CODE:
```
const app = new Elysia()
    .use(
        jwt({
            name: 'jwt',
            secret: 'kunikuzushi',
            exp: '7d'
        })
    )
    .get('/sign/:name', async ({ jwt, params }) => jwt.sign(params))
```

----------------------------------------

TITLE: Defining Optional Object Properties with TypeBox and TypeScript
DESCRIPTION: Shows how to make a field in a TypeBox object optional using `t.Optional` and the corresponding TypeScript syntax for optional properties.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/type.md#_snippet_13

LANGUAGE: typescript
CODE:
```
t.Object({
    x: t.Number(),
    y: t.Optional(t.Number())
})
```

LANGUAGE: typescript
CODE:
```
{
    x: number,
    y?: number
}
```

----------------------------------------

TITLE: Configuring OpenTelemetry Exporter for Axiom - TypeScript
DESCRIPTION: Shows how to configure the `OTLPTraceExporter` to send trace data to a specific endpoint like Axiom. It requires setting the `url` and adding custom `headers`, including authorization and dataset information, typically pulled from environment variables.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/opentelemetry.md#_snippet_1

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia';
import { opentelemetry } from '@elysiajs/opentelemetry';

import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';

new Elysia().use(
	opentelemetry({
		spanProcessors: [
			new BatchSpanProcessor(
				new OTLPTraceExporter({
					url: 'https://api.axiom.co/v1/traces', // [!code ++]
					headers: {
						// [!code ++]
						Authorization: `Bearer ${Bun.env.AXIOM_TOKEN}`, // [!code ++]
						'X-Axiom-Dataset': Bun.env.AXIOM_DATASET // [!code ++]
					} // [!code ++]
				})
			)
		]
	})
);
```

----------------------------------------

TITLE: Prefixing Decorator Properties from an ElysiaJS Plugin (TypeScript)
DESCRIPTION: Illustrates using the `prefix` function to remap specific properties ('decorator' type) from a used ElysiaJS plugin ('setup'). This helps prevent naming collisions by adding a prefix ('setup') to the selected properties ('argon', 'boron', 'carbon'), making them accessible as 'setupArgon', 'setupBoron', 'setupCarbon'.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/handler.md#2025-04-23_snippet_19

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const setup = new Elysia({ name: 'setup' })
    .decorate({
        argon: 'a',
        boron: 'b',
        carbon: 'c'
    })

const app = new Elysia()
    .use(
        setup
            .prefix('decorator', 'setup')
    )
    .get('/', ({ setupCarbon, ...rest }) => setupCarbon)
```

----------------------------------------

TITLE: Making Derive Available to Parent (ElysiaJS) - TypeScript
DESCRIPTION: Shows how to use the `{ as: 'scoped' }` option when defining a derive within a plugin. This makes the derived property (`hi`) available on the parent Elysia instance that uses the plugin, allowing for controlled sharing of plugin state or functionality.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/plugin.md#_snippet_11

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const plugin = new Elysia()
    .derive({ as: 'scoped' }, () => {
        return { hi: 'ok' }
    })
    .get('/child', ({ hi }) => hi)

const main = new Elysia()
    .use(plugin)
    // ✅ Hi is now available
    .get('/parent', ({ hi }) => hi)
```

----------------------------------------

TITLE: Example of Native Static Response Optimization in Bun (TypeScript)
DESCRIPTION: Provides an example demonstrating how enabling `nativeStaticResponse` in Elysia running on Bun is equivalent to using Bun's native `Bun.serve.static` for inline values, showing the underlying optimization.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/configuration.md#_snippet_7

LANGUAGE: TypeScript
CODE:
```
import { Elysia } from 'elysia'

// This
new Elysia({
	nativeStaticResponse: true
}).get('/version', 1)

// is an equivalent to
Bun.serve({
	static: {
		'/version': new Response(1)
	}
})
```

----------------------------------------

TITLE: Accessing Server Instance in ElysiaJS Handlers
DESCRIPTION: Shows how to access the server instance within an ElysiaJS handler to retrieve server-related information like the port number.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/handler.md#2025-04-23_snippet_8

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
	.get('/port', ({ server }) => {
		return server?.port
	})
	.listen(3000)
```

----------------------------------------

TITLE: Installing Bun Runtime
DESCRIPTION: Commands for installing Bun runtime on different operating systems.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/quick-start.md#2025-04-23_snippet_0

LANGUAGE: bash
CODE:
```
curl -fsSL https://bun.sh/install | bash
```

LANGUAGE: bash
CODE:
```
powershell -c "irm bun.sh/install.ps1 | iex"
```

----------------------------------------

TITLE: Using Fetch Parameters with Eden Treaty in TypeScript
DESCRIPTION: This example demonstrates how to use Fetch API parameters, such as AbortController, with Eden Treaty requests.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/eden/treaty/parameters.md#2025-04-23_snippet_3

LANGUAGE: typescript
CODE:
```
import { Elysia, t } from 'elysia'
import { treaty } from '@elysiajs/eden'

const app = new Elysia()
    .get('/hello', () => 'hi')
    .listen(3000)

const api = treaty<typeof app>('localhost:3000')

const controller = new AbortController()

const cancelRequest = setTimeout(() => {
    controller.abort()
}, 5000)

await api.hello.get({
    fetch: {
        signal: controller.signal
    }
})

clearTimeout(cancelRequest)
```

----------------------------------------

TITLE: Using Multiple Parsers in Elysia
DESCRIPTION: Demonstrates how to use multiple parsers, including custom and built-in ones, in a specific order in Elysia 1.2.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-12.md#2025-04-23_snippet_4

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia()
	.parser('custom', ({ contentType }) => {
		if(contentType === "application/kivotos")
			return 'nagisa'
	})
	.post('/', ({ body }) => body, {
		parse: ['custom', 'json']
	})
```

----------------------------------------

TITLE: Custom Content Type Parser
DESCRIPTION: Shows how to implement a custom content type parser using onParse lifecycle event.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/life-cycle.md#2025-04-23_snippet_4

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia().onParse(({ request, contentType }) => {
    if (contentType === 'application/custom-type') return request.text()
})
```

----------------------------------------

TITLE: Simplified Numeric Type in Elysia 0.5 - TypeScript
DESCRIPTION: Demonstrates the new Numeric type in Elysia 0.5 that automatically parses numeric strings into numbers. This approach eliminates the need for manual transformation, making the code more concise and declarative.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-05.md#2025-04-23_snippet_5

LANGUAGE: typescript
CODE:
```
app.get('/id/:id', ({ params: { id } }) => id, {
    params: t.Object({
        id: t.Numeric()
    })
})
```

----------------------------------------

TITLE: Defining FormData Type in Elysia
DESCRIPTION: Uses Elysia's `t.FormData` as syntax sugar for `t.Object` specifically for validating the return value of FormData, often used for file uploads.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/type.md#_snippet_21

LANGUAGE: typescript
CODE:
```
t.FormData({
	someValue: t.File()
})
```

----------------------------------------

TITLE: Elysia Plugin Deduplication with Only Name
DESCRIPTION: Shows that when a plugin is defined with only a 'name' but no 'seed', Elysia will register it only once, even if the `.use()` method is called multiple times with the same plugin instance. This improves performance by avoiding redundant processing.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/plugin.md#_snippet_2

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const plugin = new Elysia({ name: 'plugin' })

const app = new Elysia()
    .use(plugin)
    .use(plugin)
    .use(plugin)
    .use(plugin)
    .listen(3000)
```

----------------------------------------

TITLE: Skipping Body Parsing with Static Code Analysis in Elysia - TypeScript
DESCRIPTION: Shows how Static Code Analysis can detect unused properties like body to skip parsing entirely, improving performance. Although a body schema is defined, Elysia determines that only the params.id is actually used in the handler function.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-05.md#2025-04-23_snippet_1

LANGUAGE: typescript
CODE:
```
// Body is not used, skip body parsing
app.post('/id/:id', ({ params: { id } }) => id, {
    schema: {
        body: t.Object({
            username: t.String(),
            password: t.String()
        })
    }
})
```

----------------------------------------

TITLE: Mounting WinterCG-Compliant Frameworks in Elysia
DESCRIPTION: Shows how to use the new mount method to integrate other WinterCG-compliant frameworks (like Hono) within an Elysia application using their fetch handlers.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-06.md#2025-04-23_snippet_6

LANGUAGE: typescript
CODE:
```
const app = new Elysia()
    .get('/', () => 'Hello from Elysia')
    .mount('/hono', hono.fetch)
```

----------------------------------------

TITLE: Applying Scoped Hook to Elysia Plugin in TypeScript
DESCRIPTION: This snippet shows a plugin with an `onBeforeHandle` hook and a route. The plugin instance is explicitly cast to 'scoped' using `as('scoped')`. This demonstrates how to lift the scope of hooks within the plugin, potentially making them available to the parent instance that uses the plugin.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/plugin.md#_snippet_18

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const plugin = new Elysia()
    .onBeforeHandle(() => {
        return 'hi'
    })
    .get('/child', 'child')
    .as('scoped')

const main = new Elysia()
    .use(plugin)
    .get('/parent', 'parent')
```

----------------------------------------

TITLE: Configuring Elysia with Prefix in Astro Subdirectory
DESCRIPTION: Sets up an Elysia server in a subdirectory of Astro pages with a prefix configuration to ensure proper routing. This is necessary when the Elysia server is not placed at the root of the app router.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/integrations/astro.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
// pages/api/[...slugs].ts
import { Elysia, t } from 'elysia'

const app = new Elysia({ prefix: '/api' }) // [!code ++]
    .get('/', () => 'hi')
    .post('/', ({ body }) => body, {
        body: t.Object({
            name: t.String()
        })
    })

const handle = ({ request }: { request: Request }) => app.handle(request) // [!code ++]

export const GET = handle // [!code ++]
export const POST = handle // [!code ++]
```

----------------------------------------

TITLE: WebSocket Configuration in ElysiaJS
DESCRIPTION: Example of configuring WebSocket settings when initializing Elysia instance.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/websocket.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

new Elysia({
    websocket: {
        idleTimeout: 30
    }
})
```

----------------------------------------

TITLE: Incorrect Controller Implementation
DESCRIPTION: Demonstrates the wrong way of implementing controllers by creating separate controller classes.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/essential/structure.md#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```
import { Elysia, t, type Context } from 'elysia'

abstract class Controller {
    static root(context: Context) {
        return Service.doStuff(context.stuff)
    }
}

// ❌ Don't
new Elysia()
    .get('/', Controller.hi)
```

----------------------------------------

TITLE: Creating a Basic Macro in ElysiaJS v2
DESCRIPTION: Demonstrates the new object syntax in Macro v2, which returns lifecycle methods like inline hooks. This example creates a hi macro that adds a beforeHandle function.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/patterns/macro.md#2025-04-23_snippet_4

LANGUAGE: typescript
CODE:
```
import { Elysia } from 'elysia'

const plugin = new Elysia({ name: 'plugin' })
    .macro({
        hi(word: string) {
            return {
	            beforeHandle() {
	                console.log(word)
	            }
            }
        }
    })

const app = new Elysia()
    .use(plugin)
    .get('/', () => 'hi', {
        hi: 'Elysia'
    })
```

----------------------------------------

TITLE: Accessing Headers in Elysia - New Syntax
DESCRIPTION: Example showing the new simplified method of accessing headers directly from the context object
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-05.md#2025-04-23_snippet_8

LANGUAGE: typescript
CODE:
```
app.post('/headers', ({ headers }) => headers['content-type'])
```

----------------------------------------

TITLE: Returning Form Data Explicitly with Elysia Middleware - TypeScript
DESCRIPTION: Demonstrates how Elysia 1.2 requires you to explicitly use and return the `form` utility when your response should be a FormData, instead of previously detecting file returns automatically. The snippet shows importing the necessary helpers, usage in a POST route, and passing a file as a FormData attachment. Dependencies include the `elysia` package and access to the referenced file path. Expects file input via the route handler and outputs a FormData-compliant response built with `form`. Ensures explicit intent and removes auto-detection of files from 1-level objects.
SOURCE: https://github.com/elysiajs/documentation/blob/main/docs/blog/elysia-12.md#2025-04-23_snippet_8

LANGUAGE: TypeScript
CODE:
```
import { Elysia, form, file } from 'elysia'

new Elysia()
	.post('/', ({ file }) => ({ // [!code --]
	.post('/', ({ file }) => form({ // [!code ++]
		a: file('./public/kyuukurarin.mp4')
	}))
```