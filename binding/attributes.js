const assert = require('assert');

exports.alias = name => {
	assert(typeof name === 'string');

	return function(actor) {
		return this.snapshotAttribute(name, actor);
	}
}
