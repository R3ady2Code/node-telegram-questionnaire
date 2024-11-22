//AT WORK. NOT COMPLETE!

const Screen = require("./Screen");
const { bot_API_TOKEN } = require("../api_tokens");
const generateLinkToPhoto = require("../generateLinkToPhoto");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

class ScreenPhoto extends Screen {
    constructor(bot, id, query, cb_storage, field, is_complete, screen_var) {
        super(bot, id, query, cb_storage, field, screen_var);
        this.is_complete = is_complete;
    }

    async show(chatId) {
        const mes = await this.bot.sendMessage(chatId, this.query);
        return mes;
    }

    async photo_dispatcher(msg) {
        const photoId = msg.photo[msg.photo.length - 1].file_id;
        const fileInfo = await this.bot.getFile(photoId);
        const photoUrl = `https://api.telegram.org/file/bot${bot_API_TOKEN}/${fileInfo.file_path}`;
        const photo = await fetch(photoUrl).then((res) => res.buffer());
        const link = await generateLinkToPhoto(photo);
        console.log({ message: this.is_complete && "complete", link });
        return {
            message: this.is_complete && "complete",
            link
        };
    }
}

module.exports = ScreenPhoto;
