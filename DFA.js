class DFA {
  constructor(nfa) {

    this.alphabet = new Set();
    for (let transitionKey in nfa.transition) {
      const symbol = transitionKey.split(',')[1];
      if (symbol != '$') this.alphabet.add(symbol);
    }

    this.startState = [...nfa.equivalent(nfa.startState)].sort().join('-');

    this.states = new Set().add(this.startState);
    this.transition = {};

    const stack = [this.startState];
    const done = {};

    while (stack.length != 0) {
      const nfaStatesStr = stack.pop();
      const nfaStates = nfaStatesStr.length == 0? [] : nfaStatesStr.split('-').map(a => parseInt(a));

      if (done[nfaStatesStr]) continue;

      for (const symbol of this.alphabet) {
        let nextStateSet = new Set();
        for (const nfaState of nfaStates) {
          if (nfa.transition[[nfaState, symbol]]) nextStateSet = new Set([...nextStateSet, ...nfa.equivalentOfSet(nfa.transition[[nfaState, symbol]])]);
        }

        const nextState = [...nextStateSet].sort().join('-');

        this.transition[[nfaStatesStr, symbol]] = nextState;
        this.states.add(nextState);
        if (!done[nextState]) stack.push(nextState);
      }

      done[nfaStatesStr] = true;

    }

    this.acceptingStates = new Set();
    for (const state of this.states) {
      if (state.length == 0) continue;
      const nfaStates = state.split("-").map(a => parseInt(a));
      for (const nfaState of nfaStates) {
        if (nfa.acceptingStates.has(nfaState)) {
          this.acceptingStates.add(state);
          break;
        }
      }
    }


    this.minimize();

  }


  getConditionsToBeCompatible(state1, state2) {
    const conditions = new Set();
    for (const symbol of this.alphabet) {
      const nextState1 = this.transition[[state1, symbol]];
      const nextState2 = this.transition[[state2, symbol]];
      if (nextState1 != nextState2) conditions.add([nextState1, nextState2].sort());
    }
    return conditions;
  }

  inSamePartition(state1, state2, partitions) {
    for (let partition of partitions) {
      if (this.partitionHasState(state1, partition) && this.partitionHasState(state2, partition)) return true;
    }
    return false;
  }

  partitionHasState(state, partition) {
    for (let s of partition) {
      if (s == state) return true;
    }
    return false;
  }

  areCompatible(state1, state2, partitions) {
    const conditionPairs = this.getConditionsToBeCompatible(state1, state2);
    for (const pair of conditionPairs) {
      if (!this.inSamePartition(pair[0], pair[1], partitions)) return false;
    }
    return true;
  }

  splitPartition(partition) {
    const nextIndices = [];
    let length = 1;

    for (let state of partition) nextIndices.push(0);

    for (let i = 1; i < partition.length; ++i) {
      let found = false;
      for (let j = 0; j < i; ++j) {
        if (this.areCompatible(partition[i], partition[j], partition)) {

          nextIndices[i] = nextIndices[j];

          found = true;
          break;
        }
      }

      if (!found) nextIndices[i] = length++;

    }

    const nextPartitions = [];
    for (let i = 0; i < length; ++i) nextPartitions.push([]);

    for (let i = 0; i < partition.length; ++i) {
      nextPartitions[nextIndices[i]].push(partition[i]);
    }

    return nextPartitions;
  }


  getNextPartitions(partitions) {
    const nextPartitions = [];
    for (let partition of partitions) {
      const next = this.splitPartition(partition);
      nextPartitions.push(...next);
    }
    return nextPartitions;
  }


  getNonAccepting() {
    const set = new Set();
    for (let state of this.states) {
      if (!this.acceptingStates.has(state)) set.add(state);
    }
    return set;
  }

  getPartitions() {
    let prevPartitions = [[...this.acceptingStates], [...this.getNonAccepting()]];
    for (let i = prevPartitions.length - 1;  i >= 0; --i) {
      if (prevPartitions[i].length == 0) prevPartitions.splice(i, 1);
    }
    while (true) {
      let nextPartitions = this.getNextPartitions(prevPartitions);
      if (nextPartitions.length == prevPartitions.length) break;
      prevPartitions = nextPartitions;
    }
    return prevPartitions;
  }

  getContainerPartitionIndex(state, partitions) {
    for (let i = 0; i < partitions.length; ++i) {
      if (this.partitionHasState(state, partitions[i])) return i;
    }
  }

  minimize() {
    const partitions = this.getPartitions();

    const setOfStates = new Set();
    for (let i = 0; i < partitions.length; ++i) {
      setOfStates.add(i);
    }

    const startStateIndex = this.getContainerPartitionIndex(this.startState, partitions);
    const startStatePartition = partitions[startStateIndex];
    partitions.splice(startStateIndex, 1);
    partitions.reverse().push(startStatePartition);
    partitions.reverse();

    const startState = 0;

    const transition = {};
    for (let i = 0; i < partitions.length; ++i) {
      const head = partitions[i][0];
      for (const symbol of this.alphabet) {
        const nextState = this.transition[[head, symbol]];
        const nextMinimizedState = this.getContainerPartitionIndex(nextState, partitions);
        transition[[i, symbol]] = nextMinimizedState;
      }
    }

    const acceptingStates = new Set();
    for (let i = 0; i < partitions.length; ++i) {
      if (this.acceptingStates.has(partitions[i][0])) acceptingStates.add(i);
    }

    this.startState = startState;
    this.states = setOfStates;
    this.transition = transition;
    this.acceptingStates = acceptingStates;
  }


}