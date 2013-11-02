---
title: Just run the numbers!
layout: post
---

I decided to do run some tests. I have two versions of the DJB2 hash function. It's a crafty small piece of code.

C# version:

    public static int Djb2Hash(byte[] bytes)
    {
        int hash = 5381;
        for (int i = 0, length = bytes.Length; i < length; i++)
        {
            hash = (hash * 33) + bytes[i];
        }
        return hash;
    }

    public static int Djb2HashFaster(byte[] bytes)
    {
        int hash = 5381;
        for (int i = 0, length = bytes.Length; i < length; i++)
        {
            int temp = hash;
            hash = ((temp << 5) + temp) + bytes[i];
        }
        return hash;
    }
    
C++ version:

    int Djb2Hash(const char* bytes)
    {
        int hash = 5381;
        for (int val = *bytes; val; val = *++bytes)
        {
            hash = (hash * 33) + val;
        }
        return hash;
    }
    
    int Djb2HashFaster(const char* bytes)
    {
        int hash = 5381;
        for (int val = *bytes; val; val = *++bytes)
        {
    		const int temp = hash;
            hash = ((temp << 5) + temp) + val;
        }
        return hash;
    }
    
I ran the tests for 10 seconds. The code ran as many times as it could manage and I took the number of iterations to compute a throughput measurement.

    C#                          C++
    ----                        ----
    > test
    7c9e6865  5.906 1000ops/µs  7c9e6865 0.015047 1000ops/µs
    7c9e6865  4.342 1000ops/µs  7c9e6865 0.014373 1000ops/µs
    1.360x                      1.046909x
    > The quick brown fox jumps over the lazy dog
    34cc38de 45.780 1000ops/µs  34cc38de 0.014252 1000ops/µs
    34cc38de 36.901 1000ops/µs  34cc38de 0.014036 1000ops/µs
    1.241x                      1.015400x
    
Some intresting observations. Optimized C# code ran faster than unoptimized C++ code but optimized C++ code (i.e. with compiler optimizations enabled) ran between 300x-3000x faster than any C# could muster. This test does favour native code due to the heavy array index overhead in managed code. It's sad though becuase you could easily invent abstractions that allow you to express a computation over a range of values in a type safe manner.

I had a teacher once, he told me that what you do with code doesn't matter, as long as the algorithm isn't good. Well that is not bad advice but this complete disregard of what big a difference the choice of platform can make. A factor of 1000x isn't a negliable gain.

I will say this though, micro benchmarks are freaky, they just don't converge on anything unless stressed hard enough. So when you measure this stuff, run for a longer period of time, and construct a throughput measurement, use that. 

LevelDB does this in it's [benchmark suite](http://leveldb.googlecode.com/svn/trunk/doc/benchmark.html). Andrei Alexandrescu also talked about something similar in his Going Native 2013 talk [Writing Quick Code in C++, Quickly](http://channel9.msdn.com/Events/GoingNative/2013/Writing-Quick-Code-in-Cpp-Quickly), you should watch it.
