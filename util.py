import sys
import inspect
import heapq
import random
import io
from math import sqrt, inf, log


def manhattanDistance(xy1, xy2):
    "Returns the Manhattan distance between points xy1 and xy2"
    return abs(xy1[0] - xy2[0]) + abs(xy1[1] - xy2[1])


class Counter(dict):
    """
    A counter keeps track of counts for a set of keys.

    The counter class is an extension of the standard python
    dictionary type.  It is specialized to have number values
    (integers or floats), and includes a handful of additional
    functions to ease the task of counting data.  In particular,
    all keys are defaulted to have value 0.  Using a dictionary:

    a = {}
    print a['test']

    would give an error, while the Counter class analogue:

    >>> a = Counter()
    >>> print a['test']
    0

    returns the default 0 value. Note that to reference a key
    that you know is contained in the counter,
    you can still use the dictionary syntax:

    >>> a = Counter()
    >>> a['test'] = 2
    >>> print a['test']
    2

    This is very useful for counting things without initializing their counts,
    see for example:

    >>> a['blah'] += 1
    >>> print a['blah']
    1

    The counter also includes additional functionality useful in implementing
    the classifiers for this assignment.  Two counters can be added,
    subtracted or multiplied together.  See below for details.  They can
    also be normalized and their total count and arg max can be extracted.
    """

    def __getitem__(self, key):
        return self.setdefault(key, 0)

    def incrementAll(self, keys, count):
        """
        Increments all elements of keys by the same count.

        >>> a = Counter()
        >>> a.incrementAll(['one','two', 'three'], 1)
        >>> a['one']
        1
        >>> a['two']
        1
        """
        for key in keys:
            self[key] += count

    def argMax(self):
        """
        Returns the key with the highest value.
        """
        if len(list(self.keys())) == 0:
            return None
        all = list(self.items())
        values = [x[1] for x in all]
        maxIndex = values.index(max(values))
        return all[maxIndex][0]

    def sortedKeys(self):
        """
        Returns a list of keys sorted by their values.  Keys
        with the highest values will appear first.

        >>> a = Counter()
        >>> a['first'] = -2
        >>> a['second'] = 4
        >>> a['third'] = 1
        >>> a.sortedKeys()
        ['second', 'third', 'first']
        """
        sortedItems = list(self.items())

        def compare(x, y): return sign(y[1] - x[1])
        sortedItems.sort(cmp=compare)
        return [x[0] for x in sortedItems]

    def totalCount(self):
        """
        Returns the sum of counts for all keys.
        """
        return sum(self.values())

    def normalize(self):
        """
        Edits the counter such that the total count of all
        keys sums to 1.  The ratio of counts for all keys
        will remain the same. Note that normalizing an empty
        Counter will result in an error.
        """
        total = float(self.totalCount())
        if total != 0:
            self.divideAll(total)

    def divideAll(self, divisor):
        """
        Divides all counts by divisor
        """
        divisor = float(divisor)
        for key in self:
            self[key] /= divisor

    def sample(self):
        r = random.random() * self.totalCount()
        base = 0
        for key, prob in self.items():
            base += prob
            if r <= base:
                return key

    def copy(self):
        """
        Returns a copy of the counter
        """
        return Counter(dict.copy(self))

    def __mul__(self, y):
        """
        Multiplying two counters gives the dot product of their vectors where
        each unique label is a vector element.

        >>> a = Counter()
        >>> b = Counter()
        >>> a['first'] = -2
        >>> a['second'] = 4
        >>> b['first'] = 3
        >>> b['second'] = 5
        >>> a['third'] = 1.5
        >>> a['fourth'] = 2.5
        >>> a * b
        14
        """
        sum = 0
        x = self
        if len(x) > len(y):
            x, y = y, x
        for key in x:
            if key not in y:
                continue
            sum += x[key] * y[key]
        return sum

    def __radd__(self, y):
        """
        Adding another counter to a counter increments the current counter
        by the values stored in the second counter.

        >>> a = Counter()
        >>> b = Counter()
        >>> a['first'] = -2
        >>> a['second'] = 4
        >>> b['first'] = 3
        >>> b['third'] = 1
        >>> a += b
        >>> a['first']
        1
        """
        for key, value in list(y.items()):
            self[key] += value

    def __add__(self, y):
        """
        Adding two counters gives a counter with the union of all keys and
        counts of the second added to counts of the first.

        >>> a = Counter()
        >>> b = Counter()
        >>> a['first'] = -2
        >>> a['second'] = 4
        >>> b['first'] = 3
        >>> b['third'] = 1
        >>> (a + b)['first']
        1
        """
        addend = Counter()
        for key in self:
            if key in y:
                addend[key] = self[key] + y[key]
            else:
                addend[key] = self[key]
        for key in y:
            if key in self:
                continue
            addend[key] = y[key]
        return addend

    def __sub__(self, y):
        """
        Subtracting a counter from another gives a counter with the union of all keys and
        counts of the second subtracted from counts of the first.

        >>> a = Counter()
        >>> b = Counter()
        >>> a['first'] = -2
        >>> a['second'] = 4
        >>> b['first'] = 3
        >>> b['third'] = 1
        >>> (a - b)['first']
        -5
        """
        addend = Counter()
        for key in self:
            if key in y:
                addend[key] = self[key] - y[key]
            else:
                addend[key] = self[key]
        for key in y:
            if key in self:
                continue
            addend[key] = -1 * y[key]
        return addend

    def __str__(self):
        str_list = []
        str_list.append('{\n')
        for key, value in self.items():
            str_list.append('%s: %.6f\n' % (key, value))
        str_list.append('}')

        return ''.join(str_list)



def raiseNotDefined():
    fileName = inspect.stack()[1][1]
    line = inspect.stack()[1][2]
    method = inspect.stack()[1][3]

    print("*** Method not implemented: %s at line %s of %s" %
          (method, line, fileName))
    sys.exit(1)


class MCST_Node:
    def __init__(self, team_to_move, parent=None, action=None, board_state=None):
        self.team_to_move = team_to_move
        self.parent = parent
        self.children = []
        self.action = action
        self.board_state = board_state
        self.times_visited = 0
        self.total_score = 0
        self.average_value = None
        self.UCB = 1
        self.opponent_action_values = None

    def is_root(self):
        return self.parent == None

    def is_leaf(self):
        return self.children == []

    def make_children(self, value_function):
        if not self.is_root() and self.parent.opponent_action_values == None:
            self.parent.set_opponent_action_values(value_function)

        # opponent_action_values = self.parent.opponent_action_values
        def order_actions(action):
            if action in self.parent.opponent_action_values:
                return self.parent.opponent_action_values[action]
            elif (action[0], None) in self.parent.opponent_action_values:
                return self.parent.opponent_action_values[ (action[0], None) ]
            else:
                return self.parent.average_value

        # def order_moves(move):
        #     piece_type = self.board_state[move[0]].type
        #     if piece_type == 'Pharaoh':
        #         return 0
        #     elif piece_type == 'Djed':
        #         return 1
        #     elif piece_type == 'Pyramid':
        #         return 2
        #     else:
        #         return 3

        actions = []
        for move in self.board_state.get_valid_moves():
            for laser in (None, 0, 1):
                actions.append( (move, laser) )

        if not self.is_root():
            actions.sort(key=order_actions, reverse=(True if self.team_to_move == 0 else False))

        for action in actions:
            self.children.append(MCST_Node(1 - self.team_to_move, self, action))

    def update(self, value):
        self.times_visited += 1
        self.total_score += value
        self.average_value = self.total_score / self.times_visited

        team_toggle = 1 if self.team_to_move == 1 else -1
        self.UCB = team_toggle * self.average_value + 1 / sqrt(self.times_visited + 1) * (1 - team_toggle * self.average_value)
        # print('times_visited:', self.times_visited)
        # print('total_score:', self.total_score)
        # print('average_value:', self.average_value)
        # print('UCB set to', self.UCB)

    def add_board_state(self):
        move, laser = self.action
        self.board_state = self.parent.board_state.get_successor_state(move)

        if laser == None or self.board_state.fire_laser(laser) != None:
            return True

        return False

    def set_opponent_action_values(self, value_function):
        self.opponent_action_values = {}
        board_state_reverse_turns = self.board_state.copy()
        board_state_reverse_turns.turn = 1 - board_state_reverse_turns.turn
        for move in board_state_reverse_turns.get_valid_moves():
            next_board_state_pre_laser = board_state_reverse_turns.get_successor_state(move)
            for laser in (None, 0, 1):
                if laser == None:
                    next_board_state = next_board_state_pre_laser

                elif next_board_state_pre_laser.get_laser_path(laser)[-1] != None:
                    next_board_state = next_board_state_pre_laser.get_successor_state(laser=laser)
                    
                else:
                    continue

                self.opponent_action_values[ (move, laser) ] = value_function(next_board_state)

