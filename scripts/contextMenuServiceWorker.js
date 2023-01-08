const getKey = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['openai-key'], (result) => {
            if (result['openai-key']) {
                const decodedKey = atob(result['openai-key']);
                resolve(decodedKey);
            }
        });
    });
};

const sendMessage = (content) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0].id;

        chrome.tabs.sendMessage(
            activeTab,
            { message: 'inject', content },
            (response) => {
                if (response.status === 'failed') {
                    console.log('injection failed.');
                }
            }
        );
    });
};


const generate = async (prompt) => {
    const key = await getKey();
    const url = 'https://api.openai.com/v1/completions';

    const completionResponse = await fetch(url, {
        method:'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
            model: 'text-davinci-003',
            prompt: prompt,
            max_tokens: 250,
            temperature: 0.7,
        }),
    });

    const completion = await completionResponse.json();
    return completion.choices.pop();
}
const checkForTooMuchContent = (text) => {
    if (text.length > 15000) {
        return true;
    }
    return false
}

const generateCompletionAction = async (info) => {
    // add a limit of 15000 chars aka ~3.2k tokens
    // with response, this comes out to ~3.5k tokens limit
    const MAX_CONTENT_LENGTH = 15000

    try{
        //send message to frontend while generating
        sendMessage('generating...');

        const { selectionText } = info;
        const basePromptPrefix =
            'Give me a summary of this content\n\nContent:';


        const tooMuchContent = (selectionText.length > MAX_CONTENT_LENGTH) ? true : false;

        let baseCompletion;

        if (!tooMuchContent) {
            console.log(`selected content is at ${selectionText.length}. Will call OpenAI API.`);
            baseCompletion = await generate(`${basePromptPrefix}${selectionText}`);
        }
        else {
            baseCompletion = {};
            baseCompletion.text = `Hilight less content. max ${MAX_CONTENT_LENGTH} chars. selected ${selectionText.length} chars`
        }

        // had a bug in regards to format of output. may need to clean up
        console.log(baseCompletion.text)

        // send content to UI once done
        sendMessage(baseCompletion.text);

    } catch (error) {
        console.log(error);

        // add msg incase of any errors
        sendMessage(error.toString());
    }

};

// Add this in scripts/contextMenuServiceWorker.js
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'context-run',
        title: 'Summarize',
        contexts: ['selection'],
    });
});

// Add listener
chrome.contextMenus.onClicked.addListener(generateCompletionAction);