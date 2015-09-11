### 0.4.2 / 2015-09-11

* added ability to dynamically redefine default values of configuration settings (`reconfig` field in the plugin's API object)

### 0.4.1 / 2015-08-07

* added `dontAddFileExt` configuration setting

### 0.4.0 / 2014-08-10

* added ability to use specified tags as dependency directives (not only `<link>` tags)
* added ability to use shorter values for `rel` attributes (`css` instead of `stylesheet`, `include` instead of `x-include`
and `require` instead of `x-require`)

### 0.3.0 / 2014-06-29

* added ability to make inclusion depending on condition
* added examples

### 0.2.2 / 2014-01-18

* adaptation for require.js

### 0.2.1 / 2013-08-30

* included resources can be functions or objects with `execute` method
* added ability to customize inclusion by using `data-` attributes and functional inclusions

### 0.2.0 / 2013-08-21

* added support for `x-include` and `x-require` dependency directives
* utility functions are moved into separate modules inside `util` subdirectory
