---
title: Your 3D rendering API is hurting my head
lead: There's lots of examples out there written by different people and they bring with them a set of assumptions. Unless you have some experience with these issues you are undoubtedly going to make mistakes. 
layout: post
---

In principle, 3D rendering is straight forward. You start with a position in 3D space, you then project this position into 2D space and rasterize. What could go wrong?

To the uniniated, the relationship between the projection matrix and Z buffer, isn't obvious. For example, between OpenGL and D3D the interptetation of the Z coordinate isn't the same. OpenGL (by default) expects Z between [-1, 1] while D3D expects Z between [0, 1]. It is the responsibility of the projection matrix to ensure that things are setup in such a way that we get good Z values. And we wan't good Z values because Z values have additional uses. For example, screen space ambient occlusion.

If you mix code from one place with another and they don't share the same set of assumption you are in for a surprise.

If you search the web for "projection matrix" you will find lots of examples (some really old) explaining how this is done but they don't tell you that there are incompatabilities between 3D rendering APIs and/or library code that you need to look out for.

Starting with OpenGL 4.5 you actually have some control over this, with the `glClipControl` API. You can make OpenGL more like D3D (with respect to Z). However, doing this (i.e. `GL_ZERO_TO_ONE`), will require that you revise how you set up your projection matrix. `GL_UPPER_LEFT` is a welcome additional because most image data isn't stored in the way OpenGL reads by default. It implies that (0,0) is now the upper-left corner of image data.
