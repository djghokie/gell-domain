const assert = require('assert');
const _ = require('lodash');

const { State } = require('gell');
const Projection = require('gell/lib/projection');

const { projection, project } = require('../../binding/javascript');

class Extension extends State {
	message='gello!'
}

describe('javascript model projections', function() {
	let source_, model;

	beforeEach(function() {
		source_ = new State();

		model = {}
	})

	describe('project attribute', function() {
		let p_;

		beforeEach(function() {
			source_.set('a', 500);
			source_.set('n', 300);

			p_ = new Projection(source_);
		})

		it('reflect', function() {
			projection('a', true, p_);

			const val$ = p_.get('a');

			assert.strictEqual(val$, 500);
		})

		it('alias', function() {
			projection('b', 'a', p_);

			assert(_.isUndefined(p_.get('a')));
			assert.strictEqual(p_.get('b'), 500);
		})

		/**
		 * WIP: see projection comments
		 */
		it.skip('alias actor', function() {
			const spec = {
				source: 'a',
				actor: 'john'
			}
			
			projection('b', spec, p_);

			assert(_.isUndefined(p_.get('a')));
			assert(_.isUndefined(p_.get('b')));
			assert.strictEqual(p_.get('b', 'john'), 500);
		})

		it('map', function() {
			const spec = {
				map: a$ => a$ + 200
			}
			
			projection('a', spec, p_);

			assert.strictEqual(p_.get('a'), 700);
		})

		it('map condensed', function() {
			projection('a', a$ => a$ + 100, p_);

			assert.strictEqual(p_.get('a'), 600);
		})

		it('map other', function() {
			const spec = {
				source: 'a',
				map: a$ => a$ + 200
			}
			
			projection('b', spec, p_);

			assert(_.isUndefined(p_.get('a')));
			assert.strictEqual(p_.get('b'), 700);
		})

		it('reduce', function() {
			const spec = {
				source: ['a', 'n'],
				reduce: ({ a, n }) => a -n
			}
			
			projection('b', spec, p_);

			assert(_.isUndefined(p_.get('a')));
			assert.strictEqual(p_.get('b'), 200);
		})
	})

	describe('base cases', function() {
		beforeEach(function() {
			source_.set('a', 100);
		})

		it('no arguments', function() {
			const p_ = project()

			const p$ = p_.snapshot();

			assert.deepStrictEqual(p$, {});
		})

		it('source only', function() {
			const p_ = project(source_)

			const p$ = p_.snapshot();

			assert.deepStrictEqual(p$, {});
		})

		it('blank model', function() {
			const p_ = project(source_, {})

			const p$ = p_.snapshot();

			assert.deepStrictEqual(p$, {});
		})

		it('extension only', function() {
			const p_ = project(null, null, Extension)

			assert.strictEqual(p_.message, 'gello!');

			const p$ = p_.snapshot();
			assert.deepStrictEqual(p$, {});
		})
	})

	describe('simple', function() {
		beforeEach(function() {
			source_.set('a', 100);
			source_.set('b', 200);
			source_.set('c', 300);
			source_.set('d', 400);

			model.projections = {}
		})
		
		it('works', function() {
			const foo = {
				projections: {
					g: {
						source: ['h', 'i', 'j'],
						reduce: ({ h, i, j}) => {},
						actor: 'john'
					}
				}
			}

			model.projections.a = true;
			model.projections.m = 'b';
			model.projections.n = { source: 'c' };
			model.projections.d = d => d + 500
			model.projections.p = {
				source: 'd',
				f: d => d + 50
			}
			model.projections.s = {
				source: ['a', 'b', 'c'],
				f: ({ a, b, c }) => a+b+c
			}
		
			const p_ = project(source_, model);

			const p$ = p_.snapshot();

			const expected$ = {
				a: 100,
				d: 900,
				m: 200,
				n: 300,
				p: 450,
				s: 600
			}

			assert.deepStrictEqual(p$, expected$);
		})
	})

	it('with additional attributes', function() {
		source_.set('a', 100);
		source_.set('d', 400);

		model.projections = {
			g: 'd'
		}

		model.attributes = {
			h: {
				default: 200
			}
		}

		const p_ = project(source_, model);
		const p$ = p_.snapshot();

		const expected$ = {
			g: 400,
			h: 200
		}
		assert.deepStrictEqual(p$, expected$);
	});

	it('edge case: projection attributes only', function() {
		source_.set('a', 100);
		source_.set('b', 200);
		source_.set('c', 300);
		source_.set('d', 400);

		model.projections = ['d', 'b']

		const p_ = project(source_, model);
		const p$ = p_.snapshot();

		const expected$ = {
			b: 200,
			d: 400
		}
		assert.deepStrictEqual(p$, expected$);
	});

	describe('model inheritence', function() {
		let base;

		beforeEach(function() {
			source_.set('a', 100);
			source_.set('b', 200);
			source_.set('c', 300);
			source_.set('d', 400);

			base = {
				projections: {
					a: true,
					f: {
						source: ['c', 'd'],
						reduce: ({ c, d }) => c - d
					}
				}
			}

			model.extends = base;
			model.projections = {
				g: 'c'
			}
		})

		it('projects from extended model', function() {
			const p_ = project(source_, model);
			const p$ = p_.snapshot();
	
			const expected$ = {
				a: 100,
				f: -100,
				g: 300
			}
			assert.deepStrictEqual(p$, expected$);
		})
	})
})
