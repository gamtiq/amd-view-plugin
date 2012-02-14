view! plugin for [cujojs/curl loader](https://github.com/cujojs/curl)

This plugin loads text/html file using `text!` plugin,
searches for <link> tags related to style sheets in the file content, 
removes them from the content and loads found CSS-files as dependencies.
The "refined" file content returned as resource value.
CSS-files can be loaded by `css!` (by default) or `link!` plugin.

Configuration
=============

Configuration settings (name - type - can it be set in resource name? - description):

* `cssLoader` - String - Yes - name of plugin ('css' or 'link') that should be used to load a CSS-file 
     when loader is not specified in resource name
* `defaultExt` - String - Yes - default file extension that is used if it is not specified in resource name
* `filterTag` - Function - No - function that should be used to determine whether a tag is useful 
     and defines a dependency or the tag should be simply deleted;
     the function should return true for a useful tag and false for a tag that should be deleted.
* `parse` - Function - No - function that should be used to parse the loaded text;
     the function takes two parameters: the text and the settings object;
     the function should return an object with the following fields:
     + `resource` - String - text after processing.
     + `depList` - Array - list of found dependencies.
* `processTag` - Function - No - function that should be used to process a tag found during parsing;
     the function takes 3 parameters: the tag text, the object representing tag attributes and 
     the settings object; the function should return an object with the following fields:
     + `dependency` - Array, String, null - a dependency or a list of dependencies
             that is corresponding to the tag.
     + `text` - String - a tag text after processing; the text will substitute for the original text.

Some configuration settings can be defined in resource name in the following format:
`
name=value[;name=value...]
`

Dependencies
============

text, css and link plugins.

Usage
=====

```javascript
// loads some/folder/view.html
define(['view!some/folder/view.html'], {});

// loads some/folder/view.html (assuming that 'html' is set as default extension)
// and uses link plugin to load found CSS-files
define(['view!some/folder/view!cssLoader=link'], {});
```
