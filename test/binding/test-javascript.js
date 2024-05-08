const assert = require('assert');
const _ = require('lodash');

const { State } = require('gell');

const { materialize, attribute } = require('../../binding/javascript');
const javascript = require('../../binding/javascript');

class Extension extends State {
	message='gello!'
}

describe('javascript binding', function() {
	let image$, types;

	beforeEach(function() {
		image$ = {
			a: 100
		}

		types = {
			ts: {
				default: 'foo'
			},
			date: {
				default: z => new Date()
			}
		}
	})

	describe('materialize', function() {
		it('no image or model', function() {
			const s_ = materialize();

			assert(s_);
			assert.deepStrictEqual(s_.snapshot(), {});
		})

		it('no model', function() {
			const s_ = materialize({ a: 100 });

			assert(s_);
			assert.deepStrictEqual(s_.snapshot(), { a: 100 });
		})

		it('simple model', function() {
			const model = {
				attributes: ['a']
			}

			const s_ = materialize({ a: 100 }, model);

			assert(s_);
			assert.deepStrictEqual(s_.snapshot(), { a: 100 });
		})

		it('model with actor', function() {
			const model = {
				attributes: {
					a: {
						actor: 'john'
					}
				}
			}

			const s_ = materialize({ a: 100 }, model);

			assert(s_);
			assert.deepStrictEqual(s_.snapshot(), {});
			assert.deepStrictEqual(s_.snapshot('jane'), {});
			assert.deepStrictEqual(s_.snapshot('john'), { a: 100 });
		})

		it('model with class', function() {
			const model = {
				class: Extension,
				attributes: ['a']
			}

			const s_ = materialize({ a: 100 }, model);

			assert(s_);
			assert.deepStrictEqual(s_.snapshot(), { a: 100 });
			assert.strictEqual(s_.message, 'gello!');
		})

		it('with class parameter', function() {
			const model = {
				attributes: ['a']
			}

			const s_ = materialize({ a: 100 }, model, Extension);

			assert(s_);
			assert.deepStrictEqual(s_.snapshot(), { a: 100 });
			assert.strictEqual(s_.message, 'gello!');
		})

		it('single inheritence', function() {
			const base = {
				attributes: {
					message: {
						default: 'gello!'
					},
					b: true
				}
			}

			const model = {
				extends: base,
				attributes: ['a']
			}

			const s_ = materialize({ a: 200, b: 100 }, model);

			assert(s_);
			assert.deepStrictEqual(s_.snapshot(), { a: 200, b: 100, message: 'gello!' });
		})

		it('model with generated default attribute', function() {
			const model = {
				attributes: {
					a: {
						default: z => Math.random()
					},
					b: {
						default: z => Math.random()
					}
				}
			}

			const s_ = materialize({}, model, Extension);

			const s$ = s_.snapshot();

			assert(_.isNumber(s$.a));
			assert(_.isNumber(s$.b));

			assert.strictEqual(s$.a, s_.snapshot().a);
			assert.strictEqual(s$.a, s_.get('a'));

			assert.strictEqual(s$.b, s_.snapshot().b);
			assert.strictEqual(s$.b, s_.get('b'));
		})
	})

	describe('attribute', function() {
		it('string spec', function() {
			const { name, value, actor } = attribute(undefined, 'a', image$, types);

			assert.strictEqual(name, 'a');
			assert.strictEqual(value, 100);
			assert(actor === undefined);
		})

		it.skip('name and string spec', function() {
			const { name, value } = attribute('foo', 'a', image$, types);

			assert.strictEqual(name, 'foo');
			assert.strictEqual(value, 100);
		})

		it('true spec', function() {
			const { name, value } = attribute('a', true, image$, types);

			assert.strictEqual(name, 'a');
			assert.strictEqual(value, 100);
		})

		it('primitive type spec', function() {
			const { name, value } = attribute('a', 'number', image$, types);

			assert.strictEqual(name, 'a');
			assert.strictEqual(value, 100);
		})

		it('simple type spec', function() {
			const { name, value } = attribute('b', 'ts', image$, types);

			assert.strictEqual(name, 'b');
			assert.strictEqual(value, 'foo');
		})

		it('function spec', function() {
			const { name, value } = attribute('b', z => 'gello!', image$, types);

			assert.strictEqual(name, 'b');
			assert.strictEqual(value(), 'gello!');
		})

		it('object spec', function() {
			const spec = {
				type: 'date'
			}

			const { name, value } = attribute('b', spec, image$, types);

			assert.strictEqual(name, 'b');
			assert(_.isDate(value()));
		})

		it('object spec with undefined type', function() {
			const spec = {
				type: 'foo',
				default: 'gello!'
			}

			const { name, value } = attribute('b', spec, image$, types);

			assert.strictEqual(name, 'b');
			assert.strictEqual(value, 'gello!');
		})

		it('object spec with static default', function() {
			const spec = {
				default: 'gello!'
			}

			const { name, value } = attribute('b', spec, image$, types);

			assert.strictEqual(name, 'b');
			assert.strictEqual(value, 'gello!');
		})

		it('object spec with derivation function', function() {
			const spec = {
				default: 'gello!',
				derive: z => 'world!'
			}

			const { name, value } = attribute('b', spec, image$, types);

			assert.strictEqual(name, 'b');
			assert.strictEqual(value(), 'world!');
		})

		it('object spec with derivation function dependent on state', function() {
			const spec = {
				default: 'gello!',
				derive: z => 'world!'
			}

			const { name, value } = attribute('b', spec, image$, types);

			assert.strictEqual(name, 'b');
			assert.strictEqual(value(), 'world!');
		})

		it('object spec with actor', function() {
			const spec = {
				type: 'foo',
				actor: 'john'
			}

			const { name, value, actor } = attribute('a', spec, image$, types);

			assert.strictEqual(name, 'a');
			assert.strictEqual(value, 100);
			assert.strictEqual(actor, 'john');
		})
	})

	describe('merge', function() {
		let image$, s_, model;

		beforeEach(function() {
			image$ = {};
			s_ = new State();
			model = {
				attributes: {}
			}
		})
		
		it('empty', function() {
			javascript.merge(image$, s_, model);

			assert.deepStrictEqual(s_.snapshot(), {});
		})

		it('new attribute', function() {
			image$.a = 200;
			model.attributes.a = 'number';

			javascript.merge(image$, s_, model);

			assert.deepStrictEqual(s_.snapshot(), { a: 200 });
		})

		it('with existing attribute', function() {
			s_.set('b', 'gello!');
			image$.a = 200;
			model.attributes.a = 'number';

			javascript.merge(image$, s_, model);

			assert.deepStrictEqual(s_.snapshot(), { a: 200, b: 'gello!' });
		})

		it('overrides existing attribute', function() {
			s_.set('a', 'gello!');
			image$.a = 'world!';
			model.attributes.a = 'string';

			javascript.merge(image$, s_, model);

			assert.deepStrictEqual(s_.snapshot(), { a: 'world!' });
		})

		it('handles inheritence', function() {
			image$.a = 'gello';
			image$.b = 'world!';

			const base = {
				attributes: {
					a: 'string'
				}
			}

			model.extends = base;
			model.attributes.b = 'string';

			javascript.merge(image$, s_, model);

			assert.deepStrictEqual(s_.snapshot(), { a: 'gello', b: 'world!' });
		})

		it('does not override defaulted attribute (defect)', function() {
			image$.c = 'foo';
			s_.set('a', 555);
			model.attributes.a = {
				type: 'number',
				default: z => Math.random()
			}
			model.attributes.b = {
				type: 'string',
				default: 'gello'
			}
			model.attributes.c = {
				type: 'string',
				default: 'world!'
			}

			javascript.merge(image$, s_, model);
			
			assert.deepStrictEqual(s_.snapshot(), { a: 555, b: 'gello', c: 'foo' });
		})
	})

	describe('model with inheritence', function() {
		let model;

		class Custom extends State {
			get gello() {
				return 'world!'
			}
		}

		beforeEach(function() {
			const base = {
				attributes: {
					a: 'number'
				}
			}

			model = {
				extends: [base]
			}
		})

		it('materialize overrides class if specified', function() {
			const s_ = javascript.materialize({ a: 100 }, model, Custom);

			assert.strictEqual(s_.gello, 'world!');
			assert.deepStrictEqual(s_.snapshot(), { a: 100 })
		})

		it('multiple levels', function() {
			model.attributes = { b: 'number' }

			const top = {
				extends: model,
				attributes: {
					c: 'number'
				}
			}

			const image$ = {
				a: 100,
				b: 200,
				c: 300
			}

			const s_ = javascript.materialize(image$, top);

			assert.deepStrictEqual(s_.snapshot(), image$)
		})

		it('class defined in middle of hierarchy', function() {
			model.attributes = { b: 'number' }
			model.class = Custom;

			const top = {
				extends: model,
				attributes: {
					c: 'number'
				}
			}

			const image$ = {
				a: 100,
				b: 200,
				c: 300
			}

			const s_ = javascript.materialize(image$, top);

			assert.strictEqual(s_.gello, 'world!');
			assert.deepStrictEqual(s_.snapshot(), image$)
		})
	})
})