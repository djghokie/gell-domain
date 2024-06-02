const assert = require('assert');

const { State } = require('gell');

function attributes_(model) {
    const keys = Object.keys(model);

    keys.sort((k1, k2) => k1.localeCompare(k2));

    return keys.map(k => {
        const a = model[k];

        const dfault = _.isFunction(a.default) ? 'derived' : (a.default || 'undefined');

        return {
            id: k,
            name: k,
            type: a.type || 'unknown',
            default: dfault
        }
    })
}

function build(id, def) {
    return {
        id,
        name: def.name || id,
        description: def.description || 'no description',
        attributes: attributes(def.attributes)
    }
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

    const compiled = { name };

    if (actor !== undefined) compiled.actor = actor;

	return compiled;
}

function attributes(model, recurse=true) {
	const { types, attributes=[] } = model;

	const { extends: xtends } = model;

    const compiled = [];

    /*
	if (xtends && recurse) {
		if (Array.isArray(xtends)) {
			if (xtends.length > 1) throw new Error('NYI');

			var base = xtends[0];
		}
		else var base = xtends;

		merge(image$, s_, base);
	}
    */

	if (Array.isArray(attributes)) {
        attributes.forEach(spec => {
            // compiled.push(spec);
			if (typeof spec === 'string') var attr = spec;

            compiled.push(attribute(attr, spec, types));
	
			// if (typeof value === 'function') s_.derive(name, value, actor);
			// else compiled.push({ name, actor });
		})
	} else {
        Object.entries(attributes).forEach(([key, spec]) => {
            compiled.push(attribute(key, spec, types));
            
			// if (typeof value === 'function') s_.derive(name, value, actor);
			// else compiled.push({ name, actor });
		})
	}

    return compiled;
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
 * Compile a javascript-based domain model
 * 
 * WIP: what should the output format be?
 *  - could be a State
 *      - perspective for "descriptor"
 *      - projections i.e. "all", "inherited", etc
 * 
 * @param {*} model 
 * @param {*} extension 
 */
function javascript(model={}, extension) {
    const model$$ = {
        attributes: attributes(model)
    };

    model$$.class = extension || classFromModel(model);;

    return model$$;
}

module.exports = {
	// stateValue,
	// attribute,
	// projection,
	compile: javascript,
	// project
}
