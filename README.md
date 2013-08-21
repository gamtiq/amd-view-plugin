`view!` plugin for [cujojs/curl loader](https://github.com/cujojs/curl)

This plugin loads text/html file using `text!` plugin,
parses and processes dependency directives (tags) that are found in the file content,
removes/replaces them in the content and loads the specified dependencies before returning result.
The "refined" file content will be returned as resource value.

Dependency directive is `<link>` tag that can have one of the following forms (parts in square brackets are optional):
* `<link rel="stylesheet" href="[plugin!]path/to/some/style.css">` - specifies CSS-file that should be loaded along with resource;
    CSS-files can be loaded by `css!` or `link!` plugin; the plugin that should be used by default can be set in configuration settings.
* `<link rel="x-require" [type="plugin"] href="[plugin!]path/to/some/dependency">` - specifies dependency that should be loaded along with resource;
    `plugin` that should be used for resource loading can be set in type attribute or inside the resource name.
* `<link rel="x-include" [type="plugin"] href="[plugin!]path/to/some/inclusion.html">` - specifies inclusion that should be inserted inside the resource content instead of the directive;
    `plugin` that should be used for resource loading can be set in type attribute or inside the resource name;
    the default plugin can be specified in configuration settings.

The following directives are equal (supposed that `css!` is the default plugin for CSS-files loading):
```html
<link rel="stylesheet" href="path/to/some/style.css">
<link rel="stylesheet" href="css!path/to/some/style.css">
<link rel="x-require" href="css!path/to/some/style.css">
<link rel="x-require" type="css" href="path/to/some/style.css">
```


Configuration
=============

The following configuration settings are supported (name - type - can it be set in resource name? - description):

* `cssLoader` - String - Yes - name of plugin (`'css'` or `'link'`) that should be used to load a CSS-file 
     when loader is not specified in resource name; the default value is `'css'`
* `defaultExt` - String - Yes - default file extension that is used if it is not specified in resource name;
     the default value is `'html'`
* `defaultInclusionExt` - String - Yes - default file extension for inclusions that will be inserted into result;
     the default value is `'html'`
* `filterTag` - Function - No - function that should be used to determine whether a tag is useful 
     and defines a dependency or the tag should be simply deleted;
     the function should return true for a useful tag and false for a tag that should be deleted.
* `parse` - Function - No - function that should be used to parse the loaded text;
     the function takes two parameters: the text and the settings object;
     the function should return an object with the following fields:
     + `resource` - String - text after processing.
     + `depList` - Array - list of found dependencies.
     + `inclusionMap` - Object - an optional field that is describing dependencies that should be included into the resource's content;
             object's fields are inclusion names, field values are not used.
* `processTag` - Function - No - function that should be used to process a tag found during parsing;
     the function takes 3 parameters: the tag text, the object representing tag attributes and 
     the settings object; the function should return an object with the following fields:
     + `dependency` - Array, String, null - a dependency or a list of dependencies
             that is corresponding to the tag.
     + `inclusion` - String, null - an optional field indicating that the dependency's content should be included into the resource's content;
             the field's value is the name of inclusion's resource.
     + `text` - String - a tag text after processing; the text will substitute for the original text.

Some configuration settings can be defined in resource name in the following format:

`
name=value[;name=value...]
`

Dependencies
============

* `text`, `css` and `link` plugins
* utility modules from `util` subdirectory

Usage
=====

```javascript
// loads some/folder/view.html
define(['view!some/folder/view.html'], {});

// loads some/folder/view.html (supposed that 'html' is set as default extension)
// and uses link plugin to load found CSS-files
define(['view!some/folder/view!cssLoader=link'], {});
```

Licence
=====

MIT
