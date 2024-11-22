const Screen = require("./Screen");

class ScreenOneChoice extends Screen {
    constructor(bot, id, query, buttons, cb_dictionary = {}, cb_storage, field, expected_response, cb_id, screen_var) {
        super(bot, id, query, cb_storage, field, expected_response, screen_var);
        this.buttons = buttons.map((row) => {
            return row.map((button) =>
                button.callback_data ? { ...button } : { ...button, callback_data: button.text.toString() }
            );
        });
        this.cb_dictionary = cb_dictionary;
        this.cb_id = cb_id;
    }

    async show(chatId, lives) {
        let buttons;
        if (lives) {
            buttons = [...this.buttons, [{ text: "К предыдущему вопросу", callback_data: "to_the_previous_question" }]];
        } else {
            buttons = this.buttons;
        }
        const mes = await this.bot.sendMessage(chatId, this.query, {
            reply_markup: {
                inline_keyboard: buttons
            }
        });
        return mes;
    }

    async text_dispatcher(msg) {
        return await this.cb_storage[this.cb_id](msg);
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
            return this.cb_storage[this.cb_dictionary[data]]();
        }
        if (this.cb_id) {
            const result = this.cb_storage[this.cb_id](query);
            if (result.next_screen) {
                return result.next_screen;
            } else {
                return null;
            }
        } else {
            return null;
        }
    }
}

module.exports = ScreenOneChoice;
