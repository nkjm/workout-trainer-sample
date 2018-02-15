"use strict";

const debug = require("debug")("bot-express:skill");
const user_db = require("../service/user");
const parse = require("../service/parser");
const workout_db = require("../service/workout");

module.exports = class SkillWorkout {
    constructor(){
        this.clear_context_on_finish = true;

        this.required_parameter = {
            workout_type: {
                message_to_confirm: {
                    type: "text",
                    text: "OK. 何のワークアウトをやりましたか？"
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
                reaction: (error, value, bot, event, context, resolve, reject) => {
                    if (error) return resolve();

                    return workout_db.get_workout(value).then((response) => {
                        if (response.require_weight){
                            bot.collect("weight");
                        }
                        return resolve();
                    })
                }
            },
            rep: {
                message_to_confirm: {
                    type: "text",
                    text: "1セットあたり何回やりましたか？"
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (value === "") return reject();

                    return parse.identify(context.sender_language, "parse_number", value).then((response) => {
                        if (response){
                            return resolve(response);
                        }
                        return reject();
                    })
                },
            },
            workout_report: {
                message_to_confirm: {
                    type: "text",
                    text: "お疲れ。今回の負荷がどうだったか教えてください。"
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    parse.identify(context.sender_language, "parse_workout_report", value).then((response) => {
                        if (response){
                            return resolve(response);
                        }
                        return reject();
                    })
                },
                reaction: (error, value, bot, event, context, resolve, reject) => {
                    if (error) {
                        if (value === "") return resolve();
                        bot.change_message_to_confirm("workout_report", {
                            type: "text",
                            text: "一体お前は何を言ってるんだ。楽勝だったのか、ギリギリまで追い込めたのか、それを答えろ。"
                        });
                    }
                    return resolve();
                }
            }
        }

        this.optional_parameter = {
            weight: {
                message_to_confirm: {
                    type: "text",
                    text: "何キロでやりましたか？"
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    parse.identify(context.sender_language, "parse_number", value).then((response) => {
                        if (response){
                            return resolve(response);
                        }
                        return reject();
                    })
                },
            }
        }
    }

    finish(bot, event, context, resolve, reject){
        let tasks = [];

        // Save the workout record.
        tasks.push(
            user_db.save_workout_history(bot.extract_sender_id(), context.confirmed, bot.type)
        );

        // Reply.
        let message;
        if (context.confirmed.weight){
            message = {
                type: "text",
                text: `では${context.confirmed.workout_type}について、今回は${context.confirmed.weight}キロ・${context.confirmed.rep}レップで${context.confirmed.workout_report}だったことを記録しておきます。`
            }
        } else {
            message = {
                type: "text",
                text: `では${context.confirmed.workout_type}について、今回は${context.confirmed.rep}レップで${context.confirmed.workout_report}だったことを記録しておきます。`
            }
        }

        tasks.push(
            bot.reply(message)
        );

        return Promise.all(tasks).then((response) => {
            return resolve();
        })
    }
}
