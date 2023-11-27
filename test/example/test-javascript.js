const assert = require('assert');
const _ = require('lodash');

const { State } = require('gell');

const javascript = require('../../binding/javascript');
const { alias } = require('../../binding/attributes');

class MyState extends State {
}

const inherited = {
	attributes: ['message']
}

/**
 * Example showing all possible ways to define a domain model with the javascript binding
 */
const model = {
	/**
	 * javascript class to construct; must extend State; will be ignored if "extends" is used
	 * 	- optional (State)
	 */
	class: MyState,

	/**
	 * models to extend; does not yet support multiple inheritence
	 * 	- optional
	 */
	extends: [inherited],

	/**
	 * named attributes defined by the domain; can be a map or array
	 */
	attributes: {
		/**
		 * defines attribute "a"
		 */
		a: true,

		k: {
			default: function(actor) {
				return this.snapshotAttribute('a');
			}
		},
		l: {
			default: alias('a')
		},
		m: {
			default: alias('a')
		}
	}
}

describe('javascript example', function() {
	it('works', function() {
		const image$ = {
			message: 'gello!',
			a: 100,

			m: 600,

			// will not materialize unknown attributes
			unknown: 'x'
		};

		const example_ = javascript.materialize(image$, model);

		// will work if extends not used
		// assert(example_ instanceof MyState);

		const example$ = example_.snapshot();
		// console.debug('######', example$);

		assert.deepStrictEqual(example$, {
			message: 'gello!',
			a: 100,
			k: 100,
			l: 100,
			m: 600,
		})
	})
})