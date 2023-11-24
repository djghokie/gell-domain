const assert = require('assert');

const { State } = require('gell');
const { all } = require('gell/state/materialize');

function stateValue(val$, type) {
	if (type) {
		if (val$ === undefined) {
			const { default: d } = type;

			return typeof d === 'function' ? d() : d;
		}
		return val$;
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
		case 'object':
			var name = spec.name || attr;
			var type = spec.type ? types[spec.type] || spec : spec;
	}

	assert(typeof name === 'string', spec);

	const value = stateValue(image$[name], type);

	return { name, value }
}

function merge(image$, s_, model) {
	const { types, attributes=[] } = model;

	if (Array.isArray(attributes)) {
		attributes.forEach(spec => {
			if (typeof spec === 'string') var attr = spec;

			const { name, value } = attribute(attr, spec, image$, types);
	
			s_.set(name, value);
		})
	} else {
		Object.entries(attributes).forEach(([key, spec]) => {
			const { name, value } = attribute(key, spec, image$, types);
	
			s_.set(name, value);
		})
	}
}

function javascript(image$={}, model, extension=State) {
	if (!model) return all(image$);

	const { class: klass=extension, extends: xtends } = model;

	if (xtends) {
		if (Array.isArray(xtends)) {
			if (xtends.length > 1) throw new Error('NYI');

			var base = xtends[0];
		}
		else var base = xtends;

		var s_ = javascript(image$, base);
	} else {
		var s_ = new klass();
	}

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
	materialize: javascript
}