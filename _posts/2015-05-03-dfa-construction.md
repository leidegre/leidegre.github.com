A couple of things before I get started.

parc is my parser compiler framework. It's a virtual execution environment for parc grammar files. parc takes a grammar file and text input and transforms this into a syntax tree. You can read more about it here.

I'm atempting a more formal approach using deterministic finite automaton (DFA) construction to complete the lexical analysis.

> **Note:** for unfamiliar reader, lexical analysis is the step in which a sequence of characters gets grouped together as tokens. The actual parsing is then done based on a stream of tokens. Any sequence of characters that does not form a token is illegal input.

As always, when I look at the formal definition I find that there's a gap between that and something which I can implement and the first problem I tend to run in to is representation.

The formal definition of a DFA is simple, essentialy, you need 5 things:

- A set of states
- An alphabet
- A transition function
- A initial state
- A set of accept states

But if we try to get practial, it all brakes down rather quickly.

For example, an alphabet is a convinent way of saying, we have a finite set of acceptable characters we know which they are and label them as such. OK, great. Let's define the alphabet universe as the Unicode code space. That ought to do. Only problem is that the math doesn't really care about space constraints we kinda do. As well soon see, even the simplest grammar will result in a state explosion too big for RAM (or otherwise rather inconvinent).

I'm also increddibly annoyed by all the examples that use only two or three states. I guess it's for the above reason. Anyway...

If we stick to what's called regular language and define our lexer (the piece of code the does the lexical analysis) using it we can desribe tokens like this (I'm using the parc grammar here, you can look up that parc grammar grammar file for reference):

    token1 = "A" - "Z" ;
    
Which is a single character token using the label `token1` that accepts any upper case ASCII letter. Now, this is easy becase we know here that our language only accepts these characters (limits the Unicode code space). But what about your typical delimited string?

    string = "\"" ( ^ "\"" ) * "\"" ;

The above string example poses a very real practical problem. It specifies the allowed character set (or alphabet) as the inverse of the delimiter effectivly making the whole Unicode code space part of our alphabet. This is bad.

If we chose to represent our DFAs as transition tables we need to have the input alphabet in one dimension and each state in the other. In this case that's 1 MiB (of basically worthless state information) for each state.

Math is easy becuase it allows you to simplify at any point. Running speed and memory constraints is of little concern when you just dictate the rules.

Now, we can chose a arbitrary lambda function as the transition function and simply "abstract" the problem (which is what math does) but if we do so we end up with a linear search for the transition function and we lose the ability to anaylize the finite state nature of our lexical analysis.

I guess we need to talk a bit about the actual computation. Computations simply work better on a nice continous (linear) memory space and this is why transition tables are appealing (fast lookup). However, they fail to represnt negation expressions efficently.

We can implement the lexer ourselves and write the code. It's just a lot of boiler plate code. If we do we can work backwards from the goal to construct the basic idea of the representation that we may want to do what we need here.

    if (ch == '\"') {
      while ((ch = next()) != '\"') {
        ;
      }
      ch = next();
    }

The above code is a direct translation of the regular expression `string`. In total, we have three branches so it's reasonable to think that we have to come up with a minimal DFA with three states in it.

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
      
The actual definition of the Numeric Literals (section 7.8.3) is a bit verbose (I've left out some parts). Intrestingly, decimal numbers cannot have leading zeroes but integers can (tested in Chrome)!?.

The `hexIntegerLiteral` definition is also a nonsensical recursive mess (it's either that or supposed to signify repetition).

    hexIntegerLiteral 
      = "0x" hexDigit
      | "0X" hexDigit
      | hexIntegerLiteral hexDigit
      ;

Yeah, OK. Whatever. That's just downright confusing.

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

Product machine construction is crazy. We get N-dimensional tuples as lookup keys and exponential growth of the number of states.



The hard part here is identifying an efficent state transition function.

Formalism is great but you have to deal with general case which can be annoying (and this is why we introduce constraints).





