A couple of things before I get started.

[parc](https://github.com/leidegre/parc) is my parser compiler framework. It's a virtual execution environment for parc grammar files. parc takes a grammar file and transforms text input into a syntax tree. You can read more about it [here](https://github.com/leidegre/parc/blob/master/docs/DESIGN.md).

I've done this sort of thing in the past by hand and I find myself going back to this problem every now and then. This time, I'm atempting a more formal approach using deterministic finite automaton (DFA) construction for the lexical analysis and deterministic pushdown automaton (DPA) for recursive descent parsing.

> **Note:** for unfamiliar reader, lexical analysis is the step in which a sequence of characters gets grouped together as tokens. The actual parsing is then done based on a stream of tokens. Any sequence of characters that does not conform to a token is illegal.

Much to my furstation I find that there's a gap between the formal mathematical definition and the thing that I can implement in code. I not sure why that is but to me, a lot of math is this ambighous mess (crazy, right?). I don't know why that is but part of it has to do with the fact that I never enjoyed math on it's own. Many mathematical constructions are just nonsensical to me but the code isn't. I'm much more comfortable reverse engineering an idea from code than math. Anyway, the formal definitions for these state machines are pretty much the same (small variations of the same concept).

The formal definition of a state machine is essentialy 5 things:

- A finite set of states
- A finite alphabet
- A transition function
- An initial state
- A set of accept states

Math vs computation. All things math run in O(1), constant-time and disregards that fact that practical computation is based on a finite amount of bandwidth and/or memory. The theory of computation is in itself a mathematical model but the bigger the divide between the formal definiton and the practical computation the harder it is to utilize.

Let's start with an example regarding the definition of the alphabet. An alphabet is a convinent way of saying, we have a finite set of acceptable characters. We know which these are and label each individually. OK, great. Let's define a finite universe as the Unicode code space (is this resonable? most programming languages use ASCII only). As long as the number of characters we use are finite we're good but as soon as we say, accept anything but this character we invite the entire Unicode code space into our transition table (that is, if we assume that we have a transition table that we can use with direct addressing). We're talking megabytes of overhead per state in that table. The math disregards this problem entierly (I'm assuming that that's exactly the point from a mathematician's standpoint but I'd love to see more examples of math and practial computation work together).

Here's the first example using parc grammar (you can look up that [parc grammar grammar file](https://github.com/leidegre/parc/blob/master/parc.grammar) for reference)):

    token1 = "A" - "Z" ;
    
Which is a single character token using the label `token1` that accepts any upper case ASCII letter. Now, this is easy becase we know here that our language only accepts these characters but what about your typical delimited string?

    string = "\"" ( ^ "\"" ) * "\"" ;

This second example poses a very real practical problem. It specifies the allowed character set (or alphabet) as the inverse of the delimiter effectivly making the whole Unicode code space part of our alphabet. That's a lot of symbols.

If we chose to represent our DFAs as transition tables we need to have the input alphabet in one dimension and each state in the other. In this case that's 1 MiB (of basically worthless state information) for each state (we'd ought to have very sparse transition tables).

Math is easy becuase it allows you to simplify at any point. Running speed and memory constraints is of little concern when you just dictate the rules.

Now, we can chose an arbitrary lambda function as the transition function and simply "abstract" the problem (which is what math does) but if we do so we end up with a linear search for the transition function and we lose the ability to anaylize the finite state nature of our lexical analysis.

I guess we need to talk a bit about the actual computation. The computation models we use simply work better on a nice continous (linear) memory space and this is why transition tables are appealing (fast lookup). However, they fail to represnt negation expressions efficently.

We can implement the lexer ourselves and write the code. It's just a lot of boiler plate code. If we do we can work backwards from the goal to construct the basic idea of the representation that we may want to do what we need here.

    if (ch == '\"') {
      while ((ch = next()) != '\"') {
        ;
      }
      ch = next();
    }

The above code is a direct translation of the regular expression `string`. In total, we have three branches so it's reasonable to think that we have to come up with a minimal DFA with at least three states in it.

    if (('A' <= ch) & (ch <= 'Z')) {
    // ...
    }

Then there's this, the equivalent `token1` code. How do we combine them?

Intuitively, we can establish that there's no overlap between the A-Z range and the qoute character but we need a representation that allows us to easily compute set operations over character classes (in borrowing from regular expression vocabulary a character class is simply a range of characters).

This is where we either construct artifical edge cases or think of a better example to test our assumptions with. I belive the latter is of greater value.

Let's take the ECMAScript 5 NumericLiteral as an example (here in parc grammar).

    numericLiteral 
      = decimalLiteral
      | hexIntegerLiteral
      ;
    decimalLiteral
      = decimalIntegerLiteral "." decimalDigits* exponentPart?
      | "." decimalDigits* exponentPart?
      | decimalIntegerLiteral exponentPart?
      ;
    decimalIntegerLiteral
      = "0"
      | nonZeroDigit decimalDigits*
      ;
    decimalDigits
      = "0" - "9"
      ;
      
The actual definition of the Numeric Literals (section 7.8.3) is a bit verbose (I've left out some parts). Intrestingly, decimal numbers cannot have leading zeroes but integers can (tested in Chrome).

The `hexIntegerLiteral` definition is also a nonsensical recursive mess (it's either that or supposed to signify repetition).

    hexIntegerLiteral 
      = "0x" hexDigit
      | "0X" hexDigit
      | hexIntegerLiteral hexDigit
      ;

Yeah, OK. Whatever. That's just downright confusing.

> **Note (added 2015-05-15):** I just learned that this is called [left recursion](http://en.wikipedia.org/wiki/Left_recursion). Left recursive grammars are more difficult to manage (for example, they cannot be parsed by *just* a recursive descent parser) but in my experience there is no need for left recursion. You simply rewrite your grammar in a right-recursive form which has a straight forward implementation.

You'd never do that in a parc grammar. You'd write.

    hexIntegerLiteral 
      = "0x" hexDigit+
      | "0X" hexDigit+
      ;
    
    --or...
    
    hexIntegerLiteral 
      = "0" ("x" | "X") hexDigit+
      ;
      
It's the same thing.

Let's list some examples that need match the above numeric literal grammar.

    0
    0.
    0x0
    0.0
    .0

What we want to be able to do is to look at the first character of any rule and check that it represents an unambigous choice.

    0 . -> decimalDigits
      x -> hexDigit
    .   -> decimalDigits

So far so good, we can start with either a zero or period and then proceed with digits, period or x. Which is a small decision tree.

The thing is that this decision tree only happens if we combine the token rules. Initially we have many distinct token rules (even implicit ones that you don't define).

Let's simplify some.

    integer 
      = ("0" - "9")+ 
      ;
    decimal 
      = ("0" - "9")+ "." ("0" - "9")+ 
      ;
    hex 
      = "0x" ("0" - "9" | "A" - "F")+
      ;

What we have here are three distinct state machines that (when combined) represents the tokenization rules for our regular language (of numbers).

    number 
      = ("0" - "9")+ => integer
      | ("0" - "9")+ "." ("0" - "9")+ => decimal
      | "0x" ("0" - "9" | "A" - "F")+ => hex
      ;

Product machine construction is crazy. We get N-dimensional tuples as lookup keys and exponential growth of the number of states (just saying that the state transition table representation is bad for combining state machines).

The regular graph builder algorithm.

Initially the graph is empty.

First we add the `integer` token. It has one transition and one accept state.

    a : ['0', '9'] => integer
    a > a

Then we add the `hex` token. This requires us to split the closed interval, 0-9 and add two transitions.

    b :: '0' => integer
    b -> a
    b -> c
    a :: ['0', '9'] => integer
    a -> a
    c :: 'x'
    c -> ['0', '9'], ['A', 'F'] => hex
    c -> c

This all maps very well to code but it does not describe how to dynamically execute this. We need to render a state transition table to be able to run this.

I guess we need an artifical example to actually get by this.

    string 
      = "\"" a : (^ "\"")* "\"" => string
      ;

The above expression cannot be translated into a transition table because it would blow up size wise. However, on closer inspection the expression only has two outcomes. Either the character is acceptable or it isn't. In this case that rule is inequality. In truth, it only defines two alphabet characters, acceptable and non-accpetable (our graph or tree representations can represent this exactly).

Given s0 and `"\""` we enter s1, from here we apply a predicate to determine if next character is acceptable or not. If it is, we consume that character otherwise it's an error. If the character is `"\""` we transition to s2 which is our accept state.

Somewhere around here I ran into issues with the DFA construction. Eventually I switched to NFA construction which was more straight forward but the only thing that happen computationally was that I created two new problems that needed sovling. The formal nature of this problem is a nice property but I can't roll with it effectivly. 

I've already decided that parc is going to be deterministic. Thus any tokenization rule that is non-deterministic is illegal. And from experience writing lexers I know that its mostly all about non-overlapping intervals. parc tokenization rules map very well to a non-continous set of closed intervals. Sometimes the interval is the complement of some closed interval (negation) but otherwise this representation is computationally sound.

Instead of doing NFA/DFA and minifaction we can construct a minimal decsion tree (and turn the lexical analysis into a seach problem). This operation is pretty much a linear ordeal and can the be used as a basis for further optimization.

Running the lexiographic analysis from this representation is slow but straight forward. Computationally the constraints are very easy to reason about.

# References
- http://www.cs.cmu.edu/~flac/pdf/FSMAlgorithms-6up.pdf


