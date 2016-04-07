"use strict";

var _ = require("lodash");
var storeHouse = require("storehouse");
var argv = require("minimist")(process.argv);
var utils = require("util")
var fs = require("fs");
var ejs = require("ejs");
var path = require("path");

var SHOW_TABLES_WITH_COLUMN = "select * from information_schema.columns ";
SHOW_TABLES_WITH_COLUMN += "where table_schema = '%s' order by table_name,ordinal_position";

var TEMPLATE_MYSQL_MODEL = fs.readFileSync("./templates/mysql/model.ejs", "utf8");

var connectionObject = {
    client: "mysql", //should be fetch from configuration
    host: "localhost",
    port: 3306, //should be fetch from configuration
    db: "testMySqlModel",
    uid: "root",
    pwd: "",
    isMultiStatement: true
};

if(argv.client !== "mysql") {
    console.log("setting client `mysql`");
}

if(!argv.u) {
    console.log("setting username `root`");
}
else {
    connectionObject.uid = argv.u;
}
if(!argv.p) {
    console.log("setting password ``");
}
else {
    connectionObject.pwd = argv.p;
}
if(!argv.h) {
    console.log("setting host `localhost`");
}
else {
    connectionObject.host = argv.h;
}
if(!argv.port) {
    if(connectionObject.client === 'mysql') {
        console.log("setting host `3306`");
    }
}
else {
    connectionObject.port = +argv.port;
}
if(!argv.db) {
    console.log("setting database `testMySqlModel`");
}
else {
    connectionObject.db = argv.db;
}

function generateModelFile(data) {
    var dataFile = ejs.render(TEMPLATE_MYSQL_MODEL, data);
    fs.writeFile(path.resolve(__dirname, "model", data.model.tableName) + ".js", dataFile, 'utf8', function(){
        console.log("generated:table: ", data.model.tableName);
    });
}

var client = storeHouse.initialize(connectionObject).client;

return client.raw(utils.format(SHOW_TABLES_WITH_COLUMN, connectionObject.db)).then(function(data) {
    if(!data[0].length) {
        return console.log("db have no `table`.");
    }
    var groupedTables = _.groupBy(data[0], 'TABLE_NAME');
    var keys = Object.keys(groupedTables);
    for(var i= 0,iLength=keys.length;i<iLength;i+=1){
        generateModelFile({model: {
            tableName: keys[i],
            columns: _.map(groupedTables[keys[i]], "COLUMN_NAME")
        }});
    }
    console.log("done");
    return;
}).catch(function(){
    console.log("catch:", arguments);
});
