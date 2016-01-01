---
title: The C programming language
layout: post
---

Last year (2015) I applied for a job at Google and while I didn't get it, I learned one thing in the process. I had become overly reliant on tools. I actually did OK but I found myself in a situation where the code I've written in Google Docs didn't really solve the problem and I had to troubleshoot the issue. The only problem here is that Google Docs is not a compiler, let alone a debugger.

With this in mind I've set out to do rewire my brain by doing a project outside of my comfort zone. For this project, I've been using a simpler text editor and a simpler programming language.

Why C? Well, I've never really wholeheartedly tried it before. But mainly because I'm tired of all the buzz. C doesn't really allow me to do a lot. Instead, it functions as a constraint that you can push against to test your design. A simple design can be written in C, no problem. It leaves me with more time to focus on problems not so much how to make my code *elegant*.

At every corner I'm now trying to get away with as little effort as possible. And it doesn't mean we don't take great care of how I do things, quite the opposite. I'm trying to be a lot more conscious about what I'm doing rather than letting the auto-pilot (debugger) take over.

Another thing that I've found is that I've taken great care to mostly write short functions that do small things. I also try to keep things modular. And by this I simply mean minimal header dependencies. The implication of this is somewhat that I repeat myself. There are certainly several functions that more or less are the same and could probably be rolled into a singular function but if I did that I would just complicate things for the sake of code reuse. The fact is that the time it takes me to write these small functions is really short. I'm really trying to adhere to a the open for extension, but closed for modification principle here. So, as requirements come up I don't change stuff that is already written and tested.

You can follow my progress [here](https://github.com/leidegre/parc/tree/particle).

**Oh, and happy new year!**
