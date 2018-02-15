"use strict";

const debug = require('debug')('bot-express:service');
const nlu = require("../service/dialogflow");
const default_lang = "ja";

module.exports = class ServiceParser {
    static by_list(value, acceptable_values, resolve, reject){
        if (acceptable_values.includes(value)){
            debug("Accepted the value.");
            return resolve(value);
        }
        return reject();
    }

    static by_nlu_with_list(lang = default_lang, parameter_name, value, acceptable_values, resolve, reject){
        debug("Going to understand value by NLU.");
        if (!lang) lang = default_lang;
        return nlu.query(lang, value).then((response) => {
            if (response.status.code != 200){
                debug(response.status.errorDetails);
                return reject();
            }

            if (response.result.parameters[parameter_name]){
                debug("Found entity.");
                if (acceptable_values.includes(response.result.parameters[parameter_name])){
                    debug("Accepted the value.");
                    return resolve(response.result.parameters[parameter_name]);
                }
            }
            return reject();
        })
    }

    static identify(lang, parameter_name, value){
        debug("Going to identify value by NLU.");
        if (!lang) lang = default_lang;
        return nlu.query(lang, value).then((response) => {
            if (response.status.code != 200){
                debug(response.status.errorDetails);
                return Promise.reject(new Error(response.status.errorDetails));
            }

            if (response.result.parameters[parameter_name] === undefined){
                debug("Entity not found.");
                return null;
            }

            debug("Found entity.");
            return response.result.parameters[parameter_name];
        })
    }
}
