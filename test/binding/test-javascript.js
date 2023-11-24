const assert = require('assert');
const _ = require('lodash');

const { State } = require('gell');

const { materialize, attribute } = require('../../binding/javascript');

class Extension extends State {
	message='gello!'
}

describe('javascript materializer', function() {
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
	})

	describe('attribute', function() {
		it('string spec', function() {
			const { name, value } = attribute(undefined, 'a', image$, types);

			assert.strictEqual(name, 'a');
			assert.strictEqual(value, 100);
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

		it('object spec', function() {
			const spec = {
				type: 'date'
			}

			const { name, value } = attribute('b', spec, image$, types);

			assert.strictEqual(name, 'b');
			assert(_.isDate(value));
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

		it('spec with static default', function() {
			const spec = {
				default: 'gello!'
			}

			const { name, value } = attribute('b', spec, image$, types);

			assert.strictEqual(name, 'b');
			assert.strictEqual(value, 'gello!');
		})
	})
})