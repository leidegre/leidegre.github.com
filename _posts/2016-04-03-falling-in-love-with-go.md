---
title: Falling in love with Go
lead: I've been asking myself what's next in programming languages and while there are exciting languages poping up all the time Go is taking an approach that is somewhat fundamentally different and very appealing. Here's to things in Go that I find super sexy.
layout: post
---

# Go programs compile to native binaries but are built and distributed by source (no shared objects or static libraries)

^^ citation needed ^^

I think the first clue was the way you are encuraged to setup your workspace. Your workspace is a collection of repositories that you tend to use and it's not necessarily tied to what your doing at the moment. As such, the idea of a workspace is bigger than a single project. This is nice when there's that one library that you find yourself going back to. You don't have to jump through a lot of hoops, you just say import that package and it will reflect a single instance of that library across your stuff. 

Google (and now [Facebook](http://duckrowing.com/2014/05/02/one-big-source-tree/)) have one big source tree. The Go workspace setup really is an embodiment of this idea of one big source tree.

If you always distribute and build from source by default, it's very easy to peek into details of a package and figure out exactly what the package is doing (or maybe not doing). You can change things very easily to test stuff. To some degree, I prefer source over documentation but it depends on who is writing the documentation. Both documentation and code has a tendency to verbose but only documentation can be ambigous. If the source is the documentation it is a good thing that Go is terse.

# Go is simpler

When I first started out programming in C I was struck by how everything I've grown accustomed to in many modern programming langauges were no longer readily available to me. With this came a sense of relief. I no longer had to concern myself with choice. At first I was a bit perplexed but now I feel as if too much choice is a really bad thing and that we need constraints. 

Rob Pike has made this talk which I think makes some excellent points about Go and simplicity https://www.youtube.com/watch?v=rFejpH_tAHM 
I think I had more fun as a programmer when I was younger. I don't remember being this distracted by all the shiny stuff, I believe a got more stuff done back then as well.

This [blog post](https://deplinenoise.wordpress.com/2014/07/30/does-experience-slow-you-down/) by [@deplinenoise](https://twitter.com/deplinenoise) outlines the issue perfectly. My revelation came after watching Chet Faliszek's [talk](https://youtu.be/tdwzvdZFxVM?t=8m1s) at the 2012 Eurogamer Expo.

> Constraints are NOT removing features. What constraints are, is giving you an area to work in, that you can push against.

Write the code to get it working, don't go for cleaver tricks, just get to work and hammer out the details. Don't worry about getting it wrong, eventually you'll get it right.

It's a good thing that Go does NOT have all of the feature of some other promminent modern programming languages, instead Go has a lot more in common with C. You can read more about this in the section [Changes from C](https://golang.org/doc/faq#change_from_c) from the offical Go FAQ.

Ultimatly, I'm confident that these constraints will make Go programms run really fast and probably faster than C++, C#/Java and D programs.

# Less clutter

Go does something which I've thought of myself as well and that's to rely on convention for certain stuff. For example, instead of having accessability/visibility modifiers such as private and public, Go does not allow you to access members of other packages if they start with a lower case letter. If you want a member to be public it has to start with an upper letter.

Someone pointed out that this design choice would made chaning the access modifier for a field more difficult since it would involve changes to a lot of places in the code. While this is true the route Go took also made it possible for tools to do this to exist. The language was designed to allow the creation of tools. One such tool is gofix, which is a tool that can rewrite legacy Go code to new versions and I think the idea here is a novel one. Instead of creating the best language with support for everything we create a simple language the can be supported by tooling. Let's make it easier to write tools instead. I like this approach.

# No class private access modifier makes testing simple

Go only has two access modifiers. Package private and public. These are implicit.

- An identifier begining with a lower case letter is only accessible from within the package
- An identifier begining with a upper case letter is accessible from any package

A test file is simply a Go file that ends with `_test.go` these files are distributed along the rest of the package source files and will have access to package private identifiers. This makes testing easier because you can always access stuff in your package from your tests.

# It's perfectly OK to return the address of a local variable

WAT!? 

The real story here is the way Go [evolved](https://scvalex.net/posts/29/). At the very begining, all local varibles were actually allocated on the heap. In [late 2011](https://groups.google.com/forum/#!msg/golang-nuts/TN8mhQJBlZ8/5GCScT8jUigJ), the Go compiler implemented escape analysis, which improved performance by placing variables on the stack _instead of the heap_ when it was safe to do so.

The point is, Go is type safe. You can't have dangling pointer errors in Go (as long as you stay away from the `unsafe` package).

# Go isn't C and while introp with C is easy C programs are not portable

However, there's an extensible assembler and adding support for new architecures is (what I've heard) comparativly staright forward.

# The Go garbage collector is a very low latency GC

It wasn't always the case but as of version 1.5, [this changed](https://youtu.be/aiv1JOfMjm0?t=18m14s). Additional improvments and extrapolated results can be found [here](http://stackoverflow.com/a/31686469). I think [this](https://twitter.com/brianhatfield/status/692778741567721473) is really impressive and could open up Go to game development were longer pauses are unacceptable.

