const assert = require('assert');

const { State } = require('gell');
const { all } = require('gell/state/materialize');

function stateValue(val$, type) {
	if (type && val$ === undefined) {
		const { default: d } = type;

		if (typeof d === 'function') {
			// NOTE: only generate the default value once
			let default$;
			return function(actor) {
				if (default$ === undefined) default$ = d.bind(this)(actor);

				return default$;
			}
		}

		return d;
	}

	return val$;
}

function attribute(attr, spec, image$, types={}) {
	switch(typeof spec) {
		case 'string':
			var name = attr || spec;
			var type = types[spec];
			// var value = types[spec];
			break;
		case 'boolean':
			var name = attr;
			break;
		case 'function':
			var name = attr;
			var derived = spec;
			break;
		case 'object':
			var name = spec.name || attr;
			var type = spec.type ? types[spec.type] || spec : spec;
			var derived = spec.derive;
			var { actor } = spec;
	}

	assert(typeof name === 'string', spec);

	const value = derived || stateValue(image$[name], type);

	return { name, value, actor }
}

/**
 * Merge an image into a State according to a model
 * 
 * @param {*} image$ 
 * @param {*} s_ 
 * @param {*} model 
 */
function merge(image$={}, s_, model, recurse=true) {
	const { types, attributes=[] } = model;

	const { extends: xtends } = model;

	if (xtends && recurse) {
		if (Array.isArray(xtends)) {
			if (xtends.length > 1) throw new Error('NYI');

			var base = xtends[0];
		}
		else var base = xtends;

		merge(image$, s_, base);
	}

	if (Array.isArray(attributes)) {
		attributes.forEach(spec => {
			if (typeof spec === 'string') var attr = spec;

			const { name, value, actor } = attribute(attr, spec, image$, types);
	
			if (typeof value === 'function') s_.derive(name, value, actor);
			else s_.set(name, value, actor);
		})
	} else {
		Object.entries(attributes).forEach(([key, spec]) => {
			const { name, value, actor } = attribute(key, spec, image$, types);
	
			// s_.set(name, value);
			if (typeof value === 'function') s_.derive(name, value, actor);
			else s_.set(name, value, actor);
		})
	}

	return s_;
}

function classFromModel(model) {
	const { class: klass, extends: xtends } = model;

	if (klass) return klass;

	if (xtends) {
		if (Array.isArray(xtends)) {
			if (xtends.length > 1) throw new Error('NYI');

			return classFromModel(xtends[0]);
		}
		else return classFromModel(xtends);
	}

	return State;
}

/**
 * Materialize State from an optional image using domain model
 * 
 * @param {*} image$ 
 * @param {*} model 
 * @param {*} extension 
 * @returns 
 */
function javascript(image$={}, model, extension) {
	if (!model) return all(image$);

	const klass = extension || classFromModel(model);

	/**
	 * WIP: type checking here doesn't not work across packages for some reason
	else if (klass === State || klass.prototype instanceof State) var s_ = new klass();
	else throw new Error(`class (prototype=${klass.prototype}) does not extend State`);
	 */

	const s_ = new klass();

	merge(image$, s_, model);

	return s_;
}

/**
 * WIP: starting in earnest to work on domain modeling
 * 	- projections
 * 	- validations
 * 	- workflow
 * 		- statuses
 * 		- transitions
 * 	- metrics
 * 		- context
 * 	- attribute types
 * 	- somehow augment with other metadata
 * 		- toolbox attributes
 */

module.exports = {
	stateValue,
	attribute,
	materialize: javascript,
	merge
}