"use strict";

const debug = require("debug")("bot-express:*");
const nlu = require("../service/dialogflow");
const parse = require("../service/parser");
const workout_db = require("../service/workout");

module.exports = class SkillInstructWorkout {
    constructor(){
        this.required_parameter = {
            workout_type: {
                message_to_confirm: {
                    type: "text",
                    text: "何のワークアウトについてご説明しましょうか？"
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (value === "") return reject();

                    return parse.identify(context.sender_language, "parse_workout_type", value).then((response) => {
                        if (response){
                            return resolve(response);
                        }
                        return reject();
                    })
                },
                sub_skill: ["show-workouts"]
            }
        }
    }

    finish(bot, event, context, resolve, reject){
        return Promise.resolve().then((response) => {
            return workout_db.get_workout(context.confirmed.workout_type);
        }).then((response) => {
            return bot.reply({
                type: "text",
                text: response.instruction || `${context.confirmed.workout_type}についてのデータがありませんでした。`
            })
        }).then((response) => {
            return resolve();
        })
    }
}
