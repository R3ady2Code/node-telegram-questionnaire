const Screen = require("./Screen");

class ScreenBoolean extends Screen {
    constructor(
        bot,
        id,
        query,
        buttons = { true: { text: "Да", callback_data: "true" }, false: { text: "Нет", callback_data: "false" } },
        cb_dictionary = {},
        cb_storage,
        field,
        expected_response,
        screen_var
    ) {
        super(bot, id, query, cb_storage, field, expected_response, screen_var);
        this.buttons = buttons;
        this.cb_dictionary = cb_dictionary;
    }

    async show(chatId, lives) {
        let buttons;
        if (lives) {
            buttons = [
                [{ ...this.buttons.true, callback_data: "true" }],
                [{ ...this.buttons.false, callback_data: "false" }],
                [{ text: "К предыдущему вопросу", callback_data: "to_the_previous_question" }]
            ];
        } else {
            buttons = [
                [{ ...this.buttons.true, callback_data: "true" }],
                [{ ...this.buttons.false, callback_data: "false" }]
            ];
        }
        return await this.bot.sendMessage(chatId, this.query, {
            reply_markup: {
                inline_keyboard: buttons
            }
        });
    }

    async callback_query_dispatcher(query) {
        const data = query.data;

        if (data === "to_the_previous_question") {
            return { message: "to_prev_screen" };
        }

        if (typeof this.cb_dictionary[data] === "function") {
            return this.cb_dictionary[data];
        }
        if (this.cb_dictionary[data]?.next_screen) {
            return this.cb_dictionary[data].next_screen;
        }
        if (typeof this.cb_dictionary[data] === "string") {
            if (this.cb_dictionary[data] === "complete") {
                return { message: "complete", function: this.cb_storage[this.cb_dictionary[data]]() };
            }
            return this.cb_storage[this.cb_dictionary[data]](query);
        } else {
            return null;
        }
    }
}

module.exports = ScreenBoolean;
