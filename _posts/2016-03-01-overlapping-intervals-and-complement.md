---
title: Overlapping intervals and complement
lead: As I was researching deterministic finite state machines as a method of lexical analysis I noticed that the superset construction worked very poorly with large set of symbols, which is the result of negation within the Unicode code space. These things are in the end, implemented in the form of a search problem with intervals. Modelling this using intervals we end up with a practical set of symbols and not state tables having 1,114,112 code points.
layout: post
---

We're going to use the following `[a,b]` notation to denote a closed interval between `a` and `b`. Where `a` and `b` is included in the interval, equivalent to the following expression `a <= x && x <= b`.

We're also going to need the complement of an interval. We denote this as `]a, b[` and it is the equivalent of `x < a && b < x`. Note how the complement is an open interval and that we don't include `a` and `b` in the interval. Effectivly, there can be no overlap between an interval `[a,b]` and it's complement `]a,b[`

> **Note:** while an interval can span a great *distance* there is no such requirement as long as `a <= b` holds, we're good. This implies that we can define an interval of a single step as `[a,a]`.

