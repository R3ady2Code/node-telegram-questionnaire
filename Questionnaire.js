const ScreenBoolean = require("./screens/ScreenBoolean");
const ScreenOneChoice = require("./screens/ScreenOneChoice");
const ScreenInteger = require("./screens/ScreenInteger");
const ScreenPhoto = require("./screens/ScreenPhoto");

const redis = require("./redis");

//Bot must be initialized by node-telegram-bot-api
class Questionnaire {
    constructor(bot, screens, cb_storage, user, active_screen_id = screens[0].id, last_msg, answers) {
        this.bot = bot;
        this._screens = screens.map((screen) => {
            switch (screen.type) {
                case "boolean":
                    return new ScreenBoolean(
                        this.bot,
                        screen.id,
                        screen.query,
                        screen.buttons,
                        screen.cb_dictionary,
                        cb_storage,
                        screen.field,
                        screen.expected_response,
                        screen.var
                    );
                case "one_choice":
                    return new ScreenOneChoice(
                        this.bot,
                        screen.id,
                        screen.query,
                        screen.buttons,
                        screen.cb_dictionary,
                        cb_storage,
                        screen.field,
                        screen.expected_response,
                        screen?.cb_id,
                        screen.var
                    );
                case "integer":
                    return new ScreenInteger(
                        this.bot,
                        screen.id,
                        screen.query,
                        screen.cb_id,
                        cb_storage,
                        screen.field,
                        screen.expected_response,
                        screen.var
                    );
                case "photo":
                    return new ScreenPhoto(
                        this.bot,
                        screen.id,
                        screen.query,
                        cb_storage,
                        screen.field,
                        screen.is_complete,
                        screen.var
                    );
                default:
                    throw new Error(`Тип экрана указан некорректно ${screen.type}`);
            }
        });
        this.cb_storage = cb_storage;
        this._active_screen_id = active_screen_id;
        this.user = user;
        this._last_msg = last_msg;
        this.answers = answers ? answers : {};
        this.lives = 2;
        this.prev_screen_id;
    }

    async start(chatId) {
        this.active_screen_id = this._screens[0].id;
        await this.show(chatId, true);
    }

    async show(chatId, isFirstScreen) {
        console.log(`Screen для ${this.user.first_name} ${this.user.last_name} ${this.active_screen.query}`);

        if (this.active_screen.var) {
            if (this.active_screen.var === "last_answer") {
                this.active_screen.set_var(this.answers[this.prev_screen.field].answer);
            }
        }

        this.last_msg = await this.active_screen.show(chatId, !isFirstScreen && this.lives);
    }

    async showPrev(chatId) {
        this.lives--;
        this.last_msg = await this.prev_screen.show(chatId, 0);
        this.active_screen_id = this.prev_screen_id;
    }

    get last_msg() {
        return this._last_msg;
    }

    set last_msg(val) {
        redis.set(`last_msg/${this.user.id}`, JSON.stringify(val)).catch((err) => console.log(err));
        this._last_msg = val;
    }

    async text_dispatcher(msg) {
        const chatId = msg.chat.id;
        this.answers[this.active_screen.field] = {
            answer: msg.text,
            query: this.active_screen.query,
            expected_response: this.active_screen.expected_response
        };

        const resultDispatcher = await this.active_screen.text_dispatcher(msg);
        await this.bot
            .deleteMessage(chatId, this.last_msg.message_id)
            .catch((err) => console.error("Error delete mess: ", err));
        if (resultDispatcher === "ERROR") {
            this.show(chatId, false);
            return;
        }

        await this.bot
            .deleteMessage(chatId, this.last_msg.message_id)
            .catch((err) => console.error("Error delete mess: ", err));
        if (resultDispatcher?.message === "to_prev_screen") {
            await this.showPrev(chatId);
            return;
        }
        this.prev_screen_id = this.active_screen_id;
        await redis.set(`task_answer/${this.user.id}`, JSON.stringify(this.answers)).catch((err) => console.log(err));

        if (resultDispatcher) {
            if (typeof resultDispatcher === "function") {
                await resultDispatcher(msg);
                await this.next(chatId);
            } else if (resultDispatcher.next_screen) {
                this.active_screen_id = resultDispatcher.next_screen;
                await this.show(chatId);
            }
        } else {
            return this.next(chatId);
        }
    }

    async callback_query_dispatcher(query) {
        const chatId = query.message.chat.id;

        const resultDispatcher = await this.active_screen.callback_query_dispatcher(query);
        await this.bot
            .deleteMessage(chatId, this.last_msg.message_id)
            .catch((err) => console.error("Error delete mess: ", err));

        if (resultDispatcher === "ERROR") {
            this.show(chatId, false);
            return;
        }

        if (resultDispatcher?.message === "to_prev_screen") {
            await this.showPrev(chatId);
            return;
        }

        if (
            query?.message?.reply_markup?.inline_keyboard[0][0]?.callback_data === "true" &&
            query?.message?.reply_markup?.inline_keyboard[1][0]?.callback_data === "false"
        ) {
            let answer;
            query?.message?.reply_markup?.inline_keyboard.forEach((row) => {
                const button = row[0];
                if (button.callback_data === query.data) answer = `${button.text} (${query.data})`;
            });
            this.answers[this.active_screen.field] = {
                answer,
                query: this.active_screen.query,
                expected_response: this.active_screen.expected_response
            };
        } else {
            this.answers[this.active_screen.field] = {
                answer: query.data,
                query: this.active_screen.query,
                expected_response: this.active_screen.expected_response
            };
        }

        this.prev_screen_id = this.active_screen_id;
        await redis.set(`task_answer/${this.user.id}`, JSON.stringify(this.answers)).catch((err) => console.log(err));

        if (resultDispatcher) {
            if (typeof resultDispatcher === "function") {
                await resultDispatcher();
                await this.next(chatId);
            }
            if (resultDispatcher.message === "complete") {
                return;
            } else {
                this.active_screen_id = resultDispatcher;
                await this.show(chatId);
            }
        } else {
            return this.next(chatId);
        }
    }

    async photo_dispatcher(msg) {
        const chatId = msg.chat.id;
        const resultDispatcher = await this.active_screen.photo_dispatcher(msg);
        await this.bot
            .deleteMessage(chatId, this.last_msg.message_id)
            .catch((err) => console.error("Error delete mess: ", err));

        if (resultDispatcher === "ERROR") {
            this.show(chatId, false);
            return;
        }

        this.answers[this.active_screen.field] = {
            answer: resultDispatcher.link,
            query: this.active_screen.query,
            expected_response: this.active_screen.expected_response
        };

        this.prev_screen_id = this.active_screen_id;
        await redis.set(`task_answer/${this.user.id}`, JSON.stringify(this.answers)).catch((err) => console.log(err));
        if (resultDispatcher.message === "complete") {
            return this.cb_storage.complete();
        } else {
            return this.next(chatId);
        }
    }

    async next(chatId) {
        const activeIndex = this._screens.indexOf(this.active_screen);
        this.active_screen_id = this._screens[activeIndex + 1]?.id;

        if (this.active_screen_id) await this.show(chatId);
    }

    get prev_screen() {
        return this._screens.find(({ id }) => id === this.prev_screen_id);
    }

    get active_screen() {
        return this._screens.find(({ id }) => id === this.active_screen_id);
    }

    get active_screen_id() {
        return this._active_screen_id;
    }

    set active_screen_id(id) {
        redis.set(`active_screen_id/${this.user.id}`, id).catch((err) => console.log(err));
        this._active_screen_id = id;
    }

    async quit() {
        return this.answers;
    }
}

module.exports = Questionnaire;
