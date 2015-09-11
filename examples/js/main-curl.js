curl.config({
    packages: {
        "view": {
            location: "..",
            main: "view"
        }
    },
    pluginPath: "lib",
    plugins: {
        "view": {
            defaultExt: "view",
            defaultInclusionExt: "inc",
            directiveTag: ["link", "x-use"],
            inclusionLoader: "text",
            access: true
        }
    }
});

var config = {
    ignorePart: false
};

curl(["view"], function(viewPlugin) {
    viewPlugin.reconfig.filterTag = function(sTagText, attrMap, settings) {
        var bProcess = viewPlugin.filterTag.apply(null, arguments);
        if (bProcess && attrMap.href.indexOf("html/part") === 0 && config.ignorePart) {
            bProcess = false;
        }
        return bProcess;
    };
})
.next(["js/appendElem", "view!html/main"], function(appendElem, view) {
    appendElem(view);
});
