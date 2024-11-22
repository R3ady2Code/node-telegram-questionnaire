class Screen {
    id;
    query;
    buttons;

    constructor(bot, id, query, cb_storage = {}, field, expected_response, screen_var) {
        this.bot = bot;
        this.id = id;
        this.query = query;
        this.cb_storage = cb_storage;
        this.field = field;
        this.expected_response = expected_response;
        this.set_var(screen_var);
    }

    set_var(screen_var) {
        this.var = screen_var;
    }

    async show(chatId, lives) {
        if (this.query.includes("@var")) {
            this.query = this.query.replace("@var", this.var);
        }
        if (lives) {
            return await this.bot.sendMessage(chatId, this.query, {
                reply_markup: {
                    inline_keyboard: [[{ text: "К предыдущему вопросу", callback_data: "to_the_previous_question" }]]
                }
            });
        } else {
            return await this.bot.sendMessage(chatId, this.query);
        }
    }

    text_dispatcher() {
        console.log("Введен неверный тип данных");
        return "ERROR";
    }

    callback_query_dispatcher() {
        console.log("Введен неверный тип данных");
        return "ERROR";
    }

    document_dispatcher() {
        console.log("Введен неверный тип данных");
        return "ERROR";
    }

    photo_dispatcher() {
        console.log("Введен неверный тип данных");
        return "ERROR";
    }
}

module.exports = Screen;
