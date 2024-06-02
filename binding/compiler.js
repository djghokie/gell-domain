const assert = require('assert');

const { v4: uuid } = require('uuid');

const { State } = require('gell');

function deriveName(model, hierarchy) {
    if (model.name) return model.name;

    return `${hierarchy.name} extension`;
}

/**
 * Compiles an attribute spec
 * 
 * WIP: pre-defined types not yet supported
 * 
 * WIP: attribute default should be a descriptor
    {
        type: 'string',
        value: 'static value',
        derive: z => ...
    }
 * 
 * @param {*} attr 
 * @param {*} spec 
 * @param {*} types 
 * @returns 
 */
function attribute(attr, spec, types={}) {
    // assert(spec, 'attribute spec is required');

	switch(typeof spec) {
		case 'string':
			var name = attr || spec;
			if (attr) var typeName = spec;
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
			// var type = spec.type ? types[spec.type] || spec : spec;
			var typeName = spec.type;
			var derived = spec.derive;
			var { actor, default: dfault } = spec;
			break;
        default:
            var name = attr;
	}

	assert(typeof name === 'string', spec);

    const compiled = { name };
    // if (typeName) compiled.type = types[typeName] || typeName;  // WIP: predefined types not yet supported
    if (typeName !== undefined) compiled.type = typeName;
    if (actor !== undefined) compiled.actor = actor;
    if (dfault !== undefined) compiled.default = dfault;

    // const dfault = _.isFunction(a.default) ? 'derived' : (a.default || 'undefined');

	return compiled;
}

/**
 * Compiles model attributes, optionally recursing through the model hierarchy
 * 
 * WIP: return array or map here?
 *  - map allows for easier overridding of inherited attributes
 * 
 * @param {*} model 
 * @param {*} recurse 
 * @returns 
 */
function compileAttributes(model, recurse=true) {
	const { types, attributes=[] } = model;

	const { extends: xtends } = model;

	if (xtends && recurse) {
		if (Array.isArray(xtends)) {
			if (xtends.length > 1) throw new Error('NYI');

			var base = xtends[0];
		}
		else var base = xtends;

        var compiled = compileAttributes(base);
	}
    else var compiled = {};

	if (Array.isArray(attributes)) {
        attributes.forEach(spec => {
            // compiled.push(spec);
			if (typeof spec === 'string') var attr = spec;

            // compiled.push(attribute(attr, spec, types));

            const ca = attribute(null, spec, types);

            compiled[ca.name] = ca;
	
			// if (typeof value === 'function') s_.derive(name, value, actor);
			// else compiled.push({ name, actor });
		})
	} else {
        Object.entries(attributes).forEach(([key, spec]) => {
            const ca = attribute(key, spec, types);

            compiled[ca.name] = ca;

            // compiled.push(attribute(key, spec, types));
            
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
        attributes: Object.values(compileAttributes(model))
    };

    model$$.class = extension || classFromModel(model);

    return model$$;
}

function hierarchy(model={}) {}

/**
 * Describes a javascript-based domain model
 * 
 * "describing" produces serializable metadata about the model
 * 
 * WIP: domain model browser is driving this implementation
 *  - should describe class hierarchy eventually
 *  - "id" is needed to uniquely identify models in a domain
 *      - could potentially be a "full qualified name"
 * 
 * @param {*} model 
 * @returns 
 */
function describe(model={}) {
    const classHierarchy = hierarchy(model);

    const klass = classFromModel(model);

    const klass$$ = {
        name: klass.name
    }

    const attr = Object.values(compileAttributes(model));

    return {
        id: model.id || uuid(),
        name: deriveName(model, klass$$),
        class: klass$$,
        attributes: attr.map(a => {
            if (typeof a.default === 'function') a.default = 'derived';

            return a;
        })
    }
}

module.exports = {
	attribute,
	compile: javascript,
    describe
}
