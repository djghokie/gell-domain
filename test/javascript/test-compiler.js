const assert = require('assert');
const _ = require('lodash');

const { State } = require('gell');

const compiler = require('../../binding/compiler');

class Extension extends State {
}

describe('javascript compiler', function() {
    beforeEach(function() {
    })

    describe('base cases', function() {
        beforeEach(function() {
        })
    
        it('no model', function() {
            const model$$ = compiler.compile();

            assert.strictEqual(model$$.class, State);
            assert.deepStrictEqual(model$$.attributes, []);
        })

        it('blank model', function() {
            const model$$ = compiler.compile({});

            assert.strictEqual(model$$.class, State);
            assert.deepStrictEqual(model$$.attributes, []);
        })
    })

    it('simple model', function() {
        const model = {
            attributes: ['a']
        }

        const model$$ = compiler.compile(model);

        assert.strictEqual(model$$.class, State);
        assert.strictEqual(model$$.attributes.length, 1);

        assert.deepStrictEqual(model$$.attributes[0], {
            name: 'a'
        });
    })

    it('model with actor', function() {
        const model = {
            attributes: {
                a: {
                    actor: 'john'
                }
            }
        }

        const model$$ = compiler.compile(model);

        assert.strictEqual(model$$.class, State);
        assert.strictEqual(model$$.attributes.length, 1);

        assert.deepStrictEqual(model$$.attributes[0], {
            name: 'a',
            actor: 'john'
        });
    })

    it('model with class', function() {
        const model = {
            class: Extension,
            attributes: ['a']
        }

        const model$$ = compiler.compile(model);

        assert.strictEqual(model$$.class, Extension);
        assert.strictEqual(model$$.attributes.length, 1);

        assert.deepStrictEqual(model$$.attributes[0], {
            name: 'a'
        });
    })

})
