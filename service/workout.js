"use strict";

const debug = require("debug")("bot-express:service");
const db = require("../service/salesforce");

class ServiceWorkout {

    static get_workout(workout_type){
        let query = `
            select
                id,
                name__c,
                instruction__c,
                require_weight__c
            from workout_type__c where
                name__c = '${workout_type}'
            order by createdDate
        `;
        return db.query(query).then((workout_list__c) => {
            if (!workout_list__c || !workout_list__c.records || workout_list__c.records.length === 0){
                return null;
            }
            let workout = {
                name: workout_list__c.records[0].name__c,
                instruction: workout_list__c.records[0].instruction__c,
                require_weight: workout_list__c.records[0].require_weight__c
            }
            return workout;
        });
    }
}

module.exports = ServiceWorkout;
