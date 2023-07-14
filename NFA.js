class NFA {
  constructor(symbol) {
    this.states = new Set();
    this.transition = {};
    this.startState = undefined;
    this.acceptingStates = new Set();

    if (symbol) {
      if (symbol == '$') {
        this.startState = stateCount++;
        this.acceptingStates.add(this.startState);
        this.states.add(this.startState);
      }

      else {
        this.startState = stateCount++;
        this.acceptingStates.add(stateCount++);

        this.states = new Set([this.startState, ...this.acceptingStates]);

        this.transition[[this.startState, symbol]] = new Set([...this.acceptingStates]);
      }
    }
  }

  static union(NFA1, NFA2) {
    const nfa = new NFA();

    nfa.startState = stateCount++;

    nfa.states = new Set([...NFA1.states, ...NFA2.states]).add(nfa.startState);

    nfa.transition[[nfa.startState, '$']] = new Set([NFA1.startState, NFA2.startState]);

    for (const transitionKey in NFA1.transition) {
      nfa.transition[transitionKey] = NFA1.transition[transitionKey];
    }
    for (const transitionKey in NFA2.transition) {
      nfa.transition[transitionKey] = NFA2.transition[transitionKey];
    }

    nfa.acceptingStates = new Set([...NFA1.acceptingStates, ...NFA2.acceptingStates]);

    return nfa;
  }


  static concat(NFA1, NFA2) {
    const nfa = new NFA();

    nfa.states = new Set([...NFA1.states, ...NFA2.states]);
    nfa.startState = NFA1.startState;
    nfa.acceptingStates = new Set([...NFA2.acceptingStates]);

    for (const transitionKey in NFA1.transition) {
      nfa.transition[transitionKey] = NFA1.transition[transitionKey];
    }
    for (const transitionKey in NFA2.transition) {
      nfa.transition[transitionKey] = NFA2.transition[transitionKey];
    }

    for (const acceptingState of NFA1.acceptingStates) {
      if (nfa.transition[[acceptingState, '$']]) nfa.transition[[acceptingState, '$']].add(NFA2.startState);
      else nfa.transition[[acceptingState, '$']] = new Set([NFA2.startState]);
    }
    return nfa;
  }

  star() {
    const nfa = new NFA();

    nfa.startState = stateCount++;
    nfa.states = new Set([nfa.startState, ...this.states]);
    nfa.acceptingStates = new Set([nfa.startState, ...this.acceptingStates]);

    for (const transitionKey in this.transition) {
      nfa.transition[transitionKey] = this.transition[transitionKey];
    }

    for (const acceptingState of this.acceptingStates) {
      if (nfa.transition[acceptingState, '$']) nfa.transition[[acceptingState, '$']].add(this.startState);
      else nfa.transition[[acceptingState, '$']] = new Set([this.startState]);
    }
    nfa.transition[[nfa.startState, '$']] = new Set([this.startState]);

    return nfa;
  }

  equivalent(state) {
    if (!this.states.has(state)) throw "Cannot evaluate E(state) if state is not in set of states";

    let equivalentSet = new Set([state]);

    const statesReachableWithEmptyTransition = this.transition[[state, '$']];
    if (statesReachableWithEmptyTransition) {
      for (let state of statesReachableWithEmptyTransition) {
        equivalentSet = new Set([...equivalentSet, ...this.equivalent(state)]);
      }
    }

    return equivalentSet;
  }

  equivalentOfSet(set) {
    let result = new Set();
    for (const state of set) result = new Set([...result, ...this.equivalent(state)]);
    return result;
  }


}