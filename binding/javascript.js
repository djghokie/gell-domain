const assert = require('assert');

const { State } = require('gell');
const Projection = require('gell/lib/projection');
const { all } = require('gell/state/materialize');

const compiler = require('./compiler');

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
 * Projects a source attribute according to a spec
 * 
 * NOTE: for map and reduce specs, "f" can refer to mapping function in addition to "map" and "reduce"
 * 
 * WIP: not currently supported
 * 	- Projection.project
 * 		- if this is needed, function spec could be used (currently maps)
 * 
 * WIP: unclear how to project with actor
 * 	- if spec is supplied with actor, that should probably refer to source state
 * 		- not currenly possible
 * 	- not sure if Projection is implemented to handle these different scenarios
 * 
 * @param {*} attr 
 * @param {*} spec 
 * @param {*} p_ 
 * @returns 
 */
function projection(attr, spec, p_) {
	assert(typeof attr === 'string', attr);

	if (spec === undefined || typeof spec === 'boolean') {
		p_.reflect(attr);

		return p_;
	}

	switch(typeof spec) {
		case 'string':
			p_.alias(spec, attr);
			return p_;
		case 'function':
			p_.map(attr, spec);
			return p_;
		case 'object':
			const { source=attr, map, reduce, f, actor } = spec;

			if (Array.isArray(spec.source)) {
				p_.reduce(attr, reduce || f, ...spec.source);
			}
			else {
				if (map || f) p_.map(source, map || f, attr);
				else p_.alias(source, attr, actor);
			}
			return p_;
		}
}

/**
 * Merge an image into a State according to a model
 * 
 * WIP: defect still exists (as of 0.1.2) here related to derived attributes
 * 	- State.derive should not be called
 * 	- derives the value as part of the materialize process
 * 		- instead of the resulting State snapshot process
 * 
 * @param {*} image$ 
 * @param {*} s_ 
 * @param {*} model 
 */
function merge_legacy(image$={}, s_, model, recurse=true) {
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
	
			// dont override with default if state already defines attribute
			if (image$[name] === undefined && s_.get(name, actor) !== undefined) return;

			if (typeof value === 'function') s_.derive(name, value, actor);
			else s_.set(name, value, actor);
		})
	} else {
		Object.entries(attributes).forEach(([key, spec]) => {
			const { name, value, actor } = attribute(key, spec, image$, types);

			// dont override with default if state already defines attribute
			if (image$[name] === undefined && s_.get(name, actor) !== undefined) return;

			if (typeof value === 'function') s_.derive(name, value, actor);
			else s_.set(name, value, actor);
		})
	}

	return s_;
}

/**
 * Merge an image into a State according to a model
 * 
 * NOTE: as of 0.1.2, merge uses a compiled model
 * 	- solves the issue of attributes overridding defaults in a base model
 * 	- ideally models would be compiled once
 * 		- currently model is compiled every time materialize is called
 * 		- not really any less efficient than before
 * 
 * WIP: recurse attribute not supported yet
 * 	- this is because compiler compiles attributes recursively currently
 * 	- flag may be added to compiler eventually
 * 
 * @param {*} image$ 
 * @param {*} s_ 
 * @param {*} model 
 * @param {*} recurse 
 */
function merge(image$={}, s_, model, recurse=true) {
	const model$$ = compiler.compile(model);

	const { types, attributes } = model$$;

	attributes.forEach(spec => {
		const { name, value, actor } = attribute(null, spec, image$, types);

		// dont override with default if state already defines attribute
		if (image$[name] === undefined && s_.get(name, actor) !== undefined) return;

		s_.set(name, value, actor);
	})
}

function doProject(p_, model, recurse=true) {
	const { projections=[] } = model;

	const { extends: xtends } = model;

	if (xtends && recurse) {
		if (Array.isArray(xtends)) {
			if (xtends.length > 1) throw new Error('NYI');

			var base = xtends[0];
		}
		else var base = xtends;

		doProject(p_, base);
	}

	if (Array.isArray(projections)) {
		projections.forEach(spec => {
			projection(spec, spec, p_);
		})
	} else {
		Object.entries(projections).forEach(([key, spec]) => {
			projection(key, spec, p_);
		})
	}

	return p_;
}

function classFromModel(model, def=State) {
	if (!model) return def;

	const { class: klass, extends: xtends } = model;

	if (klass) return klass;

	if (xtends) {
		if (Array.isArray(xtends)) {
			if (xtends.length > 1) throw new Error('NYI');

			return classFromModel(xtends[0], def);
		}
		else return classFromModel(xtends, def);
	}

	return def;
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
 * Materialize a Projection of a source State based on the supplied model
 * 
 * @param {*} source_ 
 * @param {*} model 
 * @param {*} extension 
 * @returns 
 */
function project(source_, model, extension) {
	const klass = extension || classFromModel(model, Projection);

	/**
	 * WIP: type checking here doesn't not work across packages for some reason
	else if (klass === State || klass.prototype instanceof State) var s_ = new klass();
	else throw new Error(`class (prototype=${klass.prototype}) does not extend State`);
	 */

	const p_ = new klass(source_);

	if (model) {
		doProject(p_, model);

		/**
		 * NOTE: merge in attributes
		 * 	- since there isn't an image, this only applies to defaulted attributes
		 * 	- doing this after projections in case there are new attribures derived from projected ones
		 * 		- no current use case for this approach
		 */
		merge({}, p_, model);
	}

	return p_;
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
	projection,
	materialize: javascript,
	merge,
	project
}