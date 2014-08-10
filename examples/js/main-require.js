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

require(["js/appendElem", "view!html/main"], function(appendElem, view) {
    appendElem(view);
});
