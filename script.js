let stateCount = 0;

const operators = ['+', '.', '*', '(', ')'];
const precedence = {
  '+': 1,
  '.': 2,
  '*': 3
};

function toReversePolishStr(inputStr) {
  const reversePolishStr = [];
  const operatorStack = [];

  const infixStr = [];

  for (let i = 0; i < inputStr.length; ++i) {
    if (inputStr[i] == ' ') continue;
    if (i > 0 && (inputStr[i] == '(' || !operators.includes(inputStr[i])) && ([')', '*'].includes(infixStr[infixStr.length - 1]) || !operators.includes(infixStr[infixStr.length - 1]))) infixStr.push('.');
    infixStr.push(inputStr[i]);
  }

  for (let i = 0; i < infixStr.length; ++i) {
    if (operators.includes(infixStr[i])) {
      const operator = infixStr[i];

      if (operator == '(') operatorStack.push(operator);

      else if (operator == ')') {
        let op = operatorStack.pop();
        while (op != '(' && operatorStack.length > 0) {
          reversePolishStr.push(op);
          op = operatorStack.pop();
        }

        if (op != '(') throw "Invalid parenthesis";
      }

      else {
        while (operatorStack.length > 0 && !['(', ')'].includes(operator) && precedence[operatorStack[operatorStack.length - 1]] >= precedence[operator]) reversePolishStr.push(operatorStack.pop());
        operatorStack.push(operator);
      }

    }
    else reversePolishStr.push(infixStr[i]);
  }

  while (operatorStack.length != 0) {
    const operator = operatorStack.pop();
    if (['(', ')'].includes(operator)) throw "Invalid parenthesis";
    else reversePolishStr.push(operator);
  }

  return reversePolishStr;
}

function getNFA(regex) {
  const reversePolishStr = toReversePolishStr(regex).reverse();

  const stack = [];
  while (reversePolishStr.length != 0) {
    const element = reversePolishStr.pop();
    if (!operators.includes(element)) stack.push(new NFA(element));
    else {
      if (element == '*') {
        if (stack.length < 1) throw "Parse error (while parsing star";
        stack.push(stack.pop().star());
      }
      else {
        if (stack.length < 2) throw "Parse error (while parsing " + element;
        const operand1 = stack.pop();
        const operand2 = stack.pop();
        stack.push(element == '.'? NFA.concat(operand2, operand1) : NFA.union(operand2, operand1));
      }
    }
  }

  if (stack.length != 1) throw "Parser still found operands";

  return stack.pop();
}

function getDFA(regex) {
  return new DFA(getNFA(regex));
}


function draw(dfa) {
  const g = new dagreD3.graphlib.Graph().setGraph({});

  for (let state of dfa.states) {
    g.setNode(state, {
      label: 'q' + state,
      shape: dfa.acceptingStates.has(state)? 'rect' : 'circle'
    });
  }

  const map = {};

  for (let transitionKey in dfa.transition) {
    const parameters = transitionKey.split(',');
    const fromState = parseInt(parameters[0]);
    const toState = dfa.transition[transitionKey];
    const mapKey = [fromState, toState];
    if (!map[mapKey]) map[mapKey] = [];
    map[mapKey].push(parameters[1]);
  }

  for (let key in map) {
    const states = key.split(',').map(a => parseInt(a));
    const fromState = states[0];
    const toState = states[1];
    const label = map[key].join(',');
    g.setEdge(fromState, toState, {label});
  }

  const svg = d3.select("svg"),
    inner = svg.select("g");

// Set up zoom support
  const zoom = d3.zoom().on("zoom", function() {
    inner.attr("transform", d3.event.transform);
  });
  svg.call(zoom);

// Create the renderer
  const render = new dagreD3.render();

// Run the renderer. This is what draws the final graph.
  render(inner, g);

// Center the graph
  const initialScale = 0.75;
  svg.call(zoom.transform, d3.zoomIdentity.translate((svg.attr("width") - g.graph().width * initialScale) / 2, 20).scale(initialScale));

  svg.attr('height', g.graph().height * initialScale + 40);
}