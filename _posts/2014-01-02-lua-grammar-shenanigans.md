---
title: Lua grammar shenanigans
layout: post
---

I've been working on some Visual Studio tooling for Lua over the week and just ran into my pet peeve of language design. The first time I ran into this problem was back at the university while writing my first parser. I took me a long time to understand why this didn't work...

The Lua 5.2 grammar in question is this

    var  ::= Name | pexp '[' exp ']' | pexp '.' Name
    pexp ::= var | fcall | '(' exp ')'
    
> From the [Lua 5.2 Reference Manaual](http://www.lua.org/manual/5.2/manual.html#9). I've changed prefixexp to pexp and functioncall to fcall for brevity.

What so nasty about this? `pexp` is defined in terms of `var` and `var` in turn is defined in terms of `pexp`, all without consuming input. As a human this may make sense, as a computer this is a infinite loop (or stack overflow) bug waiting to happen. Moreover since both `fcall` and `'(' exp ')'` starts with left parenthesis this is an ambiguity. This is a bad grammar to to implement a parser from.

When you design your grammar, keep this in mind that you want to be able to determine the next state of the parser based on simply looking at the top symbol, commonly refered to as LL(1) grammars.

Now, `var` and `pexp` may be reused throughout the grammar but rewriting them isn't necesarily impossible and I suppose this is what any decent parser generator will figure out to ensure that the parser isn't ambigous or never ending (like here).

> This sort of recursive grammar is really dubious. What we need here is a [non-left-recursive grammar](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm#rdp).

Taking a closer look at the Lua C [source](http://www.lua.org/source/5.2/lparser.c.html#prefixexp) you'll find this grammar (and not the one in the reference manual)

    pexp = pexp2 {pexp3}
    pexp2 = '(' exp ')' | Name
    pexp3 = '.' Name | '[' exp ']' | ':' Name args | Name args
    
Notice how each production here is preceeded by the consuming of an input token. In this form there can be no infinite loops (unless you introduce infinite input). Notice the order of evaluation. I couldn't tell how Lua resolved the perceived ambiguity between a function call and eval until I realized that a function call must be preeceeded by a name, which isn't at all clear from the BNF grammar.

A clear cut case of declarative shenanigans (sometimes imperative is better). Even if the expressive nature of more declarative constructs are powerful and productive tools they are difficult to understand.
