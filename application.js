(function () {

    'use strict';

    /**
     * Sets up hooks to run before and after objects' methods.
     */
    var advise = (function () {
        var objects = [];
        var runAdvices = function (advices) {
            _.forEach(advices, function (fn) {
                fn();
            });
        };
        var getAdvisingFunction = function (mutateAdviceData) {
            return function (object, methodName, advice) {
                var entry = _.find(objects, function (entry) {
                    return entry.object === object;
                });
                if (entry === undefined) {
                    entry = {
                        object: object,
                        methods: {}
                    };
                }
                var data;
                if (entry.methods.hasOwnProperty(methodName)) {
                    data = entry.methods[methodName];
                } else {
                    data = {
                        method: object[methodName],
                        before: [],
                        after: []
                    };
                    entry.methods[methodName] = data;
                }
                mutateAdviceData(data, advice);
                var method = data.method;
                object[methodName] = function () {
                    runAdvices(data.before);
                    method.apply(this, arguments);
                    runAdvices(data.after);
                };
            };
        };
        var before = getAdvisingFunction(function (data, advice) {
            data.before.unshift(advice);
        });
        var after = getAdvisingFunction(function (data, advice) {
            data.after.push(advice);
        });
        return {
            before: before,
            after: after
        };
    }());

    /**
     * Inserts a string into a target string, replacing characters in the string
     * up to the length of the inserted string. (Works like the INSERT key.)
     * Also, it always replaces at least 1 character.
     */
    var insertString = function (target, string, index) {
        // Length should always be treated as at least 1
        var length = (string.length > 0) ? string.length : 1;
        return target.substring(0, index) + string + target.substring(index + length);
    };

    /**
     * Abstract representation of a Yugioh player.
     */
    var makePlayer = function () {
        var lifePoints = 8000;
        var getLifePoints = function () {
            return lifePoints;
        };
        var lose = function (amount) {
            lifePoints -= amount;
        };
        var gain = function (amount) {
            lifePoints += amount;
        };
        return {
            type: 'player',
            getLifePoints: getLifePoints,
            lose: lose,
            gain: gain
        };
    };

    /**
     * DOM representation of a player object.
     */
    var makePlayerView = function (spec) {
        var player = spec.model;
        var element = spec.element;

        var previousLifePoints = player.getLifePoints();

        var applyDelta = function () {
            var newLifePoints = player.getLifePoints();
            if (previousLifePoints !== newLifePoints) {
                element.textContent = newLifePoints;
                previousLifePoints = newLifePoints;
            }
        };

        _.forEach([
            'lose',
            'gain'
        ], function (methodName) {
            advise.after(player, methodName, applyDelta);
        });
    };

    /**
     * Abstract representation of an operand (a number) in an expression.
     */
    var makeOperand = function () {
        var value = '0000';
        var index = 0;
        var getValue = function () {
            return value;
        };
        var getIndex = function () {
            return index;
        };
        var insertDigit = function (digit) {
            value = insertString(value, digit, index);
            index += digit.length;
        };
        var deleteLastDigit = function () {
            if (index > 0) {
                var replacement = index <= 4 ? '0' : '';
                value = insertString(value, replacement, index - 1);
                index -= 1;
            }
        };
        return {
            type: 'operand',
            getValue: getValue,
            getIndex: getIndex,
            insertDigit: insertDigit,
            deleteLastDigit: deleteLastDigit
        };
    };

    /**
     * DOM representation of an operand object.
     */
    var makeOperandView = function (spec) {
        var operand = spec.model;

        var getDisplayedValue = function (isSelected) {
            var value = operand.getValue();
            var index = operand.getIndex();

            // Determine the "currently selected" character in the value (the
            // one that will be highlighted to show the user his index).
            var wrappedChar = value.charAt(index);
            if (wrappedChar === '') {
                wrappedChar = '&nbsp;';
            }

            var displayedValue;
            if (isSelected) {
                // Wrap that "currently selected" character.
                displayedValue =
                    value.substring(0, index) +
                    '<span class="yc-selected-operand-digit">' + wrappedChar + '</span>' +
                    value.substring(index + 1);
            } else {
                displayedValue = value;
            }

            // Remove leading zeroes in the displayed value.
            if (index > 0) {
                displayedValue = displayedValue.replace(/^0+/, function (match) {
                    return new Array(match.length + 1).join('');
                });
            }

            return displayedValue;
        };

        return {
            getDisplayedValue: getDisplayedValue
        };
    };

    /**
     * Abstract representation of a mathematical operator in an unevaluated
     * mathematical expression.
     */
    var makeOperator = function (symbol) {
        var getSymbol = function () {
            return symbol;
        };
        return {
            type: 'operator',
            getSymbol: getSymbol
        };
    };

    /**
     * DOM representation of an operator object.
     */
    var makeOperatorView = function (spec) {

    };

    /**
     * Abstract representation of a mathematical expression to eventually
     * evaluate and then add or subtract from a player's life points.
     */
    var makeExpression = function () {
        var items;
        var index;
        var getItems = function () {
            return items;
        };
        var getIndex = function () {
            return index;
        };
        var getCurrentItem = function () {
            return items[index];
        };
        var insertDigit = function (digit) {
            getCurrentItem().insertDigit(digit);
        };
        var backspace = function () {
            var currentItem = getCurrentItem();
            var currentItemIndex = currentItem.getIndex();
            if (index > 0 && currentItemIndex === 0) {
                items.splice(items.length - 2, 2);
                index -= 2;
            } else if (currentItemIndex > 0) {
                currentItem.deleteLastDigit();
            }
        };
        var getValue = function () {
            return parseFloat(getCurrentItem().getValue());
        };
        var clearValue = function () {
            items = [makeOperand()];
            index = 0;
        };
        clearValue();
        return {
            type: 'expression',
            getItems: getItems,
            getIndex: getIndex,
            getCurrentItem: getCurrentItem,
            insertDigit: insertDigit,
            backspace: backspace,
            getValue: getValue,
            clearValue: clearValue
        };
    };

    /**
     * DOM representation of an expression object.
     */
    var makeExpressionView = function (spec) {
        var expression = spec.model;
        var element = spec.element;

        var getDisplayedValue = function () {
            var itemsIndex = expression.getIndex();
            return _.reduce(expression.getItems(), function (previous, current, index) {
                var view;
                if (current.type === 'operand') {
                    view = makeOperandView({
                        model: current
                    });
                } else if (current.type === 'operator') {
                    view = makeOperatorView({
                        model: current
                    });
                }
                return previous + view.getDisplayedValue(index === itemsIndex);
            }, '');
        };

        var previousDisplayedValue = getDisplayedValue();

        var render = function () {
            var displayedValue = getDisplayedValue();
            if (previousDisplayedValue !== displayedValue) {
                element.innerHTML = getDisplayedValue();
                previousDisplayedValue = displayedValue;
            }
        };

        _.forEach([
            'insertDigit',
            'backspace',
            'clearValue'
        ], function (methodName) {
            advise.after(expression, methodName, render);
        });
    };


    /*
     * Static values.
     */

    var numberOfPlayers = 2;


    /*
     * State variables.
     */

    var players;
    var playerViews;
    var currentPlayerIndex;
    var expression;
    var expressionView;

    var getCurrentPlayer = function () {
        return players[currentPlayerIndex];
    };


    /**
     * Performs one-time setup logic.
     */
    var initializeOnce = (function () {
        var getExpressionApplicationFunction = function (methodName) {
            return function () {
                getCurrentPlayer()[methodName](expression.getValue());
                expression.clearValue();
            };
        };
        var lose = getExpressionApplicationFunction('lose');
        var gain = getExpressionApplicationFunction('gain');
        return function () {
            _.forEach(_.range(numberOfPlayers), function (index) {
                document.getElementById('yc-player-' + index + '-life-points')
                    .addEventListener('click', function () {
                        currentPlayerIndex = index;
                    }, false);
            });
            _.forEach(_.range(0, 10), function (number) {
                document.getElementById('yc-button-digit-' + number)
                    .addEventListener('click', function () {
                        expression.insertDigit(String(number));
                    }, false);
            });
            document.getElementById('yc-button-cancel')
                .addEventListener('click', function () {
                    expression.clearValue();
                }, false);
            document.getElementById('yc-button-delete')
                .addEventListener('click', function () {
                    expression.backspace();
                }, false);
            document.getElementById('yc-button-minus')
                .addEventListener('click', lose, false);
            document.getElementById('yc-button-plus')
                .addEventListener('click', gain, false);
        };
    }());

    /**
     * Performs per-game initialization logic. (Can be used to reset state.)
     */
    var initialize = function () {
        players = _.times(numberOfPlayers, makePlayer);
        currentPlayerIndex = 0;
        playerViews = _.map(players, function (player, index) {
            return makePlayerView({
                model: player,
                element: document.getElementById('yc-player-' + index + '-life-points')
            });
        });
        expression = makeExpression();
        expressionView = makeExpressionView({
            model: expression,
            element: document.getElementById('yc-expression')
        });
    };

    initialize();
    initializeOnce();

}());
