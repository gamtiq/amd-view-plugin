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
            inclusionLoader: "text",
            access: true
        }
    }
});

curl(["js/appendElem", "view!html/main"], function(appendElem, view) {
    appendElem(view);
});
