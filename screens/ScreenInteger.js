const Screen = require("./Screen");

class ScreenInteger extends Screen {
    constructor(bot, id, query, cb_id, cb_storage, field, expected_response, screen_var) {
        super(bot, id, query, cb_storage, field, expected_response, screen_var);
        this.cb_id = cb_id;
    }

    async text_dispatcher(msg) {
        return await this.cb_storage[this.cb_id](msg);
    }

    async callback_query_dispatcher(query) {
        const data = query.data;

        if (data === "to_the_previous_question") {
            return { message: "to_prev_screen" };
        }
    }
}

module.exports = ScreenInteger;
