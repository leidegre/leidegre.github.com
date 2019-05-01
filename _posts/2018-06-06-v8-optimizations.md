---
title: V8 Optimizations ⚗️
lead: Optimizations done by the V8 compiler to keep in mind
layout: post
---

You can't optimize what you don't understand and V8 is a very complex piece of machinery. Understanding V8 is not easy.

I work a lot with React.js, and something I've been considering for a while now is all the closures that get created. These should put memory pressure on your code. And starting with the React.js hooks API we have more closures than ever. Yet, from the [official documentation](https://reactjs.org/docs/hooks-faq.html#are-hooks-slow-because-of-creating-functions-in-render) we can read this shouldn't be an issue. No in-depth technical answer is given though. I'm making an attempt to answer how you can investigate this.

The V8 `d8` debug shell is accessible through the Node.js binary. You can dump the `d8` command line options using the `--v8-options` option. For me, this happens to be the simplest way to actually get a V8 `d8` shell binary. (Couldn't find binaries for the `d8` tool.)

Here's how you can use it.

Use `--allow_natives_syntax` to enable builtins like `%OptimizeFunctionOnNextCall`.

```
node --allow_natives_syntax
```

Use `--print_opt_code` to dump optimized code.

```
node --allow_natives_syntax --print_opt_code d8.js
```

Then use the V8 native `%OptimizeFunctionOnNextCall` to ensure that the function is optimized. If you don't do this, you won't get optimized code. V8 doesn't optimize all code by default. If the code is not optimized you don't get any output.

\[d8.js\]:

```js
function hello() {
// ...
}

hello();

%OptimizeFunctionOnNextCall(hello)

hello();
```

This will yield a dump of the optimized assembly. We can use this to test hypotheses that we have about the code we write.

In my research, I conclude the following.

- Escape analysis is used by V8 to avoid memory allocation
- Function inlining can be used by V8 to minimize closure creation

These two optimization should go well together.

Given React.js code like this

\[example.tsx\]:

```tsx
function render() {
  return (
    <ContentContainer
      id="7st9vn8gi1cu66o4mlqood1d5s80o53o"
      render={({ controller }) => (
        // using deconstruction (implies construction)
        <ContentBlockProp
          blockId="5fhq274k"
          path="0"
          controller={controller}
          render={value => (
            // using controller from a parent scope
            <input
              data-block="5fhq274k"
              data-path="0"
              value={valueAsString(value)}
              onChange={controller.handleChange}
            />
          )}
        />
      )}
    />
  );
}
```

Since we're only capturing variables that don't survive the invocation of the `render` function when/if all these function calls get inlined we in theory can eliminate the creation of closures and memory allocations.

This is done thanks to function inlining and escape analysis. These are optimizations that V8 can use. I suspect this adds to the appeal for this kind of code and that the possible performance degradation from the added memory pressure is small. As long as you stick to simple forwarding of temporary variables from parent scopes.

I'm not proficient enough with assembly to be able to understand exactly what is going on. But if you are, this is how you can verify that your code is being optimized in a way that is acceptable to you.
