require.config({
    baseUrl: ".",
    packages: [
        {
            name: "view",
            location: "..",
            main: "view"
        }
    ],
    paths: {
        "css": "lib/css",
        "text": "lib/text"
    },
    config: {
        "view/view": {
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

require(["view"], function(viewPlugin) {
    viewPlugin.reconfig.filterTag = function(sTagText, attrMap, settings) {
        var bProcess = viewPlugin.filterTag.apply(null, arguments);
        if (bProcess && attrMap.href.indexOf("html/part") === 0 && config.ignorePart) {
            bProcess = false;
        }
        return bProcess;
    };
    
    require(["js/appendElem", "view!html/main"], function(appendElem, view) {
        appendElem(view);
    });
});
