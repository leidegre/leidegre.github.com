---
title: Reflection cache -- faster reflection with caching
layout: post
---

I've been working on extending the .NET type system to support customization of data contracts. I ended up doing this thing like this.

    class Metadata : Attribute
    {
      // metadata goes here...
    }

    abstract class Abstract<T>
    {
      public static readonly Metadata M;
      static Abstract()
      {
        M = (Metadata)Attribute.GetCustomAttribute(typeof(Metadata), false);
      }
    }
    
    [Metadata]
    class Concrete : Base<Concrete>
    {
    }

You can then write code like this, to access the metadata:

    Base<Concrete>.M

While at run-time, it does allow you to attach validation logic to the reflection part of getting at the metadata. The validation will occur when someone tries to use the `Concrete` type in code (not before that).

While I used a metadata attribute to illustrate this point it can be used to any type of reflection. Then conveniently used to reflect based upon some type.

You can then create generic helper methods that rely on this information to do things:

    public static void Do<T>()
      where T : Base<T>
    {
      var m = Base<T>.M; // access metadata
    }

This ought to be faster than reflection since the cost of the reflection is taken once, when the type initialize for `Base<T>` is run which will happen once for each distinct type parameter `T`.

You can't do this with interfaces (it would defeat the purpose entirely) because using an interface implies that you have an instance of type to work with. Inheritance isn't even necessary but it does allow inherited (or base members) to be accessed in the context of the derived class. Which has some usefulness.
