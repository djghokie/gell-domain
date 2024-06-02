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

    describe('extension', function() {
        let model;

        beforeEach(function() {
            const base = {
                attributes: {
                    a: 'string',
                    s: {
                        type: 'string',
                        default: 'gello!'
                    },
                }
            }

            model = {
                class: Extension,
                extends: base,
                attributes: {
                    m: 'number',
                    s: {
                        type: 'string',
                        default: 'world!'
                    },
                }
            }
        })
    
        it('inherited attributes', function() {
            const model$$ = compiler.compile(model);

            assert.strictEqual(model$$.class, Extension);
            assert.strictEqual(model$$.attributes.length, 3);

            assert.deepStrictEqual(model$$.attributes[0], {
                name: 'a',
                type: 'string'
            });
        })

        it('overridden attribute', function() {
            const model$$ = compiler.compile(model);

            assert.strictEqual(model$$.class, Extension);
            assert.strictEqual(model$$.attributes.length, 3);

            const s = model$$.attributes.find(a => a.name === 's');
    
            assert.deepStrictEqual(s, {
                name: 's',
                type: 'string',
                default: 'world!'
            });
        })
    })

    describe('attribute', function() {
        it.skip('undefined', function() {
            compiler.attribute();
        })

        it('name only', function() {
            const attribute$$ = compiler.attribute('a');

            assert.deepStrictEqual(attribute$$, { name: 'a' });
        })

        it('spec only', function() {
            const attribute$$ = compiler.attribute(null, 'a');

            assert.deepStrictEqual(attribute$$, { name: 'a' });
        })

        it('simple', function() {
            const attribute$$ = compiler.attribute('a', 'string');

            assert.deepStrictEqual(attribute$$, { name: 'a', type: 'string' });
        })

        it('boolean spec', function() {
            const attribute$$ = compiler.attribute('a', true);

            assert.deepStrictEqual(attribute$$, { name: 'a' });
        })

        it('function spec', function() {
            const attribute$$ = compiler.attribute('a', z => 'gello!');

            assert.deepStrictEqual(attribute$$, { name: 'a' });
        })

        it('type descriptor', function() {
            const attribute$$ = compiler.attribute('a', { type: 'boolean' });

            assert.deepStrictEqual(attribute$$, { name: 'a', type: 'boolean' });
        })

        it('with defined type', function() {
            const attribute$$ = compiler.attribute('a', { type: 'name' }, { name: { type: 'string' } });

            assert.deepStrictEqual(attribute$$, { name: 'a', type: 'name' });
        })

        it('with static default', function() {
            const attribute$$ = compiler.attribute('a', { default: "gello!" });

            assert.deepStrictEqual(attribute$$, { name: 'a', default: 'gello!' });
        })
    })

    describe('describe', function() {
        beforeEach(function() {
        })
    
        it('works', function() {
            const model = {
                class: Extension,
                attributes: ['a']
            }
    
            const model$$ = compiler.describe(model);

            assert(model$$.id);
            assert.strictEqual(model$$.name, "Extension extension");
            assert.deepStrictEqual(model$$.class, { name: "Extension" });
            assert.strictEqual(model$$.attributes.length, 1);
    
            // type: a.type || 'unknown',
            // default: dfault

            assert.deepStrictEqual(model$$.attributes[0], {
                name: 'a',
            });
        })
    })

})
