/**
 * Just enough of `next/navigation` to run portal code outside a request.
 *
 * `notFound()` normally throws a Next.js control-flow error that the framework
 * catches and turns into a 404 page. Outside a request there is nothing to
 * catch it, so this throws a plainly-named error instead — and the test treats
 * that throw as the pass condition, because refusing IS the behaviour under
 * test. Importing the real module drags in React's client runtime and fails.
 */
export function notFound(): never {
  throw new Error("NEXT_NOT_FOUND");
}

export function redirect(url: string): never {
  throw new Error(`NEXT_REDIRECT:${url}`);
}
