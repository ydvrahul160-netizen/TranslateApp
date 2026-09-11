const translateBtn = document.querySelector("#transfer");
const fromText = document.querySelector("#fromText");
const toText = document.querySelector("#toText");

const fromSpeaker = document.querySelector("#fromSpeaker");
const toSpeaker = document.querySelector("#toSpeaker");
const fromCopy = document.querySelector("#fromCopy");
const toCopy = document.querySelector("#toCopy");

const swapBtn = document.querySelector("#swap");

const fromCount = document.querySelector("#fromCount");
const toCount = document.querySelector("#toCount");
const statusMessage = document.querySelector("#statusMessage");

const selectTag = document.querySelectorAll("select");

let translationTimeout;

/* -----------------------------
   Character Count
----------------------------- */

function updateCharacterCount() {
    const fromLength = fromText.value.length;
    const toLength = toText.value.length;

    fromCount.textContent = `${fromLength} characters`;
    toCount.textContent = `${toLength} characters`;
}

fromText.addEventListener("input", updateCharacterCount);
toText.addEventListener("input", updateCharacterCount);


/* -----------------------------
   Status Message
----------------------------- */

function showStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = "status-message";

    if (type) {
        statusMessage.classList.add(type);
    }
}


/* -----------------------------
   Translation
----------------------------- */

async function translateText() {
    const text = fromText.value.trim();

    if (!text) {
        toText.value = "";
        updateCharacterCount();
        showStatus("Enter some text to translate.", "error");
        return;
    }

    const translateFrom = selectTag[0].value;
    const translateTo = selectTag[1].value;

    if (translateFrom === translateTo) {
        toText.value = text;
        updateCharacterCount();
        showStatus("Source and target languages are the same.", "error");
        return;
    }

    const apiURL =
        `https://api.mymemory.translated.net/get?` +
        `q=${encodeURIComponent(text)}` +
        `&langpair=${encodeURIComponent(translateFrom)}|${encodeURIComponent(translateTo)}`;

    translateBtn.disabled = true;
    translateBtn.classList.add("loading");

    showStatus("Translating...");

    try {
        const response = await fetch(apiURL);

        if (!response.ok) {
            throw new Error("Translation request failed.");
        }

        const data = await response.json();

        const translatedText = data?.responseData?.translatedText;

        if (!translatedText) {
            throw new Error("Translation could not be completed.");
        }

        toText.value = translatedText;

        updateCharacterCount();
        showStatus("Translation completed.", "success");

    } catch (error) {
        console.error("Translation error:", error);

        toText.value = "";
        updateCharacterCount();
        showStatus(
            "Unable to translate right now. Please try again.",
            "error"
        );

    } finally {
        translateBtn.disabled = false;
        translateBtn.classList.remove("loading");
    }
}


/* -----------------------------
   Translate Button
----------------------------- */

translateBtn.addEventListener("click", translateText);


/* -----------------------------
   Auto Translate While Typing
----------------------------- */

fromText.addEventListener("input", () => {
    clearTimeout(translationTimeout);

    const text = fromText.value.trim();

    if (!text) {
        toText.value = "";
        updateCharacterCount();
        showStatus("");
        return;
    }

    translationTimeout = setTimeout(() => {
        translateText();
    }, 700);
});


/* -----------------------------
   Copy Text
----------------------------- */

async function copyText(text, message) {
    if (!text.trim()) {
        showStatus("There is no text to copy.", "error");
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        showStatus(message, "success");
    } catch (error) {
        console.error("Copy error:", error);
        showStatus("Unable to copy text.", "error");
    }
}

fromCopy.addEventListener("click", () => {
    copyText(fromText.value, "Source text copied.");
});

toCopy.addEventListener("click", () => {
    copyText(toText.value, "Translation copied.");
});


/* -----------------------------
   Text to Speech
----------------------------- */

function speakText(text, language) {
    if (!text.trim()) {
        showStatus("There is no text to read.", "error");
        return;
    }

    if (!("speechSynthesis" in window)) {
        showStatus("Text-to-speech is not supported.", "error");
        return;
    }

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;

    speechSynthesis.speak(utterance);
}

fromSpeaker.addEventListener("click", () => {
    speakText(fromText.value, selectTag[0].value);
});

toSpeaker.addEventListener("click", () => {
    speakText(toText.value, selectTag[1].value);
});


/* -----------------------------
   Swap Languages + Text
----------------------------- */

swapBtn.addEventListener("click", () => {
    const tempText = fromText.value;

    fromText.value = toText.value;
    toText.value = tempText;

    const tempLang = selectTag[0].value;

    selectTag[0].value = selectTag[1].value;
    selectTag[1].value = tempLang;

    updateCharacterCount();
    showStatus("Languages swapped.", "success");

    if (fromText.value.trim()) {
        clearTimeout(translationTimeout);

        translationTimeout = setTimeout(() => {
            translateText();
        }, 300);
    }
});


/* -----------------------------
   Language Change
----------------------------- */

selectTag.forEach((select) => {
    select.addEventListener("change", () => {
        if (fromText.value.trim()) {
            clearTimeout(translationTimeout);

            translationTimeout = setTimeout(() => {
                translateText();
            }, 300);
        }
    });
});


/* -----------------------------
   Initial State
----------------------------- */

updateCharacterCount();