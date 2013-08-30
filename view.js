/**
 * view.js
 * AMD view! plugin.
 *
 * @version 0.2.1
 * @author Denis Sikuler
 * @license MIT License (c) 2012-2013 Copyright Denis Sikuler
 */
(function () {
"use strict";

/*
 * 
    AMD view! plugin
   
    This plugin loads text/html file using `text!` plugin,
    parses and processes dependency directives (tags) that are found in the file content,
    removes/replaces them in the content and loads the specified dependencies before returning result.
    The "refined" file content will be returned as resource value.
    
    Dependency directive is `<link>` tag that can have one of the following forms (parts in square brackets are optional):
    * `<link rel="stylesheet" href="[plugin!]path/to/some/style.css">` - specifies CSS-file that should be loaded along with resource;
        CSS-files can be loaded by `css!` or `link!` plugin; the plugin that should be used by default can be set in configuration settings.
    * `<link rel="x-require" [type="plugin"] href="[plugin!]path/to/some/dependency">` - specifies dependency that should be loaded along with resource;
        `plugin` that should be used for resource loading can be set in `type` attribute or inside the resource name.
    * `<link rel="x-include" [type="plugin"] href="[plugin!]path/to/some/inclusion.html" [data-param="value"]>` - specifies inclusion that should be inserted 
        inside the resource content instead of the directive; `plugin` that should be used for resource loading can be set in `type` attribute or inside the resource name;
        the default plugin can be specified in configuration settings.
    
    The following directives are equal (supposed that `css!` is the default plugin for CSS-files loading):
    ```html
    <link rel="stylesheet" href="path/to/some/style.css">
    <link rel="stylesheet" href="css!path/to/some/style.css">
    <link rel="x-require" href="css!path/to/some/style.css">
    <link rel="x-require" type="css" href="path/to/some/style.css">
    ```
    
    ## Inclusions
    
    Inclusions allows composing the result from different parts which can be customized before injection.
    Inclusion directive has the following form (parts in square brackets are optional):
    `<link rel="x-include" [type="plugin"] href="[plugin!]path/to/some/inclusion.html" [data-param1="value1" data-param2="value2" ...]>`
    
    The resource that is specified inside the inclusion directive can result to plain text, a function or an object with `execute` method. 
    In case of function/method the function/method will be called and the returned value will be used as the substitute for the directive.
    
    `data-` attributes can be set inside the directive. They form special `data` object that will be passed into the inclusion resource function.
    Fields of `data` object are attributes names (without `data-` prefix), values are corresponding attributes values.
    For the directive above, the `data` object will be the following:
    
        {
            param1: "value1",
            param2: "value2",
            ...
        }
    
    
    ## Configuration
    
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
                 object's fields are inclusion names, field values are objects describing corresponding inclusions (see `processTag` for details).
    * `processTag` - Function - No - function that should be used to process a tag found during parsing;
         the function takes 3 parameters: the tag text, the object representing tag attributes and 
         the settings object; the function should return an object with the following fields:
         + `dependency` - Array, String, null - a dependency or a list of dependencies
                 that is corresponding to the tag.
         + `inclusion` - Object, null - an optional field indicating that the dependency's content should be included into the resource's content;
                 the field's value is the object with the following fields (name - type - description):
                 - `data` - `Object, undefined` - data that should be used to process the inclusion (optional field);
                         data fields can be set in `data-` attributes of the inclusion tag;
                         the found attributes form contents of `data` object:
                         fields are attributes names (without `data-` prefix), values are corresponding attributes values
                 - `name` - `String` - the name of inclusion
         + `text` - String - a tag text after processing; the text will substitute for the original text.
    
    Some configuration settings can be defined in resource name in the following format:
    
    `
    name=value[;name=value...]
    `
    
    ## Dependencies
    
    * `text`, `css` and `link` plugins
    * utility modules from `util` subdirectory
    
    ## Usage
    
    ```javascript
    // loads some/folder/view.html
    define(['view!some/folder/view.html'], {});
    
    // loads some/folder/view.html (supposed that 'html' is set as default extension)
    // and uses link plugin to load found CSS-files
    define(['view!some/folder/view!cssLoader=link'], {});
    ```
 *
 */


    var 
        // Default configuration
        defaultConfig = {
            cssLoader: "css",
            defaultExt: "html",
            defaultInclusionExt: "html",
            inclusionLoader: "view"
        },
        // Regular expression to check plugin prefix
        pluginRegExp = /^\w+!/,
        // Beginning and ending of inclusion directive
        sInclusionStart = '<link rel="x-include" href="',
        sInclusionEnd = '">';

    /**
     * Converts setting values to the appropriate type that is determined on data from default configuration.
     * 
     * @param {Object} settings
     *      Settings map to process. Keys are setting names, values - corresponding values.
     * @return {Object}
     *      Processed settings map.
     */
    function convertSettings(settings) {
        var defaultValues = defaultConfig,
            sName, sType, value;
        for (sName in settings) {
            if (sName in defaultValues) {
                sType = typeof defaultValues[sName];
                value = settings[sName];
                if (sType !== typeof value) {
                    switch (sType) {
                        case "number":
                            settings[sName] = Number(value);
                            break;
                        case "boolean":
                            settings[sName] = ! (value === "false" || value === 0);
                            break;
                    }
                }
            }
        }
        return settings;
    }

    /**
     * Determines whether a tag is useful and defines a dependency or the tag should be simply deleted.
     * 
     * @param {String} sTagText
     *      The entire tag's text (html) to process.
     * @param {Object} attrMap
     *      Represents tag attributes. Keys are attribute names, values - corresponding values.
     * @param {Object} settings
     *      Processing settings/configuration. See {@link #parse}.
     * @return {Boolean}
     *      <code>true</code> if the tag is useful, <code>false</code> if the tag should be deleted.
     */
    defaultConfig.filterTag = function(sTagText, attrMap, settings) {
        var sType = attrMap.rel ? attrMap.rel.toLowerCase() : null;
        return sType && attrMap.href &&
                (sType === "stylesheet" || sType === "x-include" || sType === "x-require");
    };

    /**
     * Processes a tag found during parsing and returns object that describes action
     * that should be taken upon this tag. 
     * 
     * @param {String} sTagText
     *      The entire tag's text (html) to process.
     * @param {Object} attrMap
     *      Represents tag attributes. Keys are attribute names, values - corresponding values.
     * @param {Object} settings
     *      Processing settings/configuration. See {@link #parse}.
     * @return {Object}
     *      Processing result. The object has the following fields (name - type - description):
     *      <ul>
     *      <li>dependency - Array, String, null - a dependency or a list of dependencies
     *              that is corresponding to the tag.
     *      <li>inclusion - Object, null - an optional field indicating that the dependency's content should be included into the resource's content;
     *              the field's value is the object with the following fields (name - type - description):
     *              <ul>
     *              <li><code>data</code> - <code>Object, undefined</code> - data that should be used to process the inclusion (optional field);
     *                  data fields can be set in <code>data-</code> attributes of the inclusion tag;
     *                  the found attributes form contents of <code>data</code> object:
     *                  fields are attributes names (without <code>data-</code> prefix), values are corresponding attributes values
     *              <li><code>name</code> - <code>String</code> - the name of inclusion
     *              </ul>
     *      <li>text - String - tag text after processing; will substitute for the original text
     *              in parsed resource; should be empty to delete the tag from resource.
     *      </ul>
     */
    defaultConfig.processTag = function(sTagText, attrMap, settings) {
        var result = {dependency: null, inclusion: null, text: ""},
            data, sName, sType;
        if (settings.filterTag(sTagText, attrMap, settings)) {
            sName = attrMap.href;
            sType = attrMap.rel.toLowerCase();
            // CSS
            if (sType === "stylesheet") {
                result.dependency = sName.indexOf("css!") === 0 || sName.indexOf("link!") === 0
                                    ? sName 
                                    : settings.cssLoader + "!" + sName;
            }
            // Inclusion
            else if (sType === "x-include") {
                if (! pluginRegExp.test(sName)) {
                    sName = (attrMap.type || settings.inclusionLoader) + "!" + sName;
                }
                sName = settings.api.util.base.nameWithExt(sName, settings.defaultInclusionExt);
                result.dependency = sName;
                result.text = sInclusionStart + sName + sInclusionEnd;
                result.inclusion = {name: sName};
                // Save values of data- attributes
                for (sName in attrMap) {
                    if (sName.substring(0, 5) === "data-") {
                        (data || (data = {}))[sName.substring(5)] = attrMap[sName];
                    }
                }
                if (data) {
                    result.inclusion.data = data;
                }
            }
            // Dependency
            else if (sType === "x-require") {
                if (attrMap.type && ! pluginRegExp.test(sName)) {
                    sName = attrMap.type + "!" + sName;
                }
                result.dependency = sName;
            }
        }
        return result;
    };
    
    define(["./util/base", "./util/object", "./util/string"], function(basicUtil, objUtil, strUtil) {
    
        /**
         * Parses the given text and searches for &lt;link&gt; tags that are related to dependency directives.
         * Found tags are removed from the text, extracted resource names form dependency list. 
         * 
         * @param {String} sText
         *      Text to process.
         * @param {Object} settings
         *      Processing settings/configuration. Besides settings the object contains 'api' field
         *      that represents the module API.
         * @return {Object}
         *      Parsing result. The object has the following fields (name - type - description):
         *      <ul>
         *      <li>resource - String - text after processing.
         *      <li>depList - Array - list of found dependencies.
         *      <li>inclusionMap - Object, null - an optional field that is describing dependencies that should be included into the resource's content;
         *              object's fields are inclusion names, field values are objects describing corresponding inclusions (see <code>processTag</code> for details).
         *      </ul>
         */
        defaultConfig.parse = function(sText, settings) {
            var sStart = "<link ",
                sEnd = ">",
                nI = sText.indexOf(sStart),
                nStartLen = sStart.length,
                nEndLen = sEnd.length,
                deps = [],
                depMap = {},
                inclusionMap = null, 
                dependency, nK, nL, nN, sDepName, sTag, tagResult;
            while (nI > -1) {
                nK = sText.indexOf(sEnd, nI + nStartLen);
                if (nK > -1) {
                    if (nK) {
                        nK += nEndLen;
                        sTag = sText.substring(nI, nK);
                        tagResult = settings.processTag(sTag, 
                                                        strUtil.extractAttributes(
                                                            sTag.substring(nStartLen, sTag.length - nEndLen) ), 
                                                        settings);
                        // Analyze tag's processing result
                        if (tagResult) {
                            // Inclusion
                            if (dependency = tagResult.inclusion) {
                                if (! inclusionMap) {
                                    inclusionMap = {};
                                }
                                if (! (dependency.name in inclusionMap)) {
                                    inclusionMap[dependency.name] = dependency;
                                }
                            }
                            // Dependency
                            if (dependency = tagResult.dependency) {
                                if (typeof dependency === "string") {
                                    dependency = [dependency];
                                }
                                for (nN = 0, nL = dependency.length; nN < nL; nN++) {
                                    sDepName = dependency[nN];
                                    // Skip dependency that is already added
                                    if (! (sDepName in depMap)) {
                                        deps.push(sDepName);
                                        depMap[sDepName] = null;
                                    }
                                }
                            }
                            // Tag replacement
                            if (tagResult.text !== sTag) {
                                sText = sText.substring(0, nI) + tagResult.text + sText.substring(nK);
                            }
                            else {
                                nI = nK;
                            }
                        }
                        else {
                            nI = nK;
                        }
                    }
                    else {
                        nI = nK + nEndLen;
                    }
                    nI = sText.indexOf(sStart, nI);
                }
                // There are no more tags that should be processed
                else {
                    break;
                }
            }
            return {
                resource: sText,
                depList: deps,
                inclusionMap: inclusionMap
            };
        };
        
        return {
        
            // Auxiliary API
            
            "convertSettings": convertSettings,
            
            "filterTag": defaultConfig.filterTag,
            
            "processTag": defaultConfig.processTag,
            
            "parse": defaultConfig.parse,
            
            "util": {
                base: basicUtil,
                object: objUtil,
                string: strUtil
            },
            
            // Plugin API
    
            "load": function(sResourceName, require, callback, config) {
                var nI = sResourceName.indexOf("!"),
                    mix = objUtil.mix,
                    conf, settings;
                // Prepare operation settings
                if (nI > -1) {
                    settings = convertSettings( strUtil.extractSettings(sResourceName.substring(nI + 1)) );
                    sResourceName = sResourceName.substring(0, nI);
                }
                conf = mix({}, defaultConfig, config, settings);
                conf.api = mix({}, this);
                // Load and parse resource
                require(["text!" + require.toUrl( basicUtil.nameWithExt(sResourceName, conf.defaultExt) ), "require"], 
                    function(sText, req) {
                        var parseResult = conf.parse(sText, conf),
                            sText = (parseResult && typeof parseResult === "object" 
                                        ? parseResult.resource 
                                        : parseResult);
                        // Load dependencies
                        if (parseResult && parseResult.depList && parseResult.depList.length) {
                            req(["require"].concat(parseResult.depList), function(loader) {
                                var inclMap = parseResult.inclusionMap,
                                    inclData, nI, resource, sInclusion;
                                // Make inclusions
                                if (inclMap) {
                                    for (sInclusion in inclMap) {
                                        resource = loader( loader.toUrl(sInclusion) );
                                        inclData = inclMap[sInclusion].data;
                                        inclData = inclData
                                                    ? [inclData]
                                                    : [];
                                        if (typeof resource === "function") {
                                            resource = resource.apply(null, inclData);
                                        }
                                        else if (resource && typeof resource === "object" && typeof resource.execute === "function") {
                                            resource = resource.execute.apply(resource, inclData);
                                        }
                                        resource = String(resource);
                                        sInclusion = sInclusionStart + sInclusion + sInclusionEnd;
                                        nI = 0;
                                        while ((nI = sText.indexOf(sInclusion, nI)) > -1) {
                                            sText = sText.replace(sInclusion, resource);
                                        }
                                    }
                                }
                                // Return resource content
                                callback(sText);
                            });
                        }
                        else {
                            callback(sText);
                        }
                });
            }
    
        };
    
    });

})();
