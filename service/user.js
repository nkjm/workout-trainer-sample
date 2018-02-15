"use strict";

const debug = require("debug")("bot-express:service");
const db = require("../service/salesforce");
const cache = require("memory-cache");

class ServiceUser {
    static get_latest_workout_history(user_id, workout_type){
        return ServiceUser.get_workout_history(user_id, workout_type).then((workout_history) => {
            if (!workout_history || workout_history.length === 0){
                return null
            }
            return workout_history[0];
        })
    }

    static get_workout_history(user_id, workout_type){
        let query = `
            select
                id,
                workout_type__c,
                workout_report__c,
                weight__c,
                rep__c,
                diet_user__c,
                createdDate
            from workout_history__c where
                (diet_user__r.user_id__c = '${user_id}' or diet_user__r.google_user_id__c = '${user_id}') and
                workout_type__c = '${workout_type}'
            order by createdDate desc
        `;
        return db.query(query).then((history_list__c) => {
            let history_list = [];
            history_list__c.records.map((h) => {
                history_list.push({
                    Id: h.Id,
                    workout_type: h.workout_type__c,
                    workout_report: h.workout_report__c,
                    weight: h.weight__c,
                    rep: h.rep__c,
                    diet_user: h.diet_user__c,
                    created_date: h.CreatedDate
                });
            });
            return history_list;
        });
    }

    static save_workout_history(user_id, workout_history, messenger_type = "line"){
        // Upsert user.
        let done_user_upserted;
        if (messenger_type === "google"){
            done_user_upserted = db.upsert("diet_user__c", {google_user_id__c: user_id}, "google_user_id__c");
        } else {
            done_user_upserted = Promise.resolve();
        }

        let workout_history__c = {
            diet_user__r: {},
            workout_type__c: workout_history.workout_type,
            weight__c: workout_history.weight,
            rep__c: workout_history.rep,
            workout_report__c: workout_history.workout_report
        }
        if (messenger_type === "line"){
            workout_history__c.diet_user__r.user_id__c = user_id
        } else if (messenger_type === "google"){
            workout_history__c.diet_user__r.google_user_id__c = user_id
        }
        return done_user_upserted.then(() => {
            return db.create("workout_history__c", workout_history__c);
        });
    }

    static upsert_user(user, messenger_type = "line"){
        let user__c = {
            user_id__c: user.user_id,
            google_user_id__c: user.google_user_ic__c,
            display_name__c: user.display_name,
            picture_url__c: user.picture_url,
            birthday__c: user.birthday,
            sex__c: user.sex,
            height__c: user.height,
            activity__c: user.activity,
            first_login__c: user.first_login,
            email__c: user.email,
            phone__c: user.phone
        }

        let ext_key;
        if (messenger_type === "line"){
            ext_key = "user_id__c";
        } else if (messenger_type === "google"){
            ext_key = "google_user_id__c";
        }

        return db.upsert("diet_user__c", user__c, ext_key);
    }

    static get_user(user_id, messenger_type = "line"){
        let ext_key;
        if (messenger_type === "line"){
            ext_key = "user_id__c";
        } else if (messenger_type === "google"){
            ext_key = "google_user_id__c";
        }

        return db.retrieve(`diet_user__c/${ext_key}`, user_id).then((user__c) => {
            let user = {
                line_id: user__c.user_id__c,
                google_id: user__c.google_user_id__c,
                sex: user__c.sex__c,
                age: user__c.age__c,
                height: user__c.height__c,
                picture_url: user__c.picture_url__c,
                activity: user__c.activity__c,
                display_name: user__c.display_name__c,
                first_login: user__c.first_login__c,
                email: user__c.email__c,
                phone: user__c.phone__c
            }
            return user;
        });
    }
}

module.exports = ServiceUser;
