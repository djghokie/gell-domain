const assert = require('assert');
const _ = require('lodash');

const { State } = require('gell');

function project(name, actor) {
	return this.projection(name).snapshot(actor);
}

function merger(model) {
	const { attributes={} } = model;

	return (s$, s_) => {
		Object.keys(attributes).forEach(name => {
			const def = attributes[name];
	
			if (_.isBoolean(def) || _.isString(def)) {}
			else {
				var { derive, default: defaultVal } = def;
			}
	
			if (derive) {
				s_.set(name, derive);
			} else {
				let val$ = s$[name];
				if (_.isUndefined(val$)) val$ = _.isFunction(defaultVal) ? defaultVal(s_) : defaultVal;

				s_.set(name, val$);
			}
		})
	}
}

/**
 * WIP: objectives
 * 	- make defining attributes easy
 * 		- especially at first when the domain is under active development
 * 
 * @param {*} s$ 
 * @param {*} klass 
 * @returns 
 */
function materializer(model) {
	return (s$={}, klass=State) => {
		const { extends: extended=[] } = model;

		if (extended.length > 0) {
			// WIP: eventually support extending from multiple domains
			var s_ = materializer(extended[0])(s$, klass);
		} else {
			var s_ = new klass();
		}

		merger(model)(s$, s_);

		s_.projection = function(name) {
			const { projections={} } = model;
	
			const def = projections[name];
			assert(def, `no projection (name=${name}) defined`);
			
			const isSimple = _.isArray(def);
			const attrs = isSimple ? def : Object.keys(def);
		
			const projection_ = new State();
			const source_ = this;
			attrs.forEach(sourceAttr => {
				const attr = isSimple ? sourceAttr : def[sourceAttr];

				if (_.isFunction(attr)) {
					// projection_.set(sourceAttr, attr);
					const val = (actor, s_) => {
						return attr(actor, this);
					}
					projection_.set(sourceAttr, val);
				} else {
					const val = (actor, s_) => source_.get(attr, actor);
					projection_.set(sourceAttr, val);
				}
			})
			
			return projection_;
		}

		s_.project = project;

		return s_;
	}
}

module.exports = {
	materializer
}