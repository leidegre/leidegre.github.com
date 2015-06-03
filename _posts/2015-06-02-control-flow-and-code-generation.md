I've been here before.

What do you do when you want to write code to execute more code? How do you (in code) represent code that you can execute inside your other code and what does that look like? Essentially what we're talking about is this. How does a compiler take a text file and produce something that the microprocessor can execute and can we write that (as well as the microprocessor) in code?

Another way to pose this question is, how do you run a syntax tree?

I wrote this grammar:

    void Expression() {
      PrimaryExpression();
      if (Accept(kTokenOperator)) {
        Expression();
      }
    }

    void PrimaryExpression() {
      if (Accept(kTokenNumber)) {
        return;
      }
      if (Accept(kTokenLeftParenthesis)) {
        Expression();
        Expect(kTokenRightParenthesis);
      }
    }

Drew this control flow graph:

![alt text](https://docs.google.com/drawings/d/1mrY-F6Afq4Ipbi-07Zp0MoJkSsSzjUlkmKt1H9cCkTA/pub?w=680 "Recursive push/pop stack transitions")

And packed everything in a data structure:

    enum {
      kOpCodeAccept,
      kOpCodeApply,
      kOpCodeReturn
    };
    enum {
      kTokenNumber,
      kTokenLeftParenthesis,
      kTokenRightParenthesis,
      kTokenOperator
    };
    struct ControlFlowNode {
      int op_code_;
      int token_;
      ControlFlowNode* next_;
      ControlFlowNode* tran_;
    };

And modeled the data as such:

    auto primary = new ControlFlowNode;
    auto lparen = new ControlFlowNode;
    auto eval = new ControlFlowNode;
    auto rparen = new ControlFlowNode;
    auto expr = new ControlFlowNode;
    auto binary = new ControlFlowNode;
    auto expr2 = new ControlFlowNode;
    
    rparen->op_code_ = kOpCodeAccept;
    rparen->token_ = kTokenRightParenthesis;
    rparen->tran_ = // new kReturn node...;
    
    eval->op_code_ = kOpCodeApply;
    eval->tran_ = expr;
    eval->next_ = rparen;
    
    lparen->op_code_ = kOpCodeAccept;
    lparen->token_ = kTokenLeftParenthesis;
    lparen->tran_ = eval;
    
    primary->op_code_ = kOpCodeAccept; 
    primary->token_ = kTokenNumber;
    primary->tran_ = // new kOpCodeReturn node...
    primary->next_ = lparen;
    
    expr2->op_code_ = kOpCodeApply
    expr2->tran_ = expr;
    expr2->next_ = // new kOpCodeReturn node...
    
    binary->op_code_ = kOpCodeAccept;
    binary->token_ = kTokenOperator;
    binary->tran_ = expr2;
    binary->next_ = // new kOpCodeReturn node...
    
    expr->op_code_ = kOpCodeApply;
    expr->tran_ = primary;
    expr->next_ = binary;

And eventually had a eureka moment. 

What if I simply followed along the edges (`tran_` pointer) in the control flow graph and emitted byte code until all nodes where visited. I would follow branches (`kAccept`) or function calls (`kApply`) first, then see if there was a `next_` pointer.

    bool Bind(node, map, va) {
      if (map->TryGet(node, va)) {
        return false;
      }
      map->Add(node, *va = map->GetSize());
      return true;
    }

    void Emit(node, map) {
      int node_va;
      Bind(node, map, &node_va);
      
      int tran_va;
      if (node->tran_ && Bind(node->tran_, &tran_va)) {
        Emit(node->tran_, map);
      }
      
      EmitLabel(node_va);
      switch (node->op_code_) {
        case kOpCodeAccept: {
          EmitAccept(node->token_);
          EmitBranchOnEqual(tran_va);
          break;
        }
        case kOpCodeApply: {
          EmitApply(tran_va);
          break;
        }
        case kOpCodeReturn: {
          EmitReturn();
          break;
        }
      }
      
      if (node->next_) {
        int next_va;
        Bind(node->next_, &next_va);
        if (node_va + 1 != next_va) {
          EmitBranch(next_va);
        }
        Emit(node->next_, map);
      }
    }


I implemented this algorithm to generate the byte code (ran it on paper) then took the design and wrote a stack machine for it, in the size of ~100 lines of code. This made me very comfortable in believing that the direction that this is going is actually going to pan out. 

The result was something like this:

    3:
      return
    PrimaryExpression:
      accept   kTokenNumber
      beq      3
      jmp      4
    5:
      call     Expression
      jmp      6
    7:
      return
    6:
      accept   kTokenRightParenthesis
      beq      7
      jmp      8
    8:
      error
    4:
      accept   kTokenLeftParenthesis
      beq      5
      jmp      9
    9:
      return
    Expression:
      call     PrimaryExpression
      jmp      10
    11:
      call     Expression
      jmp      12
    12:
      return
    10:
      accept   kTokenOperator
      beq      11
      jmp      13
    13:
      return

A complete mess, I know but the microprocessor don't care. What's intresting is that there's no explicit function definition. A function simply happens where it's used and is then referred to from everywhere else. What's even more intresting is that this byte code (or intermediate representation) can be rewritten in the form of the LLVM instruction set. If you do that, then we can ask LLVM to compile (and optimize) the byte code to whatever target needed.

A second pass over this byte code to reorganize and remove the unnecessary labels might be prudent but it's completely optional (this will work).
