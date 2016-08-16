---
title: Use Go (#golang) as your next DDL
lead: Go's compiler infrastructure is already exposed as a set of packages and it's really easy to just parse and bunch of files and generate some code. With that in mind, if we wanted to create a DDL we might as well just use Go syntax.
layout: post
---

There are sevral projects that I know of that come with thier own DDL. One of the projects that I have the most experience with is Google's Protocol Buffers format. It has a language of *.proto files. These files are little more than struct definitions plus metadata the syntax is not terribly important. It is the code that gets generated that is intresting.

