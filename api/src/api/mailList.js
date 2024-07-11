// Loading mailgun reader and config
const mailgunReader = require("../mailgunReader");
const mailgunConfig = require("../../config/mailgunConfig");
const cacheControl  = require("../../config/cacheControl");

const reader = new mailgunReader(mailgunConfig);

/**
 * Mail listing API, returns the list of emails
 *
 * @param {*} req
 * @param {*} res
 */
module.exports = function(req, res) {
    let params = req.query;

    // recipient may be:
    // only the username, e.g. "john.doe"
    // or the full email, e.g. "john.doe@domain.com"
    let recipient = params.recipient;

    // Check if recipient is empty
    if (!recipient) {
        return res.status(400).send({ error: "No valid `recipient` param found" });
    }

    // Trim leading and trailing whitespace
    recipient = recipient.trim();

    // If recipient ends with `"@"+mailgunConfig.emailDomain`, remove it
    let pos = recipient.indexOf("@" + mailgunConfig.emailDomain);
    if (pos >= 0) {
        recipient = recipient.substring(0, pos);
    }

    // Validate recipient
    try {
        recipient = validateUsername(recipient);
    } catch (e) {
        return res.status(400).send({ error: "Invalid email" });
    }

    // Empty check
    if (!recipient) {
        return res.status(400).send({ error: "No valid `recipient` param found" });
    }

    reader.recipientEventList(recipient + "@" + mailgunConfig.emailDomain)
        .then(response => {
            res.set('cache-control', cacheControl.dynamic);
            res.status(200).send(response.items);
        })
        .catch(e => {
            console.error(`Error getting list of messages for "${recipient}":`, e);
            res.status(500).send({ error: e.toString() });
        });
};

/**
 * Strictly validate username, rejecting any username that does not conform to the standards
 * @param {*} username username to be validated
 * @returns {string} Validated username
 */
function validateUsername(username) {
    // Step 1: Trim leading and trailing whitespaces
    username = username.trim();

    // Step 2: Throw error if the sanitized string is empty
    if (username.length === 0) {
        throw new Error("Invalid email: Username cannot be empty.");
    }

    // Step 3: Check for disallowed characters
    // Allowed characters: alphanumeric, dot (.), underscore (_), hyphen (-), plus (+)
    const disallowedChars = /[^a-zA-Z0-9._+-]/;
    if (disallowedChars.test(username)) {
        throw new Error("Invalid email: Username contains disallowed characters.");
    }

    // Step 4: Ensure that the username contains at least one alphanumeric character
    if (!/[a-zA-Z0-9]/.test(username)) {
        throw new Error("Invalid email: Username must contain at least one alphanumeric character.");
    }

    // Step 5: Check for consecutive dots
    if (/\.{2,}/.test(username)) {
        throw new Error("Invalid email: Username cannot contain consecutive dots.");
    }

    // Step 6: Ensure that the username starts and ends with an alphanumeric character
    if (/^[._+-]/.test(username) || /[._+-]$/.test(username)) {
        throw new Error("Invalid email: Username must start and end with an alphanumeric character.");
    }

    // Step 7: Prevent pure numeric usernames and ensure it starts or ends with an alphabetical character
    if (/^\d+$/.test(username) || !(/^[a-zA-Z]/.test(username) || /[a-zA-Z]$/.test(username))) {
        throw new Error("Invalid email: Username must not be purely numeric and must start or end with an alphabetical character.");
    }

if (recipient.toLowerCase() === "akunlama.com") {
    return res.status(400).send({ error: "Direct use of 'akunlama.com' is not allowed" });
}
    return username;
}
