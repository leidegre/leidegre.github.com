---
title: Falling in love with Go
lead: I've been asking myself what's next in programming languages and while there are exciting languages poping up all the time Go is taking an approach that is somewhat fundamentally different and very appealing. Here's to things in Go that I find super sexy.
layout: post
---

# Go programs are built from source there are no precompiled libraries

I think the first clue was the way you setup your workspace. Your workspace is a collection of repositories that you tend to use it's not necessarily tied to what your doing at the moment. As such, the idea of a workspace is bigger than a single project. This is nice when there's that one library that you find yourself going back to. You don't have to jump through a lot of hoops, you just say import that package and it will reflect a single instance of that library across your stuff. 

It also echos the sentiment that Google (and apparently [Facebook](http://duckrowing.com/2014/05/02/one-big-source-tree/) seems to be using) with one big source tree. The Go workspace setup really is the embodiment of one big source tree.

Secondly, if you do distribute by source it's very easy to peek into details about what libraries you are depending on are doing (or maybe not doing). To some degree and prefer source over documentation, it depends on who is writing the documentation but it gets verbose, ambigous and old really fast.

# Go is simpler

Go is simpler because Go has less stuff.

I think I had more fun as a programmer when I was younger. I don't remember being this distracted by all the shiny stuff, I believe a got more stuff done back then as well.

This [blog post](https://deplinenoise.wordpress.com/2014/07/30/does-experience-slow-you-down/) by [@deplinenoise](https://twitter.com/deplinenoise) outlines the issue perfectly. My revelation came after watching Chet Faliszek's [talk](https://youtu.be/tdwzvdZFxVM?t=8m1s) at the 2012 Eurogamer Expo.

> Constraints are NOT removing features. What constraints are, is giving you an area to work in, that you can push against.

Write the code to get it working, don't go for cleaver tricks, just get to work and hammer out the details. Don't worry about getting it wrong, eventually you'll get it right.

It's a good thing that Go does NOT have all of the feature of some other promminent modern programming languages, instead Go has a lot more in common with C. You can read more about this in the section [Changes from C](https://golang.org/doc/faq#change_from_c) from the offical Go FAQ.

Ultimatly, I'm confident that these constraints will make Go programms run really fast and probably faster than C++, C#/Java and D programs.

# Less clutter

Go does something which I've thought of myself as well and that's to rely on convention for certain stuff. For example, instead of having accessability/visibility modifiers such as private and public, Go does not allow you to access members of other packages if they start with a lower case letter. If you want a member to be public it has to start with an upper letter.

# No class private access modifier makes testing simple

Go only has two access modifiers. Package private and public. These are implicit.

- An identifier begining with a lower case letter is only accessible from within the package
- An identifier begining with a upper case letter is accessible from any package

A test file is simply a Go file that ends with `_test.go` these files are distributed along the rest of the package source files and will have access to package private identifiers. This makes testing easier because you can always access stuff in your package from your tests.

# It's perfectly OK to return the address of a local variable

WAT!? 

The real story here is the way Go [evolved](https://scvalex.net/posts/29/). At the very begining, all local varibles were actually allocated on the heap. In [late 2011](https://groups.google.com/forum/#!msg/golang-nuts/TN8mhQJBlZ8/5GCScT8jUigJ), the Go compiler implemented escape analysis, which improved performance by placing variables on the stack _instead of the heap_ when it was safe to do so.

The point is, Go is type safe. You can't have dangling pointer errors in Go (as long as you stay away from the `unsafe` package).

# The Go garbage collector is a very low latency GC

It wasn't always the case but as of version 1.5, [this changed](https://youtu.be/aiv1JOfMjm0?t=18m14s). Additional improvments and extrapolated results can be found [here](http://stackoverflow.com/a/31686469). I think [this](https://twitter.com/brianhatfield/status/692778741567721473) is really impressive and could open up Go to game development were longer pauses are unacceptable.

