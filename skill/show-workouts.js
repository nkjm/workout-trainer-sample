"use strict";

const debug = require("debug")("bot-express:*");
const lmo = require("../service/line-message-object");
const nlu = require("../service/dialogflow");
const parse = require("../service/parser");

module.exports = class SkillShowWorkouts {
    constructor(){
        this.required_parameter = {
            basic_or_all: {
                message_to_confirm: {
                    type: "text",
                    text: "基本のワークアウトだけお伝えしましょうか？ あるいはすべてご紹介しますか？"
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (value === "") return reject();

                    parse.by_nlu_with_list(context.sender_language, "parse_basic_or_all", value, ["基本のみ", "すべて"], resolve, reject);
                }
            }
        }
    }

    finish(bot, event, context, resolve, reject){
        return Promise.resolve().then(() => {
            if (context.confirmed.basic_or_all === "基本のみ"){
                return {
                    entries: [
                        {value:"ベンチプレス"},
                        {value:"スクワット"},
                        {value:"デッドリフト"}
                    ]
                }
            }

            return nlu.get_entity("workout_type");
        }).then((response) => {
            if (!response.entries || response.entries.length === 0){
                return Promise.reject(new Error("Workout type not found as entity."));
            }

            let workouts = ""
            let entries = response.entries.entries();
            for (let entry of entries){
                workouts += `- ${entry[1].value}`
                if (entry[0] < (response.entries.length - 1)){
                    workouts += "\n";
                }
            }

            let messages = [{
                type: "text",
                text: `${workouts}`
            },{
                type: "text",
                text: "このあたりですね。"
            }]

            return bot.reply(messages);
        }).then((response) => {
            return resolve();
        }).catch((error) => {
            return reject(error);
        });
    }
}
