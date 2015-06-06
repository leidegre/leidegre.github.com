
This update will be about the syntax tree construction. In this case I'm trying to map out how to do it without using on return values. I put up a [working example in C#](https://gist.github.com/leidegre/12ecb24e588f97954762) real quick. Take a look.

I'm introducing a new concept which I call reduction, or just reduce. Where I pop a number of syntax tree nodes from a specific stack and then add them as child nodes to a new syntax tree node that replaces these nodes on the stack. The twist is that if we unwind the stack as-is, we'll end up with the syntax tree nodes in reverse order, so we use a list with random-access capabilities to reverse the reversal in place. Take a look at the `Reduce` method in the C# example.

In past efforts, I've used the return value to propagate syntax tree nodes. Optional (or conditional) production rules have then been implemented like this:

    var result = SomeProduction();
    if (result != null) {
      // combine with some other production rule
    }
    
If the return value is not `null` we can proceed with additional production rules that expect some other production rule to proceed it. Something which isn't yet clear to me is to how to treat the ambient stack when a production rule does not end up modifying the stack. As an example we could have reductions in the stack that end up not changing the stack for the casual observer. A way around that is to use a version scheme, any stack modification will increment the version. Different versions implies return value propagation.

The whole point behind this is to eliminate stack frames but this is not going to be possible if we need to support optional or repeated production rules. These would modify the stack in a way that are not predictable. Lists are a primary example where we need to count each production that's being applied in a loop. Lists appear in some variations but generally follow this pattern:

    for (;;) {
      var result = SomeProduction();
      if (result == null) {
        break;
      }
    }
    
Looking at the Read/Accept pair in the C# example there's a couple of things I'd like to point out.

    private Token _token;

    private void Read() {
      if (_inputStream.MoveNext()) {
        _token = _inputStream.Current;
      } else {
        _token = default(Token);
      }
    }

    protected bool Accept(TokenType type) {
      if (_token.Type == type) {
        _stack.Add(new TokenNode(_token)); // push
        Read();
        return true;
      }
      return false;
    }
  
The tokens get pushed onto the syntax tree evaluation stack as we accept the tokens. Traditionally, I've written these kinds of recursive decent parsers like this:

    var token1 = token_;
    if (Accept(Token.SomeToken)) {
      var token2 = token_;
      if (Accept(Token.SomeOtherToken)) {
        //...
      }
    }
    
That's rather annoying becuase you have to introduce a lot of local variables to keep track of each token within the respective production rule. Since the parc execution environment does not have support for local variables we'll maintain a seperate evaluation stack for syntax tree construction.

Here's the primary rule form the same C# example. It's very clean in that the way we reduce the syntax tree stack is to group together a bunch of syntax tree nodes based on a specific state in the parser. This works really well in practice (and we don't depend on return value propagation). The trick is of course how to determine where to put the reduce calls.

    public void Primary()
    {
      if (Accept(TokenType.Number))
      {
        Reduce(1, "NumberLiteral");
        return;
      }
      if (Accept(TokenType.LeftParen))
      {
        Expression();
        if (!Accept(TokenType.RightParen))
        {
          throw new InvalidOperationException();
        }
        Reduce(3, "EvalExpression");
        return;
      }
    }

As things stand right now the instruction set (or byte code) we use is composed of the following instructions:

- `accept <token>` push `1` if token is read otherwise push `0`.
- `beq <target>` if top of evaluation stack is non-zero, transfer control to `target`
- `jmp <target>` transfer control to `target`
- `call <target>` push current address as return address, transfer control to `target`
- `ret` pop return address, transfer control to return address
- `err` raise syntax error

I'm going to add a `reduce` which does what the C# example does and I'm going to add additional side-effects to accept (those that modify the syntax tree evaluation stack).

I'm also introducing fixed-size stack frame that changes with respect to the `call` and `ret` instructions. As things stand, there will be need for some local state to keep track of production rules that read a variable number of tokens.
