These blog posts are getting larger all the time. What I'm essentially doing here is a brain dump of my thought process. I blog about it because anyone doing the same would sure appreciate learning from what someone else did before them. Very rarely do I find that people blog about their work as it progresses. Think of this as my current  journal. It's very much a snapshot of what happens as the thing unfolds in my mind.

I've found it very helpful to approach the problem from both ends. I constantly switch between what it would look like in code and what representation would be most suitable to solve this other problem over here. The design that I want needs to make the problem simpler to deal with otherwise it's a useless design. 

> It can scarcely be denied that the supreme goal of all theory is to make the irreducible basic elements as simple and as few as possible without having to surrender the adequate representation of a single datum of experience.

A quote from Albert Einstein commonly phrased: everything should be as simple as it can be, but not simpler. Though, I believe it is important to emphasize the *not simpler* part. Since this along with Occam's razor is often popularized as *the simplest solution is often the right one* which is just absurd.

What follows here is me spending my evening trying to work out a representation in data along with an algorithm to reject ambiguous grammar but more importantly disambiguate production rules only appear ambigous but are infact not.

    a b
    a (b c)+
    a b? c d*
    a (b | c | d)

The above 4 simple rules are just arbitrary rules that I just made up to work this out in my mind. They probably don't even make any practical sense but they will do for now.

The first observation to make is that there's an implied logical AND operation occurring in between these rules.

    a & b
    a & (b & c)+
    a & b? & c & d*
    a & (b | c | d)

This logical AND operation is what we also refer to as a short-circuit evaluation operator. The implied meaning is that if any expression on the left-side is not true we do not evaluate the right-side.

The second observation to make is that the production rules are Boolean expressions. This observation is only possible if we consider the original simple expression grammar and note that the recursive decent parser implementation only has two types of function calls. `Accept` and production evaluation (where Accept is simply a production rule for a single token).

For is reason, we use a Boolean return value for production rules and do the syntax tree construction elsewhere (private stack). Given what I've learned here, I'd say this is the better way to build a recursive decent parser because the grammar has the most straight-forward representation in code.

The third observation is about control flow and ambiguity.

    a & b
    a & (b & c)+
    a & b? & c & d*
    a & (b | c | d)

Let's say we were to implement this as a recursive decent parser (this is where nothing makes sense any longer). Well, the first is easy.

    bool Test() {
      if (a()) {
        // ...
      }
      return false;
    }

OK, that's `a`. For simplicity reason here we just use these for single letters to represent the production rules. Let's see if we can fit `b` into this.

    bool Test() {
      if (a()) {
        if (b()) {
          Reduce(2, "1");
          return true;
        }
        //...
      }
      return false;
    }

OK, that took care of the first production `a & b`. Since this is the first production we call that 1 `Reduce(2, "1")`. Now what? This is going to spiral out of control.

    bool Test() {
      if (a()) {
        if (b()) {
          if (c()) {
            int n = 3;
            while (b()) {
              if (!c()) {
                throw SyntaxError();
              }
              n += 2;
            }
            Reduce(n, "2");
            return true;
          }
          Reduce(2, "1");
          return true;
        }
        //...
      }
      return false;
    }

That was really messy and there's more, take a look at the third and forth rule. They are ambiguous.

Given the input "a b" the following two rules are matches:

    a & b
    a & (b | c | d)

Given the input "a b c" the following two rules are matches (since `d` is optional):

    a & (b & c)+
    a & b? & c & d*

Given the input "a c" the following two rules are matches (since `b` and `d` are optional):

    a & b? & c & d*
    a & (b | c | d)

The issue here isn't so much to understand that this can happen (that it won't work if we do it like this) but that we have to have a representation that allows us to quickly see that this is going to be an issue and this isn't something that inherently obvious right now.

OK, the only thing I can conclude from the above is that it is nonsensical (thus is represents a grammar that we'd have to reject), moving on.

How do we figure out if we are to reject a grammar then?

Again, this is Boolean algebra in some form or another. If we start out with the simple rule `a` and it is the only rule `a`. Then we can say that the production is sound. It has a single unambiguous interpretation.

Now, let's extend the original example with a second rule `a & b`. We now have to rules.

    a
    a & b

If we work our way from left-to-right we can see that applying `a` results in an accepting state and the choice of applying `b`. We need to try `b` before we can return but it's clear to see how we do this.

    a
    a & b
    a & c

Still clear what to do. This only adds another choice to the first accepting state that follows `a`.

    a
    a & b
    a & c
    a & (b | c)

Now what? How do we identify that that fourth construction is impossible (as is).

This is what we have.

    a
    a & b
    a & c

Get rid of the `a`. (for reference, they way we get rid of the `a` is of course the same way we get rid of every other term).

    b
    c
    (b | c)

We now have `b` and `c` and a candidate rule `(b | c)`.

If the current candidate rule `(b | c)` matches any of the other rules that we've already accepted we must reject the candidate rule if it results in an accepting state.

OK, that's easy with pair of simple expressions. What about when things get more involved?

> **Note:** at this point, I'm fairly sure that I'm about to invent my own algebra. I apologize in advance for headaches that this will inevitably create.

I need to change up the notation a bit. We need to define a few things before we continue. When we talk about applying a production rule we're talking about a function call in a recursive decent parser. This function call can call other functions that represent other production rules or it may accept (conditionally read) a token. These are the only two ways we can advance the parsing.

To continue this reasoning, we can generalize the accept operation as a production rule. A production rule that can accept only a single kind of token. And this is important because a production rule (as with a function) will hide underneath some behavior that may be inherently complex. The generalization here is that a production rule will only be successfully applied on a given set of token kinds. Let's take this idea and apply it to our small expression grammar.

    --tokens
    number = ("0" - "9") + ;
    operator = "+" | "-" | "*" | "/" ;
    lparen = "(" ;
    rparen = ")" ;

    --productions
    Expression = PrimaryExpression
      | PrimaryExpression operator Expression
      ;
    PrimaryExpression = number
      | lparen Expression rparen
      ;

Let's take the two production rules `Expression` and `PrimaryExpression`. The pre-condition for them to be successfully applied is the tokens that they accept at the top level (currently we only examine the top-level). `Expression` just applies `PrimaryExpression` so we need to perform dependency resolution and then start with `PrimaryExpression`. `PrimaryExpression` accepts either `number` or `lparen`. The set of tokens that gate the `PrimaryExpression` are thus `number` and `lparen`.

Let's get back to the definition part. Any production rule has an associated set of the tokens that it accepts at the top-level. These tokens form the top-level guard set. A lonely accept operation is an implicit production rule with a single guard token.

Now, let's get back to our example.

As we build our grammar we have the following two production rules:

    A [X, Y]
    B [Z]

We now introduce a third production rule that we imaginatively call `C [Y]`. `A` and `B` are both infinitely complicated but we can tell from our gate sets that `B` and `C` both share the gate token `Y`. If `C` would result in a new accepting state (a state that is a complete match for a production rule) this grammar rule would be ambiguous.

This process is applicable regardless of optional or repeated constructs since they don't change the contents of the guard sets.

There's another reason why we care about this as well and that's unification. By this we mean the ability to realize that two otherwise distinct production rules share some progression through a shared token. Here's an example of what unification may look like.

 Here we have two production rules `A` and `B` that share the same top-level guard set but are otherwise not ambiguous since accepting `x` does not result in an accepting state.

    A = x y w ;
    B = x z w ;
    C = A | B ;

From the grammatical construction we have two productions `A` and `B` that disambiguate by their second term. If we initially thought of them as disjoint we'd probably not notice that they actually disambiguate by their second term which is why unification is necessary. The name that we associate with the production rule is first and foremost a reference.

Let's introduce a different notation that's probably more representative of what we aim to achieve here. Note that `C = A | B` is just an alias for `A` or `B` (it's not important).

    x y w => A;
      z w => B;

This way we work our way from the far left to the far right and when we reach the accepting state `=>` we apply our projection. This projection is as of right now inferred from the production rule but can be used to build any syntax tree of choice (abstract or otherwise).

We could very well end up with a grammar that's like this.

    x y w => A;
      z w => B;
        w => C;

Where `w` as a single token is a valid production somewhere. The way this would work is that we would have a control flow where a production is simply an entry point into the directed control flow graph. For each directed edge in the graph there is an associated guard set.

    (x | y) z => A
    x       w => B
    y       w => C

The above three rules exemplify the way guard sets associated with edges in the control flow graph can change as we build up the grammar control flow graph.

Initially, we have a root node with the an edge going towards `z` with the associated guard set `[x, y]`. We then introduce `B` and since each path must lead to a unique production we need to split the guard set associated with the existing edge. The existing edge remains but the guard set no longer contains `x`. A new edge is introduced with the guard set `x` that goes to a new node with an edge for `z` and `w`. Only a node that is an accepting state results in the application of a production.

> Remember that the guard set is the accept (or apply) actions that we need to do in order to advance the parser. If we ever end up in a node where no edge can be taken, we have a syntax error. As soon as we reach an accept state we can yield a syntax tree (but only if there are not other choices to be made, our algorithm is a greedy one).

![alt text](https://docs.google.com/drawings/d/1QOMf-237LZEcCoYXVTeaZqUBL_1ptDdOCH5MbH9Hmf0/pub?w=680 "Recursive Descent Parser Control Flow Graph")

You can see this in the drawing here. The accepting states are labeled as such and the intermediate states are just labeled sequentially (those don't matter, other than if we get stuck there we have a syntax error). Note how the existing edges have to be copied when we split a guard set in two. When `s1` is introduced we have to duplicate the `[z]` edge going back to the production `A`. And hey, what do you know, no new algebra necessary. All we needed was some good old graph theory. This also happens to be one of the first instances where I've found labeled edges in a directed graph to be of use.
