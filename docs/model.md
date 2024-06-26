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