// Your HSR Cookie should look like this
// Ensure the name of the cookie is COOKIE
// _MHYUUID=xxxx ; mi18nLang=en-us ; ltoken=xxxx ; ltuid=xxxx ; cookie_token=xxxx ; account_id=xxxx
// Separate cookies for multiple accounts with a # symbol
// e.g. cookie1#cookie2

const scriptProperties = PropertiesService.getScriptProperties();

const COOKIE = scriptProperties.getProperty("COOKIE");
const DISCORD_WEBHOOK = scriptProperties.getProperty("DISCORD_WEBHOOK");

const HSR_ACT_ID = "e202303301540311";
const HSR_BASE_URL = "https://sg-public-api.hoyolab.com/event/luna/os";

const GENSHIN_ACT_ID = "e202102251931481";
const GENSHIN_BASE_URL = "https://sg-hk4e-api.hoyolab.com/event/sol";

const ZZZ_ACT_ID = "e202406031448091";
const ZZZ_BASE_URL = "https://sg-act-nap-api.hoyolab.com/event/luna/zzz/os";

class Discord {
    constructor (DISCORD_WEBHOOK) {
        this.webhook = DISCORD_WEBHOOK;
    }

    async send (data = {}, logged = false) {
        if (!this.webhook) {
            return;
        }

        if (logged) {
            const res = UrlFetchApp.fetch(this.webhook, {
                method: "POST",
                contentType: "application/json",
                payload: JSON.stringify({
                    embeds: [
                        {
                            title: "Hoyolab Auto Check-in",
                            author: {
                                name: "Hoyolab",
                                icon_url: "https://i.imgur.com/cakGdFP.png"
                            },
                            description: data.message,
                            color: 0xBB0BB5,
                            timestamp: new Date(),
                            footer: {
                                text: "Hoyolab Auto Check-in"
                            }
                        }
                    ],
                    username: "Hoyolab",
                    avatar_url: "https://i.imgur.com/cakGdFP.png"
                })
            });

            if (res.getResponseCode() !== 204) {
                throw new Error(`Discord webhook error: ${res.getResponseCode()}`);
            }

            return true;
        }

        const embed = Discord.generateEmbed(data);
        const res = UrlFetchApp.fetch(this.webhook, {
            method: "POST",
            contentType: "application/json",
            payload: JSON.stringify({
                embeds: [embed],
                username: "Hoyolab",
                avatar_url: "https://i.imgur.com/cakGdFP.png"
            })
        });

        if (res.getResponseCode() !== 204) {
            throw new Error(`Discord webhook error: ${res.getResponseCode()}`);
        }

        return true;
    }

    static generateEmbed (data = {}) {
        return {
            title: "Hoyolab Auto Check-in",
            author: {
                name: "Hoyolab",
                icon_url: "https://i.imgur.com/cakGdFP.png"
            },
            description: `Today's reward: ${data.award.name} x${data.award.count}`
        + `\nTotal signed: ${data.signed}`,
            color: 0xBB0BB5,
            timestamp: new Date(),
            footer: {
                text: "Hoyolab Auto Check-in"
            }
        };
    }
}

class StarRail {
    constructor (cookie) {
        if (typeof cookie !== "string" || typeof cookie === "undefined") {
            throw new Error("[HSR] cookie must be a string");
        }

        this.cookie = cookie;
    }

    static async sign (cookie) {
        const payload = {
            act_id: HSR_ACT_ID
        };

        const options = {
            method: "POST",
            headers: {
                "User-Agent": StarRail.userAgent,
                Cookie: cookie
            },
            payload: JSON.stringify(payload)
        };

        const res = UrlFetchApp.fetch(`${HSR_BASE_URL}/sign`, options);

        if (res.getResponseCode() !== 200) {
            throw new Error(`[HSR] Sign HTTP error: ${res.getResponseCode()}`);
        }

        const body = JSON.parse(res.getContentText());
        if (body.retcode !== 0 && body.message !== "OK") {
            throw new Error(`[HSR] Sign API error: ${body.message}`);
        }

        return true;
    }

    async run () {
        const cookies = this.parseCookies;

        let counter = 0;
        for (const cookie of cookies) {
            counter++;

            const info = await StarRail.getInfo(cookie);
            const data = {
                today: info.today,
                total: info.total_sign_day,
                issigned: info.is_sign,
                missed: info.sign_cnt_missed
            };

            const discord = new Discord(DISCORD_WEBHOOK);
            if (data.issigned) {
                await discord.send({ message: `[HSR][Account ${counter}]: You've already checked in today, Trailblazer~` }, true);
                console.log(`[HSR][Account ${counter}]: You've already checked in today, Trailblazer~`);
                continue;
            }

      const awards = await StarRail.awards(cookie);
            if (awards.length === 0) {
                throw new Error("[HSR] There's no awards to claim (?)");
            }

            const totalSigned = data.total;
            const awardData = {
                name: awards[totalSigned].name,
                count: awards[totalSigned].cnt
            };

            const sign = await StarRail.sign(cookie);
            if (sign) {
                console.log(`[HSR][Account ${counter}]: Signed in successfully! You have signed in for ${data.total + 1} days!`);
                console.log(`[HSR][Account ${counter}]: You have received ${awardData.count}x ${awardData.name}!`);

                if (!DISCORD_WEBHOOK || typeof DISCORD_WEBHOOK !== "string") {
                    console.log("[HSR] No Discord webhook provided, skipping...");
                    return true;
                }

                await discord.send({
                    signed: data.total + 1,
                    award: awardData
                });
            }
        }
    }

    static async getInfo (cookie) {
        const options = {
            headers: {
                "User-Agent": StarRail.userAgent,
                Cookie: cookie
            },
            muteHttpExceptions: true,
            method: "GET"
        };

        const res = UrlFetchApp.fetch(`${HSR_BASE_URL}/info?act_id=${HSR_ACT_ID}`, options);

        if (res.getResponseCode() !== 200) {
            throw new Error(`[HSR] Info HTTP error: ${res.getResponseCode()}`);
        }

        const body = JSON.parse(res.getContentText());
        if (body.retcode !== 0 && body.message !== "OK") {
            throw new Error(`[HSR] Info API error: ${body.message}`);
        }

        return body.data;
    }

    static async awards (cookie) {
        const options = {
            headers: {
                "User-Agent": StarRail.userAgent,
                Cookie: cookie
            },
            muteHttpExceptions: true,
            method: "GET"
        };

        const res = UrlFetchApp.fetch(`${HSR_BASE_URL}/home?act_id=${HSR_ACT_ID}`, options);

        if (res.getResponseCode() !== 200) {
            throw new Error(`[HSR] HTTP error: ${res.getResponseCode()}`);
        }

        const body = JSON.parse(res.getContentText());

        if (body.retcode !== 0 && body.message !== "OK") {
            throw new Error(`[HSR] API error: ${body.message}`);
        }

        return body.data.awards;
    }

    get parseCookies () {
        return this.cookie.split("#");
    }

    static get userAgent () {
        return "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Mobile Safari/537.36";
    }
}

class Genshin {
    constructor (cookie) {
        if (typeof cookie !== "string" || typeof cookie === "undefined") {
            throw new Error("[Genshin] cookie must be a string");
        }

        this.cookie = cookie;
    }

    static async sign (cookie) {
        const payload = {
            act_id: GENSHIN_ACT_ID
        };

        const options = {
            method: "POST",
            headers: {
                "User-Agent": Genshin.userAgent,
                Cookie: cookie
            },
            payload: JSON.stringify(payload)
        };

        const res = UrlFetchApp.fetch(`${GENSHIN_BASE_URL}/sign`, options);

        if (res.getResponseCode() !== 200) {
            throw new Error(`[Genshin] Sign HTTP error: ${res.getResponseCode()}`);
        }

        const body = JSON.parse(res.getContentText());
        if (body.retcode !== 0 && body.message !== "OK") {
            throw new Error(`[Genshin] Sign API error: ${body.message}`);
        }

        return true;
    }

    async run () {
        const cookies = this.parseCookies;

        let counter = 0;
        for (const cookie of cookies) {
            counter++;

            const info = await Genshin.getInfo(cookie);
            const data = {
                today: info.today,
                total: info.total_sign_day,
                issigned: info.is_sign,
                missed: info.sign_cnt_missed
            };

            const discord = new Discord(DISCORD_WEBHOOK);
            if (data.issigned) {
                await discord.send({ message: `[Genshin][Account ${counter}]: You've already checked in today, Traveler~` }, true);
                console.log(`[Genshin][Account ${counter}]: You've already checked in today, Traveler~`);
                continue;
            }

      const awards = await Genshin.awards(cookie);
            if (awards.length === 0) {
                throw new Error("[Genshin] There's no awards to claim (?)");
            }

            const totalSigned = data.total;
            const awardData = {
                name: awards[totalSigned].name,
                count: awards[totalSigned].cnt
            };

            const sign = await Genshin.sign(cookie);
            if (sign) {
                console.log(`[Genshin][Account ${counter}]: Signed in successfully! You have signed in for ${data.total + 1} days!`);
                console.log(`[Genshin][Account ${counter}]: You have received ${awardData.count}x ${awardData.name}!`);

                if (!DISCORD_WEBHOOK || typeof DISCORD_WEBHOOK !== "string") {
                    console.log("[Genshin] No Discord webhook provided, skipping...");
                    return true;
                }

                await discord.send({
                    signed: data.total + 1,
                    award: awardData
                });
            }
        }
    }

    static async getInfo (cookie) {
        const options = {
            headers: {
                "User-Agent": Genshin.userAgent,
                Cookie: cookie
            },
            muteHttpExceptions: true,
            method: "GET"
        };

        const res = UrlFetchApp.fetch(`${GENSHIN_BASE_URL}/info?act_id=${GENSHIN_ACT_ID}`, options);

        if (res.getResponseCode() !== 200) {
            throw new Error(`[Genshin] Info HTTP error: ${res.getResponseCode()}`);
        }

        const body = JSON.parse(res.getContentText());
        if (body.retcode !== 0 && body.message !== "OK") {
            throw new Error(`[Genshin] Info API error: ${body.message}`);
        }

        return body.data;
    }

    static async awards (cookie) {
        const options = {
            headers: {
                "User-Agent": Genshin.userAgent,
                Cookie: cookie
            },
            muteHttpExceptions: true,
            method: "GET"
        };

        const res = UrlFetchApp.fetch(`${GENSHIN_BASE_URL}/home?act_id=${GENSHIN_ACT_ID}`, options);

        if (res.getResponseCode() !== 200) {
            throw new Error(`[Genshin] HTTP error: ${res.getResponseCode()}`);
        }

        const body = JSON.parse(res.getContentText());

        if (body.retcode !== 0 && body.message !== "OK") {
            throw new Error(`[Genshin] API error: ${body.message}`);
        }

        return body.data.awards;
    }

    get parseCookies () {
        return this.cookie.split("#");
    }

    static get userAgent () {
        return "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Mobile Safari/537.36";
    }
}

class ZZZ {
    constructor (cookie) {
        if (typeof cookie !== "string" || typeof cookie === "undefined") {
            throw new Error("[ZZZ] cookie must be a string");
        }

        this.cookie = cookie;
    }

    static async sign (cookie) {
        const payload = {
            act_id: ZZZ_ACT_ID
        };

        const options = {
            method: "POST",
            headers: {
                "User-Agent": ZZZ.userAgent,
                Cookie: cookie
            },
            payload: JSON.stringify(payload)
        };

        const res = UrlFetchApp.fetch(`${ZZZ_BASE_URL}/sign`, options);

        if (res.getResponseCode() !== 200) {
            throw new Error(`[ZZZ] Sign HTTP error: ${res.getResponseCode()}`);
        }

        const body = JSON.parse(res.getContentText());
        if (body.retcode !== 0 && body.message !== "OK") {
            throw new Error(`[ZZZ] Sign API error: ${body.message}`);
        }

        return true;
    }

    async run () {
        const cookies = this.parseCookies;

        let counter = 0;
        for (const cookie of cookies) {
            counter++;

            const info = await ZZZ.getInfo(cookie);
            const data = {
                today: info.today,
                total: info.total_sign_day,
                issigned: info.is_sign,
                missed: info.sign_cnt_missed
            };

            const discord = new Discord(DISCORD_WEBHOOK);
            if (data.issigned) {
                await discord.send({ message: `[ZZZ][Account ${counter}]: You've already checked in today, Proxy~` }, true);
                console.log(`[ZZZ][Account ${counter}]: You've already checked in today, Proxy~`);
                continue;
            }

      const awards = await ZZZ.awards(cookie);
            if (awards.length === 0) {
                throw new Error("[ZZZ] There's no awards to claim (?)");
            }

            const totalSigned = data.total;
            const awardData = {
                name: awards[totalSigned].name,
                count: awards[totalSigned].cnt
            };

            const sign = await ZZZ.sign(cookie);
            if (sign) {
                console.log(`[ZZZ][Account ${counter}]: Signed in successfully! You have signed in for ${data.total + 1} days!`);
                console.log(`[ZZZ][Account ${counter}]: You have received ${awardData.count}x ${awardData.name}!`);

                if (!DISCORD_WEBHOOK || typeof DISCORD_WEBHOOK !== "string") {
                    console.log("[ZZZ] No Discord webhook provided, skipping...");
                    return true;
                }

                await discord.send({
                    signed: data.total + 1,
                    award: awardData
                });
            }
        }
    }

    static async getInfo (cookie) {
        const options = {
            headers: {
                "User-Agent": ZZZ.userAgent,
                Cookie: cookie
            },
            muteHttpExceptions: true,
            method: "GET"
        };

        const res = UrlFetchApp.fetch(`${ZZZ_BASE_URL}/info?act_id=${ZZZ_ACT_ID}`, options);

        if (res.getResponseCode() !== 200) {
            throw new Error(`[ZZZ] Info HTTP error: ${res.getResponseCode()}`);
        }

        const body = JSON.parse(res.getContentText());
        if (body.retcode !== 0 && body.message !== "OK") {
            throw new Error(`[ZZZ] Info API error: ${body.message}`);
        }

        return body.data;
    }

    static async awards (cookie) {
        const options = {
            headers: {
                "User-Agent": ZZZ.userAgent,
                Cookie: cookie
            },
            muteHttpExceptions: true,
            method: "GET"
        };

        const res = UrlFetchApp.fetch(`${ZZZ_BASE_URL}/home?act_id=${ZZZ_ACT_ID}`, options);

        if (res.getResponseCode() !== 200) {
            throw new Error(`[ZZZ] HTTP error: ${res.getResponseCode()}`);
        }

        const body = JSON.parse(res.getContentText());

        if (body.retcode !== 0 && body.message !== "OK") {
            throw new Error(`[ZZZ] API error: ${body.message}`);
        }

        return body.data.awards;
    }

    get parseCookies () {
        return this.cookie.split("#");
    }

    static get userAgent () {
        return "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Mobile Safari/537.36";
    }
}

function run () {
    const starRail = new StarRail(COOKIE);
    starRail.run()
        .catch((e) => {
            console.error(e);
        });
    const genshin = new Genshin(COOKIE);
    genshin.run()
        .catch((e) => {
            console.error(e);
        });
    const zzz = new ZZZ(COOKIE);
    zzz.run()
        .catch((e) => {
            console.error(e);
        });

}
