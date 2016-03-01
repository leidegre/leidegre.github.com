---
title: Overlapping intervals and complement
lead: As I was researching deterministic finite state machines as a method of lexical analysis I noticed that the superset construction worked very poorly with large set of symbols, which is the result of negation within the Unicode code space. These things are in the end, implemented in the form of a search problem with intervals. Modelling this using intervals we end up with a practical set of symbols and not state tables having 1,114,112 code points.
layout: post
---

We're going to use the following `[a,b]` notation to denote a closed interval between `a` and `b`. Where `a` and `b` is included in the interval, equivalent to the following expression `a <= x && x <= b`.

We're also going to need the complement of an interval. We denote this as `]a, b[` and it is the equivalent of `x < a && b < x`. Note how the complement is an open interval and that we don't include `a` and `b` in the interval. Effectivly, there can be no overlap between an interval `[a,b]` and it's complement `]a,b[`

<div class="panel panel-primary">
<div class="panel-body">
> **Note:** while an interval can span a great *distance* there is no such requirement as long as `a <= b` holds, we're good. This implies that we can define an interval of a single step as `[a,a]`.
</div>
</div>

# Why the complement is important

Let's say we have a token rule for a string literal where qoutes are used to mark the begining and end of such a literal. We would simply do this.

~~~
str = "\"" ^ "\"" * "\"" ;
~~~

In English, this translates to `"` followed by any number of characters that are not `"` followed by `"`.

This is a very simple string literal and in parctice string literals support escape sequence and generally do not permit new lines (if not properly escaped). So, we do this.

~~~
str2 
  = "\"" 
  (
    ((^ "\"") - ("\n" | "\r" | "\\"))
    | ("\\" ("n" | "r" | "\\"))
  ) * 
  "\"" 
  ;
~~~

*Note really sure about how to indent that but I think that's better than a one liner.*

In English, this starts out the same way with a `"` followed by any number of characters that are not `"`, `\n`, `\r`, or `\\` but if we cannot match any of these we accept `\\` and any of the permitted escape sequence characters `n`, `r` or `\\`. Ultimately ended by `"`.

The way this is actually handled is that we first define the complement of `"` to be `]","]` when the **subtract** from this `\n`,  `\r` and `\\`. This leaves us with a new set of intervals to consider.

* `]","] - [\n,\n] = [0,\t], [\v,!], [#,U+10FFFF]`

What happened here? In order to create new intervals by subtracting from the complement we had to create intervals that span the entire Unicode codespace. This is where I relize that we don't need complement. Awesome!

> Writing is nature's way of letting you know how sloppy your thinking is. - Guindon

 Thank you [Leslie Lamport](https://youtu.be/-4Yp3j_jk8Q?t=1m59s). Although he attributes the qoute to this *Guindon*. I know it from watching Leslie Lamport's lectures and this process that I'm running with here is in thanks to him.

As I was testing our functions to work with intervals I *sighed* over the fact that I would probably need 4 variants of each operation. Since I had to consider how a closed interval would interact with the open complement. This bothered me. However, the complement here is nothing more than a set of two non-overlapping intervals and when you subtract one interval from another you might need to split an interval in two. This in conjuction with the writing I'm doing here gave me the idea to not work directly with the complement of an interval.
 
Backing up a bit, complement is a useful tool and so is the set minus operation. It's very impractical if you are building state tables but not if we can express our stuff with intervals (the number of intervals are still few).
 
# How complement can be expressed as a set of two intervals

Given that we know that the Unicode codespace is finite, `[0,U+10FFFF]` we can define the complement of as two non-overlapping intervals. `]","[` thus becomes `[0,!], [#,U+10FFFF]` since `!` is the character immediately preceeding `"` while `#` is the character immediately following `"`. Even if the Unicode codespace wasn't finite we could use this approach, we would just replace `0` and `U+10FFFF` with `-Infinity` and `+Infinity` respectivly.

Continuing down this path we would eventually see that we could replace the complement with the set minus operator. `^ "\""` would namly be equivalent to `[0, U+010FFFF] - [","]` which again would result in `[0,!], [#,U+10FFFF]`.

Cool.

I put up a [JSFiddle](https://jsfiddle.net/2w57zoa4/1/)  to test this out, if you wanna take a closer look at my atempt of capturing this appraoch in terms of intervals.

