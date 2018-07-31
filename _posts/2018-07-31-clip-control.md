---
title: Your 3D rendering API is hurting my head
lead: There's lots of examples out there written by different people and they bring with them a set of assumptions. Unless you have some experience with these issues you are undoubtedly going to make mistakes. 
layout: post
---

In principle, 3D rendering is straight forward. You start with a position in 3D space, you then project this position into 2D space and rasterize. What could go wrong?

To the uniniated, the relationship between the projection matrix and Z buffer, isn't obvious. For example, between OpenGL and D3D the interptetation of the Z coordinate isn't the same. OpenGL (by default) expects Z between [-1, 1] while D3D expects Z between [0, 1]. It is the responsibility of the projection matrix to ensure that things are setup in such a way that we get good Z values. And we wan't good Z values because Z values have additional uses. For example, screen space ambient occlusion.

If you mix code from one place with another and they don't share the same set of assumption you are in for a surprise.

If you search the web for "projection matrix" you will find lots of examples (some really old) explaining how this is done but they don't tell you that there are incompatabilities between 3D rendering APIs and/or library code that you need to look out for.

Starting with OpenGL 4.5 you actually have some control over this, with the `glClipControl` API. You can make OpenGL more like D3D (with respect to Z). However, doing this (i.e. `GL_ZERO_TO_ONE`), will require that you revise how you set up your projection matrix (but you can now use some [D3D math](https://github.com/Microsoft/DirectXMath) with your OpenGL code). `GL_UPPER_LEFT` is a welcome additional because most image data isn't stored in the way OpenGL otherwise reads it. As direct consequence of this is that the UV coordinate (0,0) is now the upper-left (not lower-left, the default) corner of image/texture data. Eliminating the need for flipping-Y at load time.

Setting up a projection matrix also requires working deciding on which way is up and whther you are left-handed or right-handed. To my knowedlge there isn't an exact reason for why you would do one over the other, people have just gotten used to a mode of thinking and then they use that. I wish people would just standardize around 1 set of conventions but maybe that isn't feasible.

For example, if you take a closer look at the [DOOM BFG source code](https://github.com/id-Software/DOOM-3-BFG) the [matrix library](https://github.com/id-Software/DOOM-3-BFG/blob/master/neo/idlib/math/Matrix.h) uses row-major layout except for the 3 by 3 matrix (which uses column-major layout). If you are like me and learn by studing other people's work you will find that getting the memory layout of a matrix wrong is also a common source of frustration with learning from examples.

Why did idSoftware do that? (I can only speculate but here are some facts) GLSL is column-major, if you send a matrix to GLSL it will view it as column-major. If you matrix is row-major you have to transpose the matrix before you send it to the GPU. The glUniform* API has an option for this. If you application code uses row-major your matrix math will look different in side the GPU from outside the GPU. You eliminate this inconsistency by using the same convention inside the GPU as outside the GPU.
