# gell domain modeling

## Attributes

* can be either array or map of attribute definitions

### Spec

* `name`: name of the attribute
* `type`: type of the attribute value
* `description`: metadata describing attribute purpose
* `default`: constant or derived (function) value assigned to attribute during materialize if image does not specify
* `derive`: function to derive the value of the attribute
* `label`: name of the attribute to be used in UIs

### Proposed/Non-Standard Spec

_these properties have not been finalized_

* `editable`: whether or not the attribute can be modified externally (i.e. by an end user)
    * as opposed to an internally/system derived value like `id` and `type`
    * want this property to be explicitly defined so that attributes are "non-editable" by default