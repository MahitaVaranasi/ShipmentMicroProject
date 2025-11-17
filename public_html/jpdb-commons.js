/* 
 *  
 * Copyright Notice
 * 
 * This source code file is created by Hemant Kumar Dugar and is his sole property. 
 * Hemant Kumar Dugar  reserves the rights to all information contained within this 
 * source code file. Any copying of this source code file, in whole or in part including 
 * the concept, idea and logic explained herein by any means for any purpose, 
 * without the expressed written consent of Hemant Kumar Dugar is a violation 
 * of copyright law. 
 * 
 * Copyright © 2018 - Hemant Kumar Dugar - All Rights Reserved
 */

// REMEMBER
// This jpdb-commons.js and all other in this folder is shared resources for
// application development for JsonPowerDB 
// 
// Main file(s) in this folder to be modified for any new feature implementation
//

var baseUrl = "http://api.login2explore.com:5577";

//To set the baseUrl 
function setBaseUrl(baseUrlArg) {
    baseUrl = baseUrlArg;
}

var imlPartUrl = "/api/iml";
var irlPartUrl = "/api/irl";
var islPartUrl = "/api/isl";

var notReachableJpdbUrlsJsonObj = {};
var NOT_REACHABLE_NODES_KEY = "notReachable";

var FILE_STATUS_OK = "OK";
var FILE_STATUS_EOF = "EOF";
var FILE_STATUS_BOF = "BOF";
var RELATION_IS_EMPTY = "RELATION IS EMPTY";
var DATA_HAS_BEEN_RETRIEVED_FROM_PI = "DATA RETRIEVED FROM PI";
var INVALID_RECORD = "INVALID RECORD";
var DATA_NOT_FOUND = "DATA NOT FOUND";
var SUCCESS = "Success";
var FAILURE = "Faliure";
var COLUMN_EXIST = "COLUMN EXISTS";
var COLUMN_DOES_NOT_EXIST = "COLUMN DOES NOT EXIST";
var RES_STATUS_SUCCESS = 200;
var RES_STATUS_FAILURE = 400;
var TRUE = "true";
var FALSE = "false";
//REMEMBER - this constant used in JPDBObject in GETALL command, so if there is any changes in GETALL command in JSONPowerDB
// then we have to upadate this constant also.
var RELATION_DOES_NOT_EXIST = "RELATION DOES NOT EXIST";

// To send and add form data to JPDB instance specified in the apiBaseUrl
function insertFormData2JPDB(formID) {

    var $form = $("#" + formID + "");
    var formDataInJson = getFormDataInJson($form);          //jpdb-commons.js method
    var formJsonStr = JSON.stringify(formDataInJson);

    $.ajaxSetup({async: false});
    // The following like will create a put request - jpdb-commons.js method
    var msgDivID = $("#" + formID + "").attr('data-response-div-id');
    var connToken = $("#" + formID + "").attr('data-connection-token');
    if (connToken === "" || connToken === undefined) {
        if (msgDivID === "" || msgDivID === undefined) {
            alert("JPDB Connection Token Missing!");
        } else {
            $("#" + msgDivID + '').html('JPDB Connection Token Missing!').fadeIn().delay(3000).fadeOut();
        }
        return false;
    }
    var dbName = $("#" + formID + "").attr('data-db-name');
    if (dbName === undefined) {
        dbName = "";
    }
    var relName = $("#" + formID + "").attr('data-table-name');
    if (relName === undefined) {
        relName = "";
    }

    var successMsg = $("#" + formID + "").attr('data-success-msg');
    var errorMsg = $("#" + formID + "").attr('data-error-msg');

    var putReq = createPUTRequest(connToken, formJsonStr, dbName, relName);

    var imlPartUrl = "/api/iml";                           // API End-Point URL
    // Sends data to the JPDB server - jpdb-commons.js method
    var respJson = executeCommand(putReq, imlPartUrl);

    var status = respJson.status;
    var statusMsg = "";
    if (status === 200) {
        if (successMsg === "" || successMsg === undefined) {
            statusMsg = respJson.message;
        } else {
            statusMsg = successMsg;
        }
    } else {
        if (errorMsg === "" || errorMsg === undefined) {
            statusMsg = respJson.message;
        } else {
            statusMsg = errorMsg;
        }
    }
    if (msgDivID === "" || msgDivID === undefined) {
        alert(statusMsg);
    } else {
        $("#" + msgDivID + '').html(statusMsg).fadeIn().delay(3000).fadeOut();
    }

    document.getElementById(formID).reset();
    $.ajaxSetup({async: true});

    return false;
}


/**
 * 
 * @param {String} connToken
 * @param {String} jsonObj
 * @param {String} dbName
 * @param {String} relName
 * @returns {String}
 */
// This function is used to create the PUT Json request for a single record.
// TODO required to add the colsAutoIndex and templateStr params
function createPUTRequest(connToken, jsonObj, dbName, relName) {
    var putRequest = "{\n"
            + "\"token\" : \""
            + connToken
            + "\","
            + "\"dbName\": \""
            + dbName
            + "\",\n" + "\"cmd\" : \"PUT\",\n"
            + "\"rel\" : \""
            + relName + "\","
            + "\"jsonStr\": \n"
            + jsonObj
            + "\n"
            + "}";
    return putRequest;
}

/**
 * 
 * @param {String} connToken
 * @param {String} jsonObj
 * @param {String} dbName
 * @param {String} relName
 * @returns {String}
 */
// This function is used to create the PUT Json request for multiple records.
//TODO required to add the colsAutoIndex and templateStr params
function createPUT_ALLRequest(connToken, jsonObj, dbName, relName) {
    var putRequest = "{\n"
            + "\"token\" : \""
            + connToken
            + "\","
            + "\"dbName\": \""
            + dbName
            + "\",\n" + "\"cmd\" : \"PUT_ALL\",\n"
            + "\"rel\" : \""
            + relName + "\","
            + "\"jsonStr\": \n"
            + jsonObj
            + "\n"
            + "}";
    return putRequest;
}

function createJsonObjWithStatusAndError() {
    var jsonObj = {
        status: 503,
        error: "Server NOT reachable or NOT running"
    }
    return jsonObj;
}

function createNotReachableUrlsDetailJsonObj(token, endPointUrl, reqStr) {
    var responseJsonObj = {
        token: token,
        endPointUrl: endPointUrl,
        reqStr: reqStr
    }
    console.log(responseJsonObj);
    return responseJsonObj;
}

function addNotReachableUrl(baseUrl, token, endPointUrl, reqStr) {
    notReachableJpdbUrlsJsonObj[baseUrl] = createNotReachableUrlsDetailJsonObj(token, endPointUrl, reqStr);
    updateNotReachableUrlsOnLS();
}

function removeNotReachableUrl(baseUrl) {
    delete notReachableJpdbUrlsJsonObj[baseUrl];
    updateNotReachableUrlsOnLS();
}

function updateNotReachableUrlsOnLS() {
    var lvNotReachableJsonStr = JSON.stringify(notReachableJpdbUrlsJsonObj);
    localStorage.setItem(NOT_REACHABLE_NODES_KEY, lvNotReachableJsonStr);
}

/**
 * 
 * @param {String} reqString
 * @param {String} dbBaseUrl
 * @param {String} apiEndPointUrl
 * @returns {Array|Object}
 */
// This function is responsible to execute JPDB command on the given dbBaseUrl
// and return response to the caller.
function executeCommandAtGivenBaseUrl(reqString, dbBaseUrl, apiEndPointUrl) {
    var url = dbBaseUrl + apiEndPointUrl;
    var jsonObj;
    $.post(url, reqString, function (result) {
        jsonObj = JSON.parse(result);
    }).fail(function (result) {
            var dataJsonObj = result.responseText;
            jsonObj = JSON.parse(dataJsonObj);
    });
    return jsonObj;
}

/**
 * 
 * @param {String} reqString
 * @param {String} apiEndPointUrl
 * @returns {Array|Object}
 */
// This function is responsible to execute JPDB command on the default baseUrl
// and returns response to the caller.
function executeCommand(reqString, apiEndPointUrl) {
    var url = baseUrl + apiEndPointUrl;
    var jsonObj;
    $.post(url, reqString, function (result) {
        jsonObj = JSON.parse(result);
    }).fail(function (result) {
        var dataJsonObj = result.responseText;
        jsonObj = JSON.parse(dataJsonObj);
    });
    return jsonObj;
}


function executeCommandAtGivenBaseUrlV11(reqString, dbBaseUrl, apiEndPointUrl) {
//    alert("execute command at base url");
    var url = dbBaseUrl + apiEndPointUrl;
    var jsonObj;
    $.post(url, reqString, function (result) {
        jsonObj = JSON.parse(result);
        removeNotReachableUrl(dbBaseUrl);
        console.log(result);
    }).fail(function (result) {

        try {
            var dataJsonObj = result.responseText;
            jsonObj = JSON.parse(dataJsonObj);
        } catch (errorMessage) {
            jsonObj = createJsonObjWithStatusAndError();
        }
        var reqStrObj = JSON.parse(reqString);
        addNotReachableUrl(dbBaseUrl, reqStrObj.token, apiEndPointUrl, reqString);
        console.log(notReachableJpdbUrlsJsonObj);

    });
    return jsonObj;}

function executeCommandV11(reqString, apiEndPointUrl) {
    return executeCommandAtGivenBaseUrlV11(reqString, baseUrl, apiEndPointUrl);
}

// A general function to extract any form data and return the cooresponding Json representation.
function getFormDataInJson($form) {
    var unindexed_array = $form.serializeArray();
    var indexed_array = {};
    $.map(unindexed_array, function (n, i) {
        indexed_array[n['name']] = n['value'];
    });
    return indexed_array;
}


/**
 * 
 * @param {String} token
 * @param {String} dbName
 * @param {String} relationName
 * @param {String} colName
 * @returns {String}
 */
//This function returns the request to check that will check whether the given 
//colName exists in the dbName and relationName
function createIS_COLUMN_EXISTRequest(token, dbName, relationName, colName) {
    var req = "{\n"
            + "\"token\" : \""
            + token
            + "\","
            + "\"dbName\": \""
            + dbName
            + "\",\n" + "\"cmd\" : \"IS_COLUMN_EXIST\",\n"
            + "\"rel\" : \""
            + relationName
            + "\",\n"
            + "\"colName\" : \""
            + colName
            + "\",\n"
            + "\n"
            + "}";
    return req;
}


/**
 * 
 * @param {String} token
 * @param {String} dbName
 * @param {String} relName
 * @param {Number} timeStamp
 * @param {Number} pageNo
 * @param {Number} pageSize
 * @param {Boolean} createTime
 * @param {Boolean} updateTime
 * @returns {String}
 */

//TODO all optional keys should be handled like createtime and updatetime
//TODO should name be changed, it creates GETALL request only
function createGETALLSyncRecordRequest(token, dbName, relName, timeStamp, pageNo, pageSize, createTime, updateTime) {
    if (createTime !== undefined) {
        if (createTime !== true) {
            createTime = false;
        }
    } else {
        createTime = false;
    }
    if (updateTime !== undefined) {
        if (updateTime !== true) {
            updateTime = false;
        }
    } else {
        updateTime = false;
    }
    var req = "{\n"
            + "\"token\" : \""
            + token
            + "\","
            + "\"dbName\": \""
            + dbName
            + "\",\n" + "\"cmd\" : \"GETALL\",\n"
            + "\"rel\" : \""
            + relName
            + "\",\n" + "\"timeStamp\": "
            + timeStamp
            + ",\n" + "\"pageNo\":"
            + pageNo
            + "," + "\"pageSize\":"
            + pageSize
            + "\,"
            + "\"createTime\":"
            + createTime
            + "\,"
            + "\"updateTime\":"
            + updateTime
            + "\n"
            + "}";
    return req;
}

/**
 * 
 * @param {String} token
 * @param {String} dbName
 * @param {String} relName
 * @param {Number} pageNo
 * @param {Number} pageSize
 * @param {Boolean} createTime
 * @param {Boolean} updateTime
 * @returns {String}
 */
//This function creates the request to get all records present in the relName relation
function createGETALLRecordRequest(token, dbName, relName, pageNo, pageSize, createTime, updateTime) {
    if (createTime !== undefined) {
        if (createTime !== true) {
            createTime = false;
        }
    } else {
        createTime = false;
    }
    if (updateTime !== undefined) {
        if (updateTime !== true) {
            updateTime = false;
        }
    } else {
        updateTime = false;
    }
    var req = "{\n"
            + "\"token\" : \""
            + token
            + "\","
            + "\"dbName\": \""
            + dbName
            + "\",\n" + "\"cmd\" : \"GETALL\",\n"
            + "\"rel\" : \""
            + relName
            + "\",\n" + "\"pageNo\":"
            + pageNo
            + "," + "\"pageSize\":"
            + pageSize
            + "\,"
            + "\"createTime\":"
            + createTime
            + "\,"
            + "\"updateTime\":"
            + updateTime
            + "\n"
            + "}";
    return req;
}

/**
 * 
 * @param {String} token
 * @param {String} dbName
 * @param {String} relName
 * @returns {String}
 */
//This function creates the request to get all column names present in the relName relation
function createGETALLCOLRequest(token, dbName, relName) {
    var req = "{\n"
            + "\"token\" : \""
            + token
            + "\","
            + "\"dbName\": \""
            + dbName
            + "\",\n" + "\"cmd\" : \"GETALLCOL\",\n"
            + "\"rel\" : \""
            + relName
            + "\"\n"
            + "}";
    return req;
}

/**
 * 
 * @param {String} token
 * @param {String} dbname
 * @param {String} relationName
 * @param {String} jsonObjStr
 * @returns {String}
 */
//This function creates the request to get a single record matching json data
function createGETRequest(token, dbname, relationName, jsonObjStr) {
    var value1 = "{\n"
            + "\"token\" : \""
            + token
            + "\",\n" + "\"cmd\" : \"GET\",\n"
            + "\"dbName\": \""
            + dbname
            + "\",\n"
            + "\"rel\" : \""
            + relationName
            + "\",\n"
            + "\"jsonStr\":\n"
            + jsonObjStr
            + "\n"
            + "}";
    return value1;
}

/**
 * 
 * @param {String} token
 * @param {String} dbname
 * @param {String} relationName
 * @param {String} jsonObjStr
 * @param {Boolean} createTime
 * @param {Boolean} updateTime
 * @returns {String}
 */
//This function creates the get by key request to fetch single record by json data using indexed columns only
function createGET_BY_KEYRequest(token, dbname, relationName, jsonObjStr, createTime, updateTime) {
    if (createTime !== undefined) {
        if (createTime !== true) {
            createTime = false;
        }
    } else {
        createTime = false;
    }
    if (updateTime !== undefined) {
        if (updateTime !== true) {
            updateTime = false;
        }
    } else {
        updateTime = false;
    }
    var value1 = "{\n"
            + "\"token\" : \""
            + token
            + "\",\n" + "\"cmd\" : \"GET_BY_KEY\",\n"
            + "\"dbName\": \""
            + dbname
            + "\",\n"
            + "\"rel\" : \""
            + relationName
            + "\",\n"
            + "\"jsonStr\":\n"
            + jsonObjStr
            + "\,"
            + "\"createTime\":"
            + createTime
            + "\,"
            + "\"updateTime\":"
            + updateTime
            + "\n"
            + "}";
    return value1;
}

/**
 * 
 * @param {String} token
 * @param {String} dbName
 * @param {String} relName
 * @param {Number} record
 * @returns {String}
 */
//Deprecated by GET_BY_RECORD command, see help for the same
function createGET_RECORDRequest(token, dbName, relName, record) {
    var req = "{\n"
            + "\"token\" : \""
            + token
            + "\","
            + "\"dbName\": \""
            + dbName
            + "\",\n" + "\"cmd\" : \"GET_RECORD\",\n"
            + "\"rel\" : \""
            + relName
            + "\",\n" + "\"record\":"
            + record
            + "\n"
            + "}";
    return req;
}

/**
 * 
 * @param {String} token
 * @param {String} dbName
 * @param {String} relName
 * @param {number} record
 * @param {Boolean} createTime
 * @param {Boolean} updateTime
 * @returns {String}
 */
//This function creates the request that will retrieve a single record matching the record number
function createGET_BY_RECORDRequest(token, dbName, relName, record, createTime, updateTime) {
    if (createTime !== undefined) {
        if (createTime !== true) {
            createTime = false;
        }
    } else {
        createTime = false;
    }
    if (updateTime !== undefined) {
        if (updateTime !== true) {
            updateTime = false;
        }
    } else {
        updateTime = false;
    }
    var req = "{\n"
            + "\"token\" : \""
            + token
            + "\","
            + "\"dbName\": \""
            + dbName
            + "\",\n" + "\"cmd\" : \"GET_BY_RECORD\",\n"
            + "\"rel\" : \""
            + relName
            + "\",\n" + "\"record\":"
            + record
            + "\,"
            + "\"createTime\":"
            + createTime
            + "\,"
            + "\"updateTime\":"
            + updateTime
            + "\n"
            + "}";
    return req;
}

// DEPRECATED - Can be removed in future releases.
function createGET_RELATION_SIZERequest(token, dbname, relationName) {
    var value1 = "{\n"
            + "\"token\" : \""
            + token
            + "\",\n" + "\"cmd\" : \"GET_RELATION_SIZE\",\n"
            + "\"dbName\": \""
            + dbname
            + "\",\n"
            + "\"rel\" : \""
            + relationName
            + "\",\n"
            + "\n"
            + "}";
    return value1;
}

/**
 * 
 * @param {String} token
 * @param {String} dbname
 * @param {String} relationName
 * @returns {String}
 */
//This function creates the request for fetching the number of records and the
//the size of the relation
function createGET_RELATION_STATSRequest(token, dbname, relationName) {
    var value1 = "{\n"
            + "\"token\" : \""
            + token
            + "\",\n" + "\"cmd\" : \"GET_RELATION_STATS\",\n"
            + "\"dbName\": \""
            + dbname
            + "\",\n"
            + "\"rel\" : \""
            + relationName
            + "\",\n"
            + "\n"
            + "}";
    return value1;
}

// DEPRECATED - Can be removed in future releases.
function createGETALLRELRequest(token, dbName) {
    var req = "{\n"
            + "\"token\" : \""
            + token
            + "\","
            + "\"dbName\": \""
            + dbName
            + "\",\n" + "\"cmd\" : \"GETALLREL\"\n"
            + "}";
    return req;
}

/**
 * 
 * @param {String} token
 * @param {String} dbName
 * @returns {String}
 */

// This function creates the request to get names of all relations in the given 
// database
function createGET_ALL_RELATIONRequest(token, dbName) {
    var req = "{\n"
            + "\"token\" : \""
            + token
            + "\","
            + "\"dbName\": \""
            + dbName
            + "\",\n" + "\"cmd\" : \"GET_ALL_RELATION\"\n"
            + "}";
    return req;
}

/**
 * 
 * @param {String} token
 * @param {String} dbName
 * @param {String} relTimestampObjStr
 * @param {Boolean} createTime
 * @param {Boolean} updateTime
 * @returns {String}
 */

//This function creates the request to retrieve the multiple updated records from multiple relations using timestamp
function createSYNC_DBRequest(token, dbName, relTimestampObjStr, createTime, updateTime) {
    if (createTime !== undefined) {
        if (createTime !== true) {
            createTime = false;
        }
    } else {
        createTime = false;
    }
    if (updateTime !== undefined) {
        if (updateTime !== true) {
            updateTime = false;
        }
    } else {
        updateTime = false;
    }
    var req = "{\n"
            + "\"token\" : \""
            + token
            + "\","
            + "\"dbName\": \""
            + dbName
            + "\",\n" + "\"cmd\" : \"SYNC_DB\",\n"
            + "\"relTsJson\":"
            + "{\n"
            + relTimestampObjStr
            + "\n"
            + "}"
            + "\,"
            + "\"createTime\":"
            + createTime
            + "\,"
            + "\"updateTime\":"
            + updateTime
            + "}";
    return req;
}

/**
 * 
 * @param {String} token
 * @param {String} dbName
 * @param {String} relName
 * @param {Number} recNo
 * @returns {String}
 */
//This function creates the request to remove the data of given record number 
function createREMOVERecordRequest(token, dbName, relName, recNo) {
    var req = "{\n"
            + "\"token\" : \""
            + token
            + "\","
            + "\"dbName\": \""
            + dbName
            + "\",\n" + "\"cmd\" : \"REMOVE\",\n"
            + "\"rel\" : \""
            + relName
            + "\",\n" + "\"record\":"
            + recNo
            + "\n"
            + "}";
    return req;
}

function createCopyColumnRequest(token, jsonObj, dbName, relName)
{
    if (token === undefined || jsonObj === undefined) {
        return false;
    }
    var req = {
        "token": token,
        "jsonStr": JSON.parse(jsonObj)
    };
    if (dbName !== undefined) {
        req["dbName"] = dbName;
    }
    if (relName !== undefined) {
        req["rel"] = relName;
    }
    return JSON.stringify(req);
}

function createRenameColumnRequest(token, jsonObj, dbName, relName)
{
    if (token === undefined || jsonObj === undefined) {
        return false;
    }
    var req = {
        "token": token,
        "jsonStr": JSON.parse(jsonObj)
    };
    if (dbName !== undefined) {
        req["dbName"] = dbName;
    }
    if (relName !== undefined) {
        req["rel"] = relName;
    }
    return JSON.stringify(req);
}

function createRemoveColumnRequest(token, jsonObj, dbName, relName)
{
    if (token === undefined || jsonObj === undefined) {
        return false;
    }
    var req = {
        "token": token,
        "jsonStr": JSON.parse(jsonObj)
    };
    if (dbName !== undefined) {
        req["dbName"] = dbName;
    }
    if (relName !== undefined) {
        req["rel"] = relName;
    }
    return JSON.stringify(req);
}

function createChangeColumnTypeRequest(token, jsonObj, dbName, relName)
{
    if (token === undefined || jsonObj === undefined) {
        return false;
    }
    var req = {
        "token": token,
        "jsonStr": JSON.parse(jsonObj)
    };
    if (dbName !== undefined)
        req["dbName"] = dbName;
    if (relName !== undefined)
        req["rel"] = relName;
    return JSON.stringify(req);
}

/**
 * 
 * @param {String} token
 * @param {String} jsonObj
 * @param {String} dbName
 * @param {String} relName
 * @param {Number} recNo
 * @returns {String}
 */
//This function creates the request to update data to given jsonStr (only if recNo 
//already exists in the relation)
function createUPDATERecordRequest(token, jsonObj, dbName, relName, recNo) {
    var req = "{\n"
            + "\"token\" : \""
            + token
            + "\","
            + "\"dbName\": \""
            + dbName
            + "\",\n" + "\"cmd\" : \"UPDATE\",\n"
            + "\"rel\" : \""
            + relName
            + "\",\n"
            + "\"jsonStr\":{ \""
            + recNo
            + "\":\n"
            + jsonObj
            + "\n"
            + "}}";
    return req;
}

function createUPDATERecordRequest_New(token, jsonObj, dbName, relName) {
    var req = "{\n"
            + "\"token\" : \""
            + token
            + "\","
            + "\"dbName\": \""
            + dbName
            + "\",\n" + "\"cmd\" : \"UPDATE\",\n"
            + "\"rel\" : \""
            + relName
            + "\",\n"
            + "\"jsonStr\": \n"
            + jsonObj
            + "\n"
            + "}";
    return req;
}

/**
 * 
 * @param {String} token
 * @param {String} jsonStr
 * @param {String} dbName
 * @param {String} relName
 * @param {String} type (PUT / UPDATE / DEFAULT)
 * @param {String} primaryKey 
 * @param {Array} uniqueKeys
 * @param {Array|Object} foreignKeys 
 * @returns {String}
 */
//IMP - Should be used for implementing RDBMS functionalities
//This function creates a SET request for single record with three types 
//- PUT(insert)
//- UPDATE(modify)
//- DEFAULT(insert if primaryKey doesn't exist yet, else modify existing record
//          corresponding to the primaryKey value)

function createSETRequest(token, jsonStr, dbName, relName, type, primaryKey, uniqueKeys, foreignKeys) {
    if (type === undefined) {
        type = "DEFAULT";
    }
    var req = {
        token: token,
        cmd: "SET",
        dbName: dbName,
        rel: relName,
        type: type,
        jsonStr: JSON.parse(jsonStr)
    };
    if (primaryKey !== undefined) {
        req.primaryKey = primaryKey;
    }
    if (uniqueKeys !== undefined) {
        req.uniqueKeys = uniqueKeys;
    }
    if (foreignKeys !== undefined) {
        req.foreignKeys = foreignKeys;
    }
    req = JSON.stringify(req);
    return req;
}

/**
 * 
 * @param {String} token
 * @param {String} jsonStr
 * @param {String} dbName
 * @param {String} relName
 * @param {String} type (PUT, DEFAULT, UPDATE)
 * @param {String} primaryKey
 * @param {Array} uniqueKeys
 * @param {Array|Object} foreignKeys
 * @returns {String}
 */

//IMP - Should be used for implementing RDBMS functionalities
//This function creates a set request for multiple records with three types 
//- PUT(insert)
//- UPDATE(modify)
//- DEFAULT(insert if primaryKey doesn't exist yet, else modify existing
//          record(s) corresponding to the primaryKey value(s))
function createSET_ALLRequest(token, jsonStr, dbName, relName, type, primaryKey, uniqueKeys, foreignKeys) {
    if (type === undefined) {
        type = "DEFAULT";
    }
    var req = {
        token: token,
        cmd: "SET_ALL",
        dbName: dbName,
        rel: relName,
        type: type,
        jsonStr: JSON.parse(jsonStr)
    };
    if (primaryKey !== undefined) {
        req.primaryKey = primaryKey;
    }
    if (uniqueKeys !== undefined) {
        req.uniqueKeys = uniqueKeys;
    }
    if (foreignKeys !== undefined) {
        req.foreignKeys = foreignKeys;
    }
    req = JSON.stringify(req);
    return req;
}

/**
 * 
 * @param {String} token
 * @param {String} dbName
 * @param {String} relName
 * @param {String} jsonObjStr
 * @param {Boolean} createTime
 * @param {Boolean} updateTime
 * @returns {String}
 */

//DEPRECATED by the FIND_ALL_RECORDS command, see help for the same

function createFIND_RECORDRequest(token, dbName, relName, jsonObjStr, createTime, updateTime) {
    if (createTime !== undefined) {
        if (createTime !== true) {
            createTime = false;
        }
    } else {
        createTime = false;
    }
    if (updateTime !== undefined) {
        if (updateTime !== true) {
            updateTime = false;
        }
    } else {
        updateTime = false;
    }
    var req = "{\n"
            + "\"token\" : \""
            + token
            + "\","
            + "\"dbName\": \""
            + dbName
            + "\",\n" + "\"cmd\" : \"FIND_RECORD\",\n"
            + "\"rel\" : \""
            + relName
            + "\",\n"
            + "\"jsonStr\":\n"
            + jsonObjStr
            + "\,"
            + "\"createTime\":"
            + createTime
            + "\,"
            + "\"updateTime\":"
            + updateTime
            + "\n"
            + "}";
    return req;
}

/**
 * 
 * 
 * @param {String} token
 * @param {String} dbName
 * @param {String} relName
 * @param {String} jsonObjStr
 * @param {Boolean} createTime 
 * @param {Boolean} updateTime 
 * @returns {String}
 */
//This function creates a request that returns all records that match json value 
//in the given column.
//It works with non indexed columns as well.
function createFIND_ALL_RECORDSRequest(token, dbName, relName, jsonObjStr, createTime, updateTime) {
    if (createTime !== undefined) {
        if (createTime !== true) {
            createTime = false;
        }
    } else {
        createTime = false;
    }
    if (updateTime !== undefined) {
        if (updateTime !== true) {
            updateTime = false;
        }
    } else {
        updateTime = false;
    }
    var req = "{\n"
            + "\"token\" : \""
            + token
            + "\","
            + "\"dbName\": \""
            + dbName
            + "\",\n" + "\"cmd\" : \"FIND_ALL_RECORDS\",\n"
            + "\"rel\" : \""
            + relName
            + "\",\n"
            + "\"jsonStr\":\n"
            + jsonObjStr
            + "\,"
            + "\"createTime\":"
            + createTime
            + "\,"
            + "\"updateTime\":"
            + updateTime
            + "\n"
            + "}";
    return req;
}

/**
 * 
 * @param {String} token
 * @param {String} dbName
 * @param {String} relName
 * @param {Number} recordNumber
 * @param {Boolean} createTime
 * @param {Boolean} updateTime
 * @returns {String}
 */
//This function creates the request to get the next record in relation present 
//after given record number
function createNEXT_RECORDRequest(token, dbName, relName, recordNumber, createTime, updateTime) {
    return createNavReq(token, dbName, relName, "NEXT_RECORD", recordNumber, createTime, updateTime);
}

/**
 * 
 * @param {String} token
 * @param {String} dbName
 * @param {String} relName
 * @param {Number} recordNumber
 * @param {Boolean} createTime
 * @param {Boolean} updateTime
 * @returns {String}
 */
//This function creates the request to get the previous record in relation present 
//before given record number
function createPREV_RECORDRequest(token, dbName, relName, recordNumber, createTime, updateTime) {
    return createNavReq(token, dbName, relName, "PREV_RECORD", recordNumber, createTime, updateTime);
}

/**
 * 
 * @param {String} token
 * @param {String} dbName
 * @param {String} relName
 * @param {Boolean} createTime
 * @param {Boolean} updateTime
 * @returns {String}
 */
//This function creates the request to get the first record present in relation  
function createFIRST_RECORDRequest(token, dbName, relName, createTime, updateTime) {
    return createNavReq(token, dbName, relName, "FIRST_RECORD", 0, createTime, updateTime);
}

/**
 * 
 * @param {String} token
 * @param {String} dbName
 * @param {String} relName
 * @param {Boolean} createTime
 * @param {Boolean} updateTime
 * @returns {String}
 */
//This function creates the request to get the last record present in relation  
function createLAST_RECORDRequest(token, dbName, relName, createTime, updateTime) {
    return createNavReq(token, dbName, relName, "LAST_RECORD", 0, createTime, updateTime);
}

// This function is used inside other functions for navigating to get the required
// record
function createNavReq(token, dbName, relName, nav, recNo, createTime, updateTime) {
    if (createTime !== undefined) {
        if (createTime !== true) {
            createTime = false;
        }
    } else {
        createTime = false;
    }
    if (updateTime !== undefined) {
        if (updateTime !== true) {
            updateTime = false;
        }
    } else {
        updateTime = false;
    }
    var partNavReq = "";

    if (nav === "NEXT_RECORD" || nav === "PREV_RECORD") {
        partNavReq = ",\n"
                + "\"record\":"
                + recNo;
    }
    var req = "{\n"
            + "\"token\" : \""
            + token
            + "\","
            + "\"dbName\": \""
            + dbName
            + "\",\n" + "\"cmd\" : \"" + nav + "\",\n"
            + "\"rel\" : \""
            + relName
            + '"'
            + partNavReq
            + "\,"
            + "\"createTime\":"
            + createTime
            + "\,"
            + "\"updateTime\":"
            + updateTime
            + "\n}";
    return req;
}

/**
 * 
 * @param {String} token
 * @param {String} jsonStr
 * @returns {String}
 */
//IMP - this requires the user to first have a valid SMTP set in the user dashboard
//This function creates the request to send email
function createEmailToSendReq(token, jsonStr) {
    var sendEmailRequest = "{\n"
            + "\"token\" : \""
            + token
            + "\",\n"
            + "\"jsonStr\" : \n"
            + jsonStr
            + "\n"
            + "}";
    return sendEmailRequest;
}

//These variable need to be declared as constants in future
var JPDB_SUCCESS_CODE = 200;
var JPDB_INVALID_TOKEN_CODE = 401;
var JPDB_ERROR_CODE = 400;

/**
 * 
 * @param {String} token
 * @param {Number} seedValue
 * @param {String} dbName
 * @param {String} relName
 * @param {String} userID
 * @returns {Number} (status of request)
 */
// Function to generate a new session token from JPDB
function createJpdbSessionToken(token, seedValue, dbName, relName, userID) {

    //Creating getSessionToken request 
    var getSessionReq = "{\n"
            + "\"token\":\"" + token + "\",\n"
            + "\"jsonStr\":{\"seedValue\":" + seedValue + "}\n}";

    //Executing getSessionToken request
    var respSessionReq = executeCommand(getSessionReq, "/serverless/get_new_session");

    //Checking if session token is created or not by the response of getSessionToken request
    var getSessionTokenStatus = respSessionReq.status;

    if (getSessionTokenStatus === JPDB_SUCCESS_CODE) {
        //Getting session token and setting it on the local storage
        var data = respSessionReq.data;
        var dataObj = JSON.parse(data);
        var jpdbSessionToken = dataObj.sessionToken;

        //Inserting the session token in the relation provided by user
        var dataToPut = {
            jpdbUserSessionToken: jpdbSessionToken,
            email: userID
        };
        var dataPutObj = JSON.stringify(dataToPut);
        var sessionRelName = relName + "_session";
        //creating put request to insert session token of the respective user
        var putReqStr = createPUTRequest(token, dataPutObj, dbName, sessionRelName);
        //Executing put request
        var respPUTReq = executeCommand(putReqStr, "/api/iml");

        var putStatus = respPUTReq.status;
        if (putStatus === 200) {
            localStorage.setItem('jpdbUserSessionToken', jpdbSessionToken);
            localStorage.setItem("userID", userID);  //storing email id as user id in browser local storage
            return JPDB_SUCCESS_CODE;
        }
        return putStatus;
    }
    return getSessionTokenStatus;
}

//Function to get session token from localStorage
function getJpdbSessionToken() {
    return localStorage.getItem('jpdbUserSessionToken');
}

/**
 * 
 * @param {String} token
 * @param {String} jpdbSessionToken
 * @returns {Number} //status code
 */
//Function to validate session token from JPDB
function validateJpdbSessionToken(token, jpdbSessionToken) {
    //Creating validate session token request 
    var validSessionReq = "{\n"
            + "\"token\":\"" + token + "\",\n"
            + "\"jsonStr\": {\"sessionToken\": \"" + jpdbSessionToken + "\"}}";
    //Executing validate session token request
    var resValidSessionReq = executeCommand(validSessionReq, "/serverless/validate_session");

    //Checking if session token is valid or not by the response of validate jpdbSessionToken request
    var validateSessionStatus = resValidSessionReq.status;
    return validateSessionStatus;
}

//This function is used inside the validation function to check session token value
function isJpdbSessionTokenExists(token, dbName, relName) {

    var jpdbSessionToken = getJpdbSessionToken();
    if (jpdbSessionToken === "")
        return;
    //creating obj for find record request
    var dataToSend = {
        jpdbUserSessionToken: jpdbSessionToken
    };
    var dataObjStr = JSON.stringify(dataToSend);
    var sessionRelName = relName + "_session";

    //Creating find record request to find if session token is exists or not
    var findRecReq = createFIND_RECORDRequest(token, dbName, sessionRelName, dataObjStr);

    //Executing find record request
    $.ajaxSetup({async: false});
    var respFindRecReq = executeCommand(findRecReq, "/api/irl");

    //Checking if session token exists or not by the response of find record request
    var findRecStatus = respFindRecReq.status;
    if (findRecStatus === JPDB_SUCCESS_CODE) {
        //validating session token from JPDB
        var validSessionTokenStatus = validateJpdbSessionToken(token, jpdbSessionToken);

        //if session token is not validated 
        if (validSessionTokenStatus === JPDB_ERROR_CODE) {
            //Getting the record freom find record response
            var data = respFindRecReq.data;

            $.each(data, function (index, row) {

                //Getting the rec_no
                var recordNo = row['rec_no'];
                //Creating remove record request to remove user session
                var removeReqStr = createREMOVERecordRequest(token, dbName, sessionRelName, recordNo);
                //Executing remove record request
                var respRemoveRecord = executeCommand(removeReqStr, "/api/iml");
                $.ajaxSetup({async: true});

                //Checking if record is removed or not by the response of remove record request
                var removeStatus = respRemoveRecord.status;
                if (removeStatus === JPDB_SUCCESS_CODE) {
                    //As session token is invalid and we remove it from JPDB database, 
                    //hence it does not exists
                    if (getJpdbSessionToken() !== null) {
                        //Session token is not validated
                        localStorage.removeItem('jpdbUserSessionToken');
                    }
                    //That's why we are returning 400 as status
                    return JPDB_ERROR_CODE;
                }
                //Record is not removed due to some errors
                return removeStatus;
            });
            return validSessionTokenStatus;
        }
        //Token is valid and exists
        return validSessionTokenStatus;
    }
    $.ajaxSetup({async: true});
    if (findRecStatus === JPDB_ERROR_CODE) {
        localStorage.removeItem('jpdbUserSessionToken');
        return JPDB_ERROR_CODE;
    }
    return findRecStatus;
}

/**
 * 
 * @param {String} token
 * @param {String} jpdbSessionToken
 * @returns {Number} //status code
 */
//Function used inside the function removeSessionTokenFromJPDB to remove session token
function removeJpdbSessionToken(token, jpdbSessionToken) {

    //Creating remove session token request 
    var removeSessionTokenReq = "{\n"
            + "\"token\":\"" + token + "\",\n"
            + "\"jsonStr\": {\"sessionToken\": \"" + jpdbSessionToken + "\"}}";
    //Executing remove session token request

    var resRemoveSessionToken = executeCommand(removeSessionTokenReq, "/serverless/remove_session");

    //Checking if session token is removed or not by the response of remove jpdbSessionToken request
    var removeSessionStatus = resRemoveSessionToken.status;
    return removeSessionStatus;
}

/**
 * 
 * @param {String} token
 * @param {String} dbName
 * @param {String} relName
 * @returns {Number} //status code
 */
//This function is used to remove the session token from JPDB
function removeSessionTokenFromJPDB(token, dbName, relName) {
    var jpdbSessionToken = getJpdbSessionToken();
    $.ajaxSetup({async: false});
    //removing session token from JPDB
    var respRemoveSession = removeJpdbSessionToken(token, jpdbSessionToken);

    //session removed successfully
    if (respRemoveSession === JPDB_SUCCESS_CODE) {

        localStorage.removeItem('jpdbUserSessionToken');
        localStorage.removeItem('userID');

        //Creating find record request obj
        var dataToSend = {
            jpdbUserSessionToken: jpdbSessionToken
        };
        var dataObjStr = JSON.stringify(dataToSend);
        var sessionRelName = relName + "_session";
        //Creating find record request to find if session token is exists or not
        var findRecReq = createFIND_RECORDRequest(token, dbName, sessionRelName, dataObjStr);
        //Executing find record request
        var respFindRecReq = executeCommand(findRecReq, "/api/irl");

        //Checking if user session token exists or not by the response of find record request
        var findRecStatus = respFindRecReq.status;

        if (findRecStatus === JPDB_SUCCESS_CODE) {
            //Getting the record freom find record response
            var data = respFindRecReq.data;

            $.each(data, function (index, row) {
                //Getting the rec_no
                var recordNo = row['rec_no'];
                //Creating remove record request to remove user session
                var removeReqStr = createREMOVERecordRequest(token, dbName, sessionRelName, recordNo);
                //Executing remove record request
                var respRemoveRecord = executeCommand(removeReqStr, "/api/iml");
                $.ajaxSetup({async: true});

                //Checking if user session token REMOVED or not by the response of REMOVE record request
                var removeStatus = respRemoveRecord.status;
                //session token is removed from relation
                if (removeStatus === JPDB_SUCCESS_CODE) {
                    //session token is removed from loggedIn relation
                    return JPDB_SUCCESS_CODE;
                }
                return removeStatus;
            });
            return JPDB_SUCCESS_CODE;
        }

        $.ajaxSetup({async: true});

        if (findRecStatus === 401) {
            return JPDB_INVALID_TOKEN_CODE;
        } else {
            return findRecStatus;
        }
    }
    return respRemoveSession;
}

/**
 * 
 * @param {String} token
 * @param {String} jsonObj
 * @param {String} dbName
 * @param {String} relName
 * @param {Number} recNo
 * @returns {String}
 */
// This function is used to increments the value of the counter and returns the incremented value
function  createINCRequest(token, jsonObj, dbName, relName, recNo) {
    var req = "{\n"
            + "\"token\" : \""
            + token
            + "\","
            + "\"dbName\": \""
            + dbName
            + "\",\n" + "\"cmd\" : \"INC\",\n"
            + "\"rel\" : \""
            + relName
            + "\",\n"
            + "\"jsonStr\":{ \""
            + recNo
            + "\":\n"
            + jsonObj
            + "\n"
            + "}}";
    return req;
}

// It is used in registerDev() method to check email is valid or not.
function isEmailValid(email) {
    var valid = !(email.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/));
//    alert(valid);
    return valid;
}

