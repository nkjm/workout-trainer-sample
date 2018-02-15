"use strict";

module.exports = class SkillWelcome {
    finish(bot, event, context, resolve, reject){
        bot.plugin.google.sdk.ask("これはどうも。");
        return resolve();
    }
}
