---
title: Falling in love with Go
lead: I've been asking myself what's next in programming languages and while there are exciting languages poping up all the time Go is taking an approach that is somewhat fundamentally different and very appealing. Here's to things in Go that I find super sexy.
layout: post
---

# Go programs are built from source there are no precompiled libraries

I think the first clue was the way you setup your workspace. Your workspace is a collection of repositories that you tend to use it's not necessarily tied to what your doing at the moment. As such, the idea of a workspace is bigger than a single project.

Secondly, if you do distribute by source it's very easy to peek into details about what libraries you are depending on are doing (or maybe not doing). 

# Go is simpler

Go is simpler because Go has less stuff.

I think I had more fun as a programmer when I was younger. I don't remember being this distracted by all the shiny stuff, I believe a got more stuff done back then as well.

This [blog post](https://deplinenoise.wordpress.com/2014/07/30/does-experience-slow-you-down/) by [@deplinenoise](https://twitter.com/deplinenoise) outlines the issue perfectly. My revelation came after watching Chet Faliszek's [talk](https://youtu.be/tdwzvdZFxVM?t=8m1s) at the 2012 Eurogamer Expo.

> Constraints are NOT removing features. What constraints are, is giving you an area to work in, that you can push against.

Write the code to get it working, don't go for cleaver tricks, just get to work and hammer out the details. Don't worry about getting it wrong, eventually you'll get it right.

It's a good thing that Go does NOT have all of the feature of some other promminent modern programming languages, instead Go has a lot more in common with C. You can read more about this in the section [Changes from C](https://golang.org/doc/faq#change_from_c) from the offical Go FAQ.

Ultimatly, these constraints will make Go programms run really fast and probably faster than C++, C#/Java and D programs.

# Less clutter

Go does something which I've thought of myself as well and that's to rely on convention for certain stuff. For example, instead of having accessability/visibility modifiers such as private and public, Go does not allow you to access members of other packages if they start with a lower case letter. If you want a member to be public it has to start with an upper letter.

# Zero-cost abstractions

