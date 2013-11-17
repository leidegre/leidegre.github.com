---
title: printf and type inference
layout: post
---

A fair amount of bugs and security related issues can be tracked two misaligned printf format strings. An #AltDevBlog [post](http://www.altdevblogaday.com/2013/04/13/a-fast-type-safe-minimal-string-formatting-library-miniformat/) by Jaewon Jung caught my eye, he took a type safe library approach to the problem. I think it's a sound approach to the problem though I was initially looking for something simpler. After all, it's is a 995 lines long [header file](https://github.com/c42f/tinyformat/blob/master/tinyformat.h). I'm also forced to target a considerably older c++ toolchain.

What did I do then?

While we can solve for the general case, there's really only a handful types that we are interested in. These are:

    int
    long
    long long
    double
    const char*
    const wchar_t*
    const void*

> I've done away with smaller integral types, (i.e. short) and decided that if you really wanted to only print a single char you would do so by using a string containing only a single char.

So with this limited set of types we create a union type `Value`. Like this:

    union Value 
	{
		int                m_Int;
		unsigned int       m_Uint;
		long               m_Long;
		unsigned long      m_Ulong;
		long long          m_LongLong;
		unsigned long long m_UlongLong;
		double             m_Double;
		const char*        m_Str;
		const wchar_t*     m_Wstr;
		const void*        m_Ptr;
	};
	
We then introduce the wrapper class `Arg`.

    class Arg 
    {
    public:
        inline Arg(int value)
            : m_Type(kType_Int) 
        {
    		m_Value.m_Int = value;
    	}
    	...
    	Value m_Value;
    	char m_Type;
	};

A bunch of varargs equivalents.

    void Format(const char* format, const Arg& arg0)
    {
        char ts[1] = { arg0.m_Type };
        Value vs[1] = { arg0.m_Value };
        Format(format, vs, ts);
    }
    void Format(const char*, const Arg&);
    void Format(const char*, const Arg&, const Arg&);
    void Format(const char*, const Arg&, const Arg&&, const Arg&);
    ...
    
> This is obviously the most verbose step but we typically almost never need more than a few varargs per format call. I've settled for 5 in my implementation.
    
And the final format function that does the work:

    template <int Length>
    void Format(const char* format, const char(&ts)[Length], const Value(&vs)[Length]);
        
The way we now implement `Format` is just a tad bit different. Traditional `printf` format strings use the percent `%` character followed by a type specifier to tell us where to format the result but with this change the type specifier is redundant.

We still have to scan the string for percent `%` characters but we simply forward what's between the percent `%` character and the type specifier and substitute the type specifier for our own.

A `Format` call like this...

    Format("%s", 42)
    
Would internally be resolved as...

    Format("%i", 42)
    
Which is safe.
    
Internally we just call `snprintf` for each placeholder with the correct type specifier and value to render the string. We simply infer the type specifier based on the value. While this is not considered type safe what cannot happen (assuming correct implementation) is that you have a format string that results in undefined behavior (bugs/exploits).

> Remember, the general idea is to impose reasonable limits and write less bugs not to solve the general case. You can always argue that you should test for these bugs (or optionally use good tools for this) but honestly how many of you really test the fail condition of every external API call?

>     if (!CreateFile(...))
>     {
>         Log("%s", GetLastError()); // Oops!
>         return FALSE;
>     }

> Not saying that this isn't something that you shouldn't be testing but in my experience this is where the format bug will take down your program or worse be exploited and wreak havoc.

As to the performance implications of this I consider them *negligible* (there's going to be copy overhead) but I'd like to compare the assembly of this approach with other type safe variants and run some tests to get a better picture. The good bits are that we relying on the standard library for most of the heavy lifting. This results in a smaller code base and we do offer the exact same functionality.

    Format("%.3s", 1 / 2.0)
             ^
So, in this particular instance we'd keep the `.3` between the `%` and `%s` but change `%s` to `%f`.

These are a bit more subtle:

    Format("%d", 1L)    // d -> il
    Format("%d", 1LL)   // d -> ill
    Format("%d", 1U)    // d -> u
    Format("%d", 1UL)   // d -> ul
    Format("%d", 1ULL)  // d -> ull

In summary, we don't have to re-implement the formatting stuff just fix up the mishaps (when the type specifier is not compatible with the value).
