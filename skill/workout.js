"use strict";

const debug = require("debug")("bot-express:skill");
const user_db = require("../service/user");
const parse = require("../service/parser");
const workout_db = require("../service/workout");

module.exports = class SkillWorkout {
    constructor(){
        this.required_parameter = {
            workout_type: {
                message_to_confirm: {
                    type: "text",
                    text: "OK. 何のワークアウトをやりますか？"
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
                    if (error){
                        if (value === "") return resolve();
                        bot.change_message_to_confirm("workout_type", {
                            type: "text",
                            text: "能書きはそこまでだ。スクワットと答えろ。"
                        })
                        return resolve();
                    }

                    // We'll get workout detail and latest workout history of this workout type.
                    let tasks = [];

                    // Get latest workout history
                    tasks.push(
                        user_db.get_latest_workout_history(bot.extract_sender_id(), context.confirmed.workout_type).then((workout_history) => {
                            if (workout_history){
                                context.confirmed.latest_workout_history = workout_history;
                            }
                            return;
                        })
                    )

                    // Get workout detail
                    tasks.push(
                        workout_db.get_workout(value).then((response) => {
                            if (response.require_weight){
                                bot.collect("weight");
                            }
                            return;
                        })
                    )

                    return Promise.all(tasks).then((responses) => {
                        return resolve();
                    })
                },
                sub_skill: ["show-workouts", "instruct-workout"]
            },
            rep: {
                message_to_confirm: (bot, event, context, resolve, reject) => {
                    let message;
                    if (context.confirmed.latest_workout_history && !context.confirmed.latest_workout_history.weight){
                        message = {
                            type: "text",
                            text: `3セットやるとして1セットあたり何回やりますか？ ちなみに前回は${context.confirmed.latest_workout_history.rep}レップで${context.confirmed.latest_workout_history.workout_report}でした。`
                        }
                    } else {
                        message = {
                            type: "text",
                            text: "3セットやるとして1セットあたり何回やりますか？"
                        }
                    }
                    return resolve(message);
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
                reaction: (error, value, bot, event, context, resolve, reject) => {
                    if (error){
                        if (value === "") return resolve();
                        bot.change_message_to_confirm("rep", {
                            type: "text",
                            text: "もう一度くだらないことをぬかすと1000回だ。"
                        });
                        return resolve();
                    }

                    let message = {
                        type: "text",
                        text: `OK、${value}回ね。`
                    }

                    if (context.confirmed.latest_workout_history && (Number(value) > Number(context.confirmed.latest_workout_history.rep))){
                        message.text += "増やしてきたねー。"
                    }

                    bot.queue(message);
                    return resolve();
                },
                sub_skill: ["instruct-workout"]
            }
        }

        this.optional_parameter = {
            weight: {
                message_to_confirm: (bot, event, context, resolve, reject) => {
                    let message;
                    if (context.confirmed.latest_workout_history){
                        message = {
                            type: "text",
                            text: `何キロでいきますか？ ちなみに前回は${context.confirmed.latest_workout_history.weight}キロ・${context.confirmed.latest_workout_history.rep}レップで${context.confirmed.latest_workout_history.workout_report}でした。`
                        }
                    } else {
                        message = {
                            type: "text",
                            text: "何キロでいきますか？"
                        }
                    }
                    return resolve(message);
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    parse.identify(context.sender_language, "parse_number", value).then((response) => {
                        if (response){
                            return resolve(response);
                        }
                        return reject();
                    })
                },
                reaction: (error, value, bot, event, context, resolve, reject) => {
                    if (error) {
                        if (value === "") return resolve();
                        bot.change_message_to_confirm("weight", {
                            type: "text",
                            text: "今すぐ何キロか答えろ。300キロにして欲しいのか。"
                        })
                        return resolve();
                    }

                    let message = {
                        type: "text",
                        text: `OK、${value}キロね。`
                    }

                    if (context.confirmed.latest_workout_history && (Number(value) > Number(context.confirmed.latest_workout_history.weight))){
                        message.text += "上げてきたねー。"
                    }

                    bot.queue(message);
                    return resolve();
                },
                sub_skill: ["instruct-workout"]
            }
        }
    }

    finish(bot, event, context, resolve, reject){
        let tasks = [];

        return bot.reply({
            type: "text",
            text: "ではワークアウトを開始してください。終わったらワークアウトが完了したことを教えてください。"
        }).then((response) => {
            return resolve();
        });
    }
}
